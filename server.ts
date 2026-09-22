import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const SAPL_BASE = "https://sapl.uba.mg.leg.br";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Estado compartilhado em memória para sincronização do telão
  let estadoTelaoCompartilhado: any = {
    tituloSessao: "CONSIDERAÇÕES FINAIS",
    oradorAtual: "AGUARDANDO INÍCIO",
    cronometro: "05:00",
    cronometroCor: "",
    cronometroOculto: false,
    proximoOrador: "Próximo(a) Orador(a): ---",
    modoSessao: "consideracoes",
    opacidadeBrasao: "0.5",
    corNomeOrador: "#ffffff",
    corCronometro: "#ffffff",
    saplSessaoId: "1947",
    timestamp: Date.now()
  };

  let sessaoSaplIdAtual = "1947";

  app.get("/api/estado-telao", (req, res) => {
    res.json(estadoTelaoCompartilhado);
  });

  app.post("/api/estado-telao", (req, res) => {
    if (req.body && typeof req.body === "object") {
      estadoTelaoCompartilhado = {
        ...estadoTelaoCompartilhado,
        ...req.body,
        timestamp: Date.now()
      };
      if (req.body.saplSessaoId) {
        sessaoSaplIdAtual = String(req.body.saplSessaoId).trim();
      }
    }
    res.json({ ok: true, timestamp: estadoTelaoCompartilhado.timestamp });
  });

  app.get("/api/sapl/sessao-id", (req, res) => {
    res.json({ sessaoId: sessaoSaplIdAtual });
  });

  app.post("/api/sapl/sessao-id", (req, res) => {
    if (req.body && req.body.sessaoId) {
      sessaoSaplIdAtual = String(req.body.sessaoId).trim();
      estadoTelaoCompartilhado.saplSessaoId = sessaoSaplIdAtual;
    }
    res.json({ ok: true, sessaoId: sessaoSaplIdAtual });
  });

  // Add the API route for SAPL
  app.get("/api/sapl/pauta/:sessaoId", async (req, res) => {
    try {
      const sessaoId = req.params.sessaoId;
      const url = `${SAPL_BASE}/sessao/${sessaoId}/ordemdia`;
      
      const resposta = await fetch(url, {
        headers: {
          "User-Agent": "Portal-Pautas-CMU/1.0"
        }
      });
      
      if (!resposta.ok) {
        return res.status(resposta.status).json({ error: `SAPL respondeu HTTP ${resposta.status}` });
      }
      
      const html = await resposta.text();
      
      const sessao = await extrairDadosSessao(html, sessaoId);
      const materias = extrairMaterias(html);
      
      const ordemDoDia = [];
      const apresentacao = [];
      const emendas = [];
      
      for (const materia of materias) {
          if (ehProjeto(materia.tipo)) {
              materia.emendas = [];
              ordemDoDia.push(materia);
              continue;
          }
          if (ehEmenda(materia.tipo)) {
              emendas.push(materia);
              continue;
          }
          apresentacao.push(materia);
      }
      
      vincularEmendasAosProjetos(emendas, ordemDoDia);
      
      const materiasParaExibir = ordemDoDia.length > 0 ? ordemDoDia : materias;

      res.json({
        ok: true,
        sessaoId: Number(sessaoId),
        sessao,
        ordemDoDia: materiasParaExibir,
        materias,
        apresentacao,
        fonte: url
      });
      
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use(express.static(process.cwd()));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// ---------------------------------------------
// SAPL PARSING LOGIC (from user's code)
// ---------------------------------------------

async function extrairDadosSessao(html: string, sessaoId: string) {
  const padroes = [
    /(\d+)ª\s+(Ordinária|Extraordinária|Solene)/i,
    /(\d+)ª\s+Reunião\s+(Ordinária|Extraordinária|Solene)/i
  ];
  let numero = null;
  let tipo = null;
  for (const padrao of padroes) {
    const match = html.match(padrao);
    if (match) {
      numero = Number(match[1]);
      tipo = match[2];
      break;
    }
  }

  let data = null;
  let ano = null;
  let hora = null;
  try {
    const respostaAPI = await fetch(`${SAPL_BASE}/api/sessao-plenaria/${sessaoId}/`, {
        headers: { "Accept": "application/json", "User-Agent": "Portal-Pautas-CMU/1.0" }
    });
    if (respostaAPI.ok) {
      const dadosAPI = await respostaAPI.json();
      if (dadosAPI.datReuniaoString) {
        const partes = dadosAPI.datReuniaoString.split(" ");
        data = partes[0] || null;
        const horaCompleta = partes[1] || null;
        if (data) {
          ano = Number(data.split("/")[2]);
        }
        if (horaCompleta) {
          const partesHora = horaCompleta.split(":");
          hora = `${partesHora[0]}h${partesHora[1] === "00" ? "" : partesHora[1]}`;
        }
      }
    }
  } catch (erro: any) {
    console.log("Não foi possível obter a data da sessão:", erro.message);
  }

  return { id: Number(sessaoId), numero, tipo, data, ano, hora };
}

function extrairMaterias(html: string) {
  const materias = [];
  const regex = /<a[^>]*\bid\s*=\s*["']?(\d+)["']?[^>]*\bhref\s*=\s*["']?\/materia\/(\d+)["']?[^>]*>([\s\S]*?)<\/a>/gi;
  const encontrados = [...html.matchAll(regex)];

  for (let i = 0; i < encontrados.length; i++) {
    const atual = encontrados[i];
    const materiaId = Number(atual[2]);
    const titulo = limparHTML(atual[3]);
    const tituloMatch = titulo.match(/^(.*?)\s+n[º°]\s*(\d+)\s+de\s+(\d{4})/i);
    if (!tituloMatch) continue;

    const tipo = tituloMatch[1].trim();
    const numero = Number(tituloMatch[2]);
    const ano = Number(tituloMatch[3]);
    
    // As `matchAll` result has `.index`, typescript needs casting or just use it
    const inicio = (atual as any).index;
    const fim = (encontrados[i + 1] as any)?.index ?? html.length;
    const bloco = html.slice(inicio, fim);

    let autor = "";
    let autores = extrairAutoresDoBloco(bloco);
    autor = autores.length === 1 ? autores[0] : "";

    let ementa = "";
    const ementaMatch = bloco.match(/<div[^>]*class\s*=\s*["'][^"']*dont-break-out[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    if (ementaMatch) {
      ementa = limparHTML(ementaMatch[1]);
    }

    materias.push({
      id: materiaId,
      tipo,
      numero,
      ano,
      identificacao: `${tipo} n.º ${numero}/${ano}`,
      autor,
      autores,
      ementa
    });
  }
  return removerDuplicados(materias);
}

function ehProjeto(tipo: string) {
  const t = normalizar(tipo);
  return (
    t.includes("projeto de lei complementar") ||
    t.includes("projeto de lei") ||
    t.includes("projeto de resolucao") ||
    t.includes("projeto de decreto legislativo") ||
    t.includes("proposta de emenda") ||
    t.includes("projeto de emenda a lom") ||
    t.includes("projeto de emenda a lei organica")
  );
}

function ehEmenda(tipo: string) {
  const t = normalizar(tipo);
  return t.includes("emenda") && !t.includes("proposta de emenda");
}

function vincularEmendasAosProjetos(emendas: any[], projetos: any[]) {
  for (const projeto of projetos) {
    if (!Array.isArray(projeto.emendas)) projeto.emendas = [];
  }
  for (const emenda of emendas) {
    const resultado = localizarProjetoDaEmenda(emenda, projetos);
    if (resultado.projeto) {
      resultado.projeto.emendas.push(emenda);
    }
  }
}

function localizarProjetoDaEmenda(emenda: any, projetos: any[]) {
  const textoBusca = [
    emenda.identificacao,
    emenda.ementa,
    emenda.autor,
    Array.isArray(emenda.autores) ? emenda.autores.join(" ") : ""
  ].filter(Boolean).join(" ");

  const referencias = extrairReferenciasProjetos(textoBusca);
  for (const referencia of referencias) {
    const projeto = projetos.find(item =>
      tipoProjetoChave(item.tipo) === referencia.tipo &&
      Number(item.numero) === referencia.numero &&
      Number(item.ano) === referencia.ano
    );
    if (projeto) return { projeto, textoBusca };
  }
  return { projeto: null, textoBusca };
}

function extrairReferenciasProjetos(texto: string) {
  const textoNormalizado = normalizarReferenciaProjeto(texto);
  const padroes = [
    { tipo: "plc", regex: /\b(?:projeto de lei complementar|plc)\s+(?:n\s+)?(\d{1,4})\s+(?:de\s+)?(\d{2,4})\b/g },
    { tipo: "pdl", regex: /\b(?:projeto de decreto legislativo|pdl)\s+(?:n\s+)?(\d{1,4})\s+(?:de\s+)?(\d{2,4})\b/g },
    { tipo: "pelo", regex: /\b(?:proposta de emenda a lei organica|projeto de emenda a lei organica|projeto de emenda a lom|pelo|pelom)\s+(?:n\s+)?(\d{1,4})\s+(?:de\s+)?(\d{2,4})\b/g },
    { tipo: "pr", regex: /\b(?:projeto de resolucao|pr)\s+(?:n\s+)?(\d{1,4})\s+(?:de\s+)?(\d{2,4})\b/g },
    { tipo: "pl", regex: /\b(?:projeto de lei|pl)\s+(?:n\s+)?(\d{1,4})\s+(?:de\s+)?(\d{2,4})\b/g }
  ];
  const referencias = [];
  for (const padrao of padroes) {
    for (const match of textoNormalizado.matchAll(padrao.regex)) {
      referencias.push({
        tipo: padrao.tipo,
        numero: Number(match[1]),
        ano: normalizarAnoProjeto(match[2])
      });
    }
  }
  return referencias;
}

function tipoProjetoChave(tipo: string) {
  const t = normalizar(tipo);
  if (t.includes("projeto de lei complementar")) return "plc";
  if (t.includes("projeto de decreto legislativo")) return "pdl";
  if (t.includes("proposta de emenda") || t.includes("projeto de emenda a lom") || t.includes("projeto de emenda a lei organica") || t.includes("lei organica")) return "pelo";
  if (t.includes("projeto de resolucao")) return "pr";
  if (t.includes("projeto de lei")) return "pl";
  return "";
}

function normalizarReferenciaProjeto(texto: string) {
  return normalizar(texto || "").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function normalizarAnoProjeto(ano: string) {
  const numero = Number(ano);
  if (numero < 100) return 2000 + numero;
  return numero;
}

function extrairAutoresDoBloco(bloco: string) {
  const candidatos = [];
  const spanAutoresMatch = bloco.match(/<span[^>]*id\s*=\s*["']?autores\d+["']?[^>]*>([\s\S]*?)<\/span>/i);
  if (spanAutoresMatch) candidatos.push(spanAutoresMatch[1]);

  const atributosRegex = /\b(?:title|data-original-title|data-content|aria-label)\s*=\s*(["'])([\s\S]*?)\1/gi;
  for (const match of bloco.matchAll(atributosRegex)) {
    candidatos.push(match[2]);
  }
  
  const spanAutorMatch = bloco.match(/<span[^>]*id\s*=\s*["']?autor\d+["']?[^>]*>([\s\S]*?)<\/span>/i);
  if (spanAutorMatch) candidatos.push(spanAutorMatch[1]);

  for (const candidato of candidatos) {
    const autores = normalizarAutores(candidato);
    if (autores.length > 0) return autores;
  }
  return [];
}

function normalizarAutores(valor: string) {
  const autores = coletarAutores(valor).map(autor => 
    String(autor || "").replace(/\bAutor(?:es)?:\s*/gi, "").replace(/\s+/g, " ").trim()
  ).filter(Boolean);

  const autoresUnicos = [];
  const vistos = new Set();
  for (const autor of autores) {
    const chave = normalizar(autor);
    if (!chave || vistos.has(chave)) continue;
    vistos.add(chave);
    autoresUnicos.push(autor);
  }
  return autoresUnicos;
}

function coletarAutores(valor: any): string[] {
  if (valor == null) return [];
  if (Array.isArray(valor)) return valor.flatMap(item => coletarAutores(item));
  if (typeof valor === "object") {
    const camposPreferenciais = ["nome", "autor", "autores", "nome_autor", "name", "__str__"];
    for (const campo of camposPreferenciais) {
      if (valor[campo] != null) return coletarAutores(valor[campo]);
    }
    return Object.values(valor).flatMap(item => coletarAutores(item));
  }
  const texto = limparHTML(String(valor));
  return texto.split(/\s*(?:,|;|\n|\r|\s+e\s+)\s*/i).map(item => limparTexto(item)).filter(Boolean);
}

function removerDuplicados(materias: any[]) {
  const mapa = new Map();
  for (const materia of materias) {
    const chave = `${materia.tipo}-${materia.numero}-${materia.ano}`;
    if (!mapa.has(chave)) mapa.set(chave, materia);
  }
  return [...mapa.values()];
}

function limparHTML(texto: string) {
  return limparTexto(
    decodificarEntidadesHTML(texto)
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&amp;/gi, "&")
      .replace(/&ordm;/gi, "º")
      .replace(/&deg;/gi, "°")
  );
}

function decodificarEntidadesHTML(texto: string) {
  const entidades: Record<string, string> = {
    nbsp: " ", quot: '"', apos: "'", amp: "&", ordm: "º", deg: "°", lt: "<", gt: ">"
  };
  return String(texto || "")
    .replace(/&#(\d+);/g, (_, codigo) => String.fromCodePoint(Number(codigo)))
    .replace(/&#x([\da-f]+);/gi, (_, codigo) => String.fromCodePoint(parseInt(codigo, 16)))
    .replace(/&([a-z]+);/gi, (entidade, nome) => entidades[nome.toLowerCase()] ?? entidade);
}

function limparTexto(texto: string) {
  return texto.replace(/\s+/g, " ").trim();
}

function normalizar(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

startServer();
