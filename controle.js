"use strict";

/* ==========================
ESTADO GLOBAL
========================== */

let modoSessao =
"tela_simples";
let historicoDiscussao = [];

let historicoOradores = [];

// Estado explícito do orador atual - fonte única da verdade
let speakerAtual = {
    tipo: "none", // "orador" | "replica" | "none"
    nome: "",
    nomeOriginal: null,
    indexReplica: null
};

// Estrutura: { nomeOriginal, indexReplica } - NÃO usa mais strings formatadas
let replicasConcluidasAtual = [];

function adicionarAoHistorico(nome, isReplica){
    console.log("[adicionarAoHistorico] nome:", nome, "isReplica:", isReplica, "speakerAtual:", JSON.stringify(speakerAtual), "replicasConcluidas:", JSON.stringify(replicasConcluidasAtual), "historicoOradores qtd:", historicoOradores.length);
    if(isReplica){
        // Adicionar réplica ao último orador principal no histórico
        for(let i = historicoOradores.length - 1; i >= 0; i--){
            const entry = historicoOradores[i];
            if(typeof entry === 'object' && entry.nome){
                if(!entry.replicas){
                    entry.replicas = [];
                }
                // Proteção: verificar se o nome da réplica já existe nas réplicas deste orador
                if(!entry.replicas.includes(nome)){
                    entry.replicas.push(nome);
                    console.log("[adicionarAoHistorico] réplica adicionada:", nome, "ao orador:", entry.nome);
                } else {
                    console.log("[adicionarAoHistorico] RÉPLICA DUPLICADA BLOQUEADA:", nome, "já existe em", entry.nome);
                }
                return;
            }
        }
        // Se não encontrar orador principal, adicionar como entrada normal
        historicoOradores.push(nome);
    } else {
        historicoOradores.push({ nome: nome, replicas: [] });
    }
}

function obterTextoOradorAtual(){
    console.warn("[obterTextoOradorAtual] DEPRECATED - use speakerAtual diretamente");
    const el = document.getElementById("oradorAtual");
    return el.getAttribute("data-fulltext") || el.textContent.trim();
}

function definirOradorAtual(tipo, nome, nomeOriginal = null, indexReplica = null){
    speakerAtual = {
        tipo: tipo,
        nome: nome,
        nomeOriginal: nomeOriginal,
        indexReplica: indexReplica
    };
    console.log("[speakerAtual] definido:", JSON.stringify(speakerAtual));

    const el = document.getElementById("oradorAtual");
    if(tipo === "none"){
        el.textContent = "AGUARDANDO INÍCIO";
        el.removeAttribute("data-fulltext");
    } else if(tipo === "replica"){
        el.innerHTML = nome.toUpperCase() + "<br><small>Réplica de " + nomeOriginal.toUpperCase() + "</small>";
        el.setAttribute("data-fulltext", nome.toUpperCase() + " (Réplica de " + nomeOriginal.toUpperCase() + ")");
    } else {
        el.textContent = nome.toUpperCase();
        el.removeAttribute("data-fulltext");
    }
}

// Verifica se uma réplica (identificada por nomeOriginal + indexReplica) já foi concluída
function replicaFoiConcluida(nomeOriginal, indexReplica){
    return replicasConcluidasAtual.some(r =>
        r.nomeOriginal === nomeOriginal && r.indexReplica === indexReplica
    );
}

// Marca uma réplica como concluída usando dados estruturados
// Proteção contra duplicatas: verifica se já foi registrada
function marcarReplicaConcluida(nomeOriginal, indexReplica){
    // Se já existe, não adicionar novamente (idempotente)
    if(replicaFoiConcluida(nomeOriginal, indexReplica)){
        console.log("[replicasConcluidasAtual] JA existe, ignorando:", { nomeOriginal, indexReplica });
        return;
    }
    replicasConcluidasAtual.push({
        nomeOriginal: nomeOriginal,
        indexReplica: indexReplica
    });
    console.log("[replicasConcluidasAtual] adicionado:", { nomeOriginal, indexReplica });
}

function encontrarProximaReplicaSequencial(replicas, nomeOriginal, indexAtual = -1){
    if(!replicas || replicas.length === 0){
        return null;
    }

    for(let idx = indexAtual + 1; idx < replicas.length; idx++){
        if(!replicaFoiConcluida(nomeOriginal, idx)){
            return {
                replica: replicas[idx],
                index: idx
            };
        }
    }

    return null;
}

function buscarChaveReplicas(nome){
    const nomeUpper = nome.toUpperCase();
    for(const key of Object.keys(replicasPorOrador)){
        if(key.toUpperCase() === nomeUpper){
            return key;
        }
    }
    return null;
}

// Encontra a posição de um orador na fila, retorna -1 se não encontrado
function encontrarOradorNaFila(nome){
    const nomeUpper = nome.toUpperCase();
    return filaConsideracoes.findIndex(n => n.toUpperCase() === nomeUpper);
}

// Função centralizada que retorna quem falará em seguida
// Usa speakerAtual, filaConsideracoes, replicasPorOrador, replicasConcluidasAtual
// NÃO usa texto da interface
function obterProximoOradorReal(){
    if(filaConsideracoes.length === 0){
        return null;
    }

    if(speakerAtual.tipo === "none"){
        // Ninguém falando - próximo é o primeiro da fila
        return { tipo: "orador", nome: filaConsideracoes[0] };
    }

    if(speakerAtual.tipo === "orador"){
        // Orador principal falando - verificar se há réplicas pendentes
        const nomeOrador = speakerAtual.nome;
        const chave = buscarChaveReplicas(nomeOrador);
        const replicas = chave ? replicasPorOrador[chave] : null;
        if(replicas && replicas.length > 0){
            // Procurar a primeira réplica NÃO concluída
            const proximaReplicaInfo = encontrarProximaReplicaSequencial(replicas, nomeOrador);
            if(proximaReplicaInfo){
                return { tipo: "replica", nome: proximaReplicaInfo.replica.nome, nomeOriginal: nomeOrador };
            }
        }
        // Sem réplicas pendentes - próximo da fila
        const indexAtual = encontrarOradorNaFila(nomeOrador);
        if(indexAtual !== -1 && indexAtual + 1 < filaConsideracoes.length){
            return { tipo: "orador", nome: filaConsideracoes[indexAtual + 1] };
        }
        // Último da fila
        return null;
    }

    if(speakerAtual.tipo === "replica"){
        // Réplica falando - verificar se há mais réplicas do mesmo orador
        const nomeOriginal = speakerAtual.nomeOriginal;
        const chave = buscarChaveReplicas(nomeOriginal);
        const replicas = chave ? replicasPorOrador[chave] : null;
        if(replicas && replicas.length > 0){
            // Procurar apenas réplicas posteriores à atual, respeitando a ordem da fila.
            const proximaReplicaInfo = encontrarProximaReplicaSequencial(
                replicas,
                nomeOriginal,
                speakerAtual.indexReplica
            );
            if(proximaReplicaInfo){
                return { tipo: "replica", nome: proximaReplicaInfo.replica.nome, nomeOriginal: nomeOriginal };
            }
        }
        // Sem mais réplicas - próximo orador principal da fila
        const indexOrador = encontrarOradorNaFila(nomeOriginal);
        if(indexOrador !== -1 && indexOrador + 1 < filaConsideracoes.length){
            return { tipo: "orador", nome: filaConsideracoes[indexOrador + 1] };
        }
        // Último da fila
        return null;
    }

    return null;
}

// Atualiza o texto "Próximo Orador" na interface baseado em obterProximoOradorReal()
function atualizarTextoProximoOrador(){
    const el = document.getElementById("proximoOrador");
    if(!el) return;
    const proximo = obterProximoOradorReal();
    if(proximo){
        if(proximo.tipo === "replica"){
            el.textContent = "Próximo Orador: " + proximo.nome + " (Réplica de " + proximo.nomeOriginal + ")";
        } else {
            el.textContent = "Próximo Orador: " + proximo.nome;
        }
    } else {
        el.textContent = "Próximo Orador: ---";
    }
}

function avancarProximoOrador(){
    atualizarFilaConsideracoes();
    atualizarListaEncerrados();
    atualizarHistoricoOradores();

    if(filaConsideracoes.length > 0){
        const proximoNome = filaConsideracoes[0];
        oradorAtualConsideracoes = proximoNome;
        definirOradorAtual("orador", proximoNome);
        tempoInicial = 300;
        tempoRestante = 300;
        pausarCronometro();
        atualizarCronometro();
    } else {
        oradorAtualConsideracoes = "";
        definirOradorAtual("none");
        pausarCronometro();
        tempoInicial = 300;
        tempoRestante = 300;
        atualizarCronometro();
    }
    salvarEstadoTelao();
}

let tempoInicial = 300;
let tempoRestante = 300;
let filaConsideracoes = [];
let cronometroRodando = false;
let intervaloCronometro = null;
let oradorAtualConsideracoes = null;
let tempoExtraAtivo = true;
let alarmeAtivo = true;
let oradorTribunaLivre = null;
let filaReplicas = [];
let historicoTribuna = [];
let selectedSpeaker = null;

const opcoesTempoExtraOrador = [
    { label: "+30 segundos", segundos: 30 },
    { label: "+1 minuto", segundos: 60 },
    { label: "+1 minuto e 30 segundos", segundos: 90 },
    { label: "+2 minutos", segundos: 120 }
];

/* ==========================
VEREADORES
========================== */

const vereadores = [

"Vereador Alexandre de Barros Mendes",
"Vereadora Aline Moreira Silva Melo",
"Vereador André Eustaquio Alves",
"Vereador Antônio Domingos Ximendes Trindade",
"Vereadora Aparecida Sônia Ferreira Vidal",
"Vereador Breno Reis de Oliveira",
"Vereador Gilson Fazolla Filgueiras",
"Vereadora Jane Cristina Lacerda Pinto",
"Vereador José Maria Fernandes",
"Vereador José Roberto Reis Filgueiras",
"Vereador Lucas Rufino Zocóli",
"Vereadora Marilda Aparecida Leoncio",
"Vereador Paulo Cezar Tavares",
"Vereador Renato Vieira",
"Vereador Samuel Soares da Silva"

];

/* ==========================
FUNÇÕES DE SINCRONIZAÇÃO
========================== */

function salvarEstadoTelao(){

    // Construir texto para exibição no telão baseado no estado explícito
    let oradorExibir;
    if(speakerAtual.tipo === "none"){
        oradorExibir = "AGUARDANDO INÍCIO";
    } else if(speakerAtual.tipo === "replica"){
        oradorExibir = speakerAtual.nome.toUpperCase() + " (Réplica de " + speakerAtual.nomeOriginal.toUpperCase() + ")";
    } else {
        oradorExibir = speakerAtual.nome.toUpperCase();
    }

    const cronEl = document.getElementById("cronometro");

    const estado = {
        tituloSessao: tituloSessao.textContent,
        oradorAtual: oradorExibir,
        cronometro: cronEl.textContent,
        cronometroCor: cronEl.style.color || "",
        proximoOrador: document.getElementById("proximoOrador").textContent,
        modoSessao: modoSessao
    };

    localStorage.setItem('estadoCronometro', JSON.stringify(estado));

}

/* ==========================
TELAS
========================== */

function carregarDiscussao(){

    painelEsquerdo.innerHTML = `

        <h2>Vereadores</h2>

        <div id="listaDiscussao"></div>

    `;

    painelCentro.innerHTML = `

        <h2>Histórico</h2>

        <div id="historicoDiscussao"></div>

    `;

    const lista =
    document.getElementById(
        "listaDiscussao"
    );

    vereadores.forEach(nome=>{

        const btn =
        document.createElement(
            "button"
        );

        btn.textContent =
        nome;

        btn.className =
        "botaoVereador";

        btn.onclick = ()=>{

            selecionarOradorDiscussao(
                nome
            );

        };

        lista.appendChild(
            btn
        );

    });

    atualizarHistoricoDiscussao();

}

function carregarConsideracoes(){

    painelEsquerdo.innerHTML = `

        <h2>
            Inscrição dos Vereadores
        </h2>

        <div id="listaConsideracoes"></div>

        <hr>

        <h2>
            Histórico de Oradores
        </h2>

        <div id="historicoOradores"></div>

    `;

    painelCentro.innerHTML = `

        <h2>
            Fila de Oradores
        </h2>

        <div id="filaOradores"></div>

    `;

    const lista =
    document.getElementById(
        "listaConsideracoes"
    );

    vereadores.forEach(nome=>{

        const btn =
        document.createElement(
            "button"
        );

        btn.textContent =
        nome;

        btn.className =
        "botaoVereador";

        btn.onclick = ()=>{

            inscreverVereador(
                nome
            );

        };

        lista.appendChild(
            btn
        );

    });

    atualizarFilaConsideracoes();
    atualizarHistoricoOradores();

}

function carregarTribuna(){

    painelEsquerdo.innerHTML = `

        <h2 style="text-align:center;">
            Tribuna Livre
        </h2>

        <div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:10px 0;">
            <input
            id="nomeConvidado"
            placeholder="Nome do(a) Orador(a)"
            style="width:100%;max-width:300px;">

            <button
            id="btnRegistrarConvidado"
            class="botaoVereador"
            style="width:100%;max-width:300px;background:#2b7cd3;color:white;font-size:14px;">

                Registrar Orador(a)

            </button>
        </div>

        <hr style="margin:15px 0;">

        <h2 style="text-align:center;">
            Histórico de Oradores
        </h2>

        <div id="historicoTribuna"></div>

    `;

    painelCentro.innerHTML = `

        <h2>
            Comentários dos Vereadores
        </h2>

        <div id="listaComentarios"></div>

    `;

    const lista =
    document.getElementById(
        "listaComentarios"
    );

    vereadores.forEach(nome=>{

        const btn =
        document.createElement(
            "button"
        );

        btn.textContent =
        nome;

        btn.className =
        "botaoVereador";

        btn.onclick = ()=>{

            selecionarVereadorTribuna(
                nome
            );

        };

        lista.appendChild(
            btn
        );

    });

    // Adicionar listener para registrar convidado
    document.getElementById("btnRegistrarConvidado").addEventListener("click", registrarConvidado);

}

function registrarConvidado(){

    const nomeInput = document.getElementById("nomeConvidado");
    const nome = nomeInput.value.trim();

    if(nome === ""){
        alert("Por favor, insira um nome");
        return;
    }

    pausarCronometro();

    oradorTribunaLivre = nome;

    definirOradorAtual("orador", nome);

    tempoInicial = 600;
    tempoRestante = 600;

    atualizarCronometro();
    salvarEstadoTelao();

    nomeInput.value = "";

    // Adicionar ao histórico da tribuna
    if(!historicoTribuna.includes(nome)){
        historicoTribuna.push(nome);
    }
    atualizarHistoricoTribuna();

}

function atualizarHistoricoTribuna(){
    const div = document.getElementById("historicoTribuna");
    if(!div){
        return;
    }

    div.innerHTML = "";

    if(historicoTribuna.length === 0){
        div.innerHTML = "<div style='color:#888;padding:8px;text-align:center;font-size:13px;'>Nenhum orador registrado</div>";
        return;
    }

    historicoTribuna
    .slice()
    .reverse()
    .forEach((nome, index) => {
        const item = document.createElement("div");
        item.className = "botaoVereador";
        item.textContent = nome;
        div.appendChild(item);
    });
}

function selecionarVereadorTribuna(nome){

    pausarCronometro();

    oradorTribunaLivre = nome;

    definirOradorAtual("orador", nome);

    tempoInicial = 120;
    tempoRestante = 120;

    atualizarCronometro();
    salvarEstadoTelao();

    // Adicionar ao histórico da tribuna
    if(!historicoTribuna.includes(nome)){
        historicoTribuna.push(nome);
    }
    atualizarHistoricoTribuna();

}

/* ==========================
CONDOLÊNCIAS
========================== */

function carregarCondolencias(){

    painelEsquerdo.innerHTML = `
        <h2 style="text-align:center;color:#555;">
            Minuto de Silêncio
        </h2>
        <div style="text-align:center;padding:20px 10px;color:#888;font-size:14px;line-height:1.6;">
            🕊️ Momento de luto<br>
            Tempo fixo de 1 minuto<br>
            <span style="display:block;margin-top:15px;font-size:12px;color:#aaa;">
                Utilize os botões Iniciar e Pausar<br>
                ao lado para controlar o tempo.
            </span>
        </div>
    `;

    painelCentro.innerHTML = ``;

    // Pausar cronômetro e configurar para 1 minuto
    pausarCronometro();
    definirOradorAtual("none");
    tempoInicial = 60;
    tempoRestante = 60;
    atualizarCronometro();
    salvarEstadoTelao();

}

/* ==========================
PAUSA
========================== */

function carregarPausa(){

    painelEsquerdo.innerHTML = `
        <h2 style="text-align:center;color:#555;">
            Selecionar Duração
        </h2>
        <div id="listaTemposPausa" style="display:flex;flex-direction:column;gap:6px;padding:10px 0;"></div>
    `;

    painelCentro.innerHTML = ``;

    // Gerar botões de 1 a 15 minutos
    const lista = document.getElementById("listaTemposPausa");
    for(let i = 1; i <= 15; i++){
        const btn = document.createElement("button");
        btn.className = "botaoVereador";
        btn.textContent = i + " minuto" + (i > 1 ? "s" : "");
        btn.onclick = function(){
            selecionarTempoPausa(i);
        };
        lista.appendChild(btn);
    }

    // Pausar cronômetro e configurar estado inicial
    pausarCronometro();
    definirOradorAtual("none");
    tempoInicial = 60; // 1 minuto padrão
    tempoRestante = 60;
    atualizarCronometro();
    salvarEstadoTelao();

}

let tempoPausaSelecionado = 1; // em minutos

function selecionarTempoPausa(minutos){
    tempoPausaSelecionado = minutos;
    pausarCronometro();
    definirOradorAtual("none");
    tempoInicial = minutos * 60;
    tempoRestante = minutos * 60;
    atualizarCronometro();
    salvarEstadoTelao();

    // Destacar o botão selecionado
    document.querySelectorAll("#listaTemposPausa .botaoVereador").forEach(btn => {
        btn.style.background = "#e9ecef";
        btn.style.color = "#222";
    });
    // Encontrar e destacar o botão clicado
    const botoes = document.querySelectorAll("#listaTemposPausa .botaoVereador");
    const index = minutos - 1;
    if(botoes[index]){
        botoes[index].style.background = "#2b7cd3";
        botoes[index].style.color = "white";
    }

    // Atualizar status
    const statusEl = document.getElementById("statusPausa");
    if(statusEl){
        statusEl.innerHTML = "⏸ Pausa selecionada: <strong>" + minutos + " minuto" + (minutos > 1 ? "s" : "") + "</strong><br><br>Clique em <strong>Iniciar</strong> para começar a contagem regressiva";
    }
}

/* ==========================
MODOS
========================== */

function selecionarModo(
    modo
){

    modoSessao =
    modo;

    document
    .querySelectorAll(
        ".modosSessao button"
    )
    .forEach(btn=>
        btn.classList.remove(
            "modoAtivo"
        )
    );

    const proximoEl =
    document.getElementById(
        "proximoOrador"
    );

    const btnProximoEl =
    document.getElementById(
        "btnProximo"
    );

    atualizarControlesPrincipaisPorModo(modo);

    // Restaurar visibilidade dos elementos que podem ter sido escondidos por modos simples
    let tituloStatusEl = document.querySelector(".tituloStatus");
    let oradorStatusEl = document.getElementById("oradorAtual");
    if(tituloStatusEl) tituloStatusEl.style.display = "";
    if(oradorStatusEl) oradorStatusEl.style.display = "";
    // Restaurar coluna centro que pode ter sido escondida pelo modo Pausa ou Condolências
    let colunaCentroEl = document.querySelector(".colunaCentro");
    if(colunaCentroEl) colunaCentroEl.style.display = "";
    // Restaurar flex da coluna esquerda e sua visibilidade
    let colunaEsquerdaEl = document.querySelector(".coluna");
    if(colunaEsquerdaEl) {
        colunaEsquerdaEl.style.flex = "";
        colunaEsquerdaEl.style.display = "";
    }
    // Restaurar coluna principal (cronômetro) ao layout original
    let colunaPrincipalEl = document.querySelector(".colunaPrincipal");
    if(colunaPrincipalEl) {
        colunaPrincipalEl.style.flex = "";
        colunaPrincipalEl.style.maxWidth = "";
    }

    if(
        modo ===
        "discussao"
    ){

        tituloSessao.textContent =
        "DISCUSSÃO DE PROPOSIÇÕES";

        modoDiscussao
        .classList.add(
            "modoAtivo"
        );

        proximoEl.style.display = "none";
        btnProximoEl.style.display = "none";

        // Mostrar container ao sair da tela simples
        const container = document.querySelector(".container");
        if(container){
            container.style.display = "";
        }

        carregarDiscussao();

    }

    if(
        modo ===
        "consideracoes"
    ){

        tituloSessao.textContent =
        "CONSIDERAÇÕES FINAIS";

        modoConsideracoes
        .classList.add(
            "modoAtivo"
        );

        proximoEl.style.display = "";
        btnProximoEl.style.display = "";

        // Mostrar container ao sair da tela simples
        const container = document.querySelector(".container");
        if(container){
            container.style.display = "";
        }

        carregarConsideracoes();

    }

    if(
        modo ===
        "tribuna"
    ){

        tituloSessao.textContent =
        "TRIBUNA LIVRE";

        modoTribuna
        .classList.add(
            "modoAtivo"
        );

        proximoEl.style.display = "none";
        btnProximoEl.style.display = "none";

        // Mostrar container ao sair da tela simples
        const container = document.querySelector(".container");
        if(container){
            container.style.display = "";
        }

        carregarTribuna();

    }

    if(
        modo ===
        "condolencias"
    ){

        tituloSessao.textContent =
        "CONDOLÊNCIAS";

        modoCondolencias
        .classList.add(
            "modoAtivo"
        );

        proximoEl.style.display = "none";
        btnProximoEl.style.display = "none";

        // Mostrar container ao sair da tela simples
        const container = document.querySelector(".container");
        if(container){
            container.style.display = "";
        }

        // Esconder "USANDO A PALAVRA" no operador
        const tituloStatus = document.querySelector(".tituloStatus");
        if(tituloStatus) tituloStatus.style.display = "none";
        // Esconder "AGUARDANDO INÍCIO" 
        const oradorEl = document.getElementById("oradorAtual");
        if(oradorEl) oradorEl.style.display = "none";

        // Esconder colunas 1 e 2 para Condolências - manter apenas coluna 3
        const colunaEsquerdaCond = document.querySelector(".coluna");
        if(colunaEsquerdaCond) colunaEsquerdaCond.style.display = "none";
        const colunaCentroCond = document.querySelector(".colunaCentro");
        if(colunaCentroCond) colunaCentroCond.style.display = "none";
        // Ajustar coluna principal (painel do cronômetro) para ocupar a tela toda
        const colunaPrincipalCond = document.querySelector(".colunaPrincipal");
        if(colunaPrincipalCond){
            colunaPrincipalCond.style.flex = "1 1 100%";
            colunaPrincipalCond.style.maxWidth = "100%";
        }

        carregarCondolencias();

    }

    if(
        modo ===
        "pausa"
    ){

        tituloSessao.textContent =
        "PAUSA";

        modoPausa
        .classList.add(
            "modoAtivo"
        );

        proximoEl.style.display = "none";
        btnProximoEl.style.display = "none";

        // Mostrar container ao sair da tela simples
        const container = document.querySelector(".container");
        if(container){
            container.style.display = "";
        }

        // Esconder "USANDO A PALAVRA" no operador
        const tituloStatus = document.querySelector(".tituloStatus");
        if(tituloStatus) tituloStatus.style.display = "none";
        // Esconder "AGUARDANDO INÍCIO"
        const oradorEl = document.getElementById("oradorAtual");
        if(oradorEl) oradorEl.style.display = "none";

        // Esconder a coluna do centro para Pausa
        const colunaCentro = document.querySelector(".colunaCentro");
        if(colunaCentro) colunaCentro.style.display = "none";
        // Ajustar coluna esquerda para ocupar mais espaço
        const colunaEsquerda = document.querySelector(".coluna");
        if(colunaEsquerda) colunaEsquerda.style.flex = "0 0 360px";

        carregarPausa();

    }

    if(
        modo ===
        "tela_simples"
    ){

        tituloSessao.textContent =
        "TELA SIMPLES";

        modoTelaSimples
        .classList.add(
            "modoAtivo"
        );

        proximoEl.style.display = "none";
        btnProximoEl.style.display = "none";

        pausarCronometro();

        // Esconder todo o container (colunas, cronômetro, botões)
        const container = document.querySelector(".container");
        if(container){
            container.style.display = "none";
        }

        // Adicionar botão Telão abaixo do título, centralizado
        let btnTelaoSimples = document.getElementById("btnTelaoSimples");
        if(!btnTelaoSimples){
            btnTelaoSimples = document.createElement("button");
            btnTelaoSimples.id = "btnTelaoSimples";
            btnTelaoSimples.textContent = "🖥 Telão";
            btnTelaoSimples.style.cssText = "display:block;margin:15px auto 0;padding:10px 24px;background:#2b7cd3;color:white;border:none;border-radius:4px;cursor:pointer;font-size:16px;font-weight:bold;";
            btnTelaoSimples.addEventListener("click", abrirTelao);
            tituloSessao.parentNode.insertBefore(btnTelaoSimples, tituloSessao.nextSibling);
        }
        btnTelaoSimples.style.display = "block";

    } else {
        // Remover botão Telão da tela simples ao sair do modo
        const btnTelaoSimples = document.getElementById("btnTelaoSimples");
        if(btnTelaoSimples){
            btnTelaoSimples.style.display = "none";
        }
    }

    salvarEstadoTelao();

}

function atualizarControlesPrincipaisPorModo(modo){
    const ocultarControlesIndividuais =
    modo === "consideracoes";

    const btnIniciarEl = document.getElementById("btnIniciar");
    const btnPausarEl = document.getElementById("btnPausar");
    const btnEncerrarEl = document.getElementById("btnEncerrar");
    const btnRestaurarEl = document.getElementById("btnRestaurar");
    const btnProximoEl = document.getElementById("btnProximo");
    const btnRetornarEl = document.getElementById("btnRetornar");
    const btnTempoExtraEl = document.getElementById("btnTempoExtra");
    const btnAlarmeEl = document.getElementById("btnAlarme");

    // Modos que só devem ter Iniciar e Pausar (sem alarme, tempo extra, encerrar, etc.)
    const modoSimples = modo === "condolencias" || modo === "pausa";

    if(btnIniciarEl){
        btnIniciarEl.style.display = ocultarControlesIndividuais ? "none" : "";
    }

    if(btnPausarEl){
        btnPausarEl.style.display = ocultarControlesIndividuais ? "none" : "";
    }

    if(btnEncerrarEl){
        btnEncerrarEl.style.display = modoSimples ? "none" : "";
    }

    if(btnRestaurarEl){
        btnRestaurarEl.style.display = modoSimples ? "none" : "";
    }

    if(btnProximoEl){
        btnProximoEl.style.display = modoSimples ? "none" : "";
    }

    if(btnRetornarEl){
        btnRetornarEl.style.display = modoSimples ? "none" : "";
    }

    if(btnTempoExtraEl){
        btnTempoExtraEl.style.display = modoSimples ? "none" : "";
    }

    if(btnAlarmeEl){
        btnAlarmeEl.style.display = modoSimples ? "none" : "";
    }
}

/* ==========================
RÉPLICAS - DADOS
========================== */

// Estrutura: { nomeOrador: [ { nome: "Vereador X", tempo: 120 }, ... ] }
const replicasPorOrador = {};
// Lista de oradores que já encerraram (para exibir o botão "+")
const oradoresEncerrados = [];

/* ==========================
INICIALIZAÇÃO
========================== */

const painelEsquerdo =
document.getElementById(
    "painelEsquerdo"
);

const painelCentro =
document.getElementById(
    "painelCentro"
);

const tituloSessao =
document.getElementById(
    "tituloSessao"
);

modoDiscussao
.addEventListener(
    "click",
    ()=>selecionarModo(
        "discussao"
    )
);

modoConsideracoes
.addEventListener(
    "click",
    ()=>selecionarModo(
        "consideracoes"
    )
);

modoTribuna
.addEventListener(
    "click",
    ()=>selecionarModo(
        "tribuna"
    )
);

modoCondolencias
.addEventListener(
    "click",
    ()=>selecionarModo(
        "condolencias"
    )
);

modoPausa
.addEventListener(
    "click",
    ()=>selecionarModo(
        "pausa"
    )
);

modoTelaSimples
.addEventListener(
    "click",
    ()=>selecionarModo(
        "tela_simples"
    )
);

selecionarModo(
    "tela_simples"
);

function selecionarOradorDiscussao(
    nome
){

    pausarCronometro();

    definirOradorAtual("orador", nome);

    historicoDiscussao.push(
        nome
    );

    atualizarHistoricoDiscussao();
    
    tempoInicial = 300;
    tempoRestante = 300;

    atualizarCronometro();
    salvarEstadoTelao();
}


function atualizarHistoricoDiscussao(){

    const div =
    document.getElementById(
        "historicoDiscussao"
    );

    if(!div){
        return;
    }

    div.innerHTML = "";

    historicoDiscussao
    .slice()
    .reverse()
    .forEach(nome=>{

        const item =
        document.createElement(
            "div"
        );

        item.className =
        "botaoVereador";

        item.textContent =
        nome;

        div.appendChild(
            item
        );

    });

}

function formatarTempo(segundos){

    const min =
    Math.floor(Math.abs(segundos) / 60);

    const seg =
    Math.abs(segundos) % 60;

    const sinal = segundos < 0 ? "-" : "";

    return sinal + String(min)
    .padStart(2,"0")
    + ":"
    + String(seg)
    .padStart(2,"0");

}

function atualizarCronometro(){

    const cronEl =
    document.getElementById("cronometro");

    cronEl.textContent =
    formatarTempo(
        tempoRestante
    );

    if(tempoRestante <= 0){

        cronEl.style.color = "#d32f2f";
        cronEl.classList.remove("cronometroPiscando");

    } else if(tempoRestante <= 10){

        cronEl.style.color = "#f57c00";
        cronEl.classList.add("cronometroPiscando");

    } else if(tempoRestante <= 30){

        cronEl.style.color = "#f9a825";
        cronEl.classList.remove("cronometroPiscando");

    } else {

        cronEl.style.color = "";
        cronEl.classList.remove("cronometroPiscando");

    }

    salvarEstadoTelao();

}

function iniciarCronometro(){

    // Em considerações finais, iniciar quando não há ninguém falando define o primeiro da fila
    if(
        speakerAtual.tipo === "none" &&
        modoSessao === "consideracoes" &&
        filaConsideracoes.length > 0
    ){
        const nome = filaConsideracoes[0];
        oradorAtualConsideracoes = nome;
        definirOradorAtual("orador", nome);

        tempoInicial = 300;
        tempoRestante = 300;
        atualizarCronometro();
        atualizarTextoProximoOrador();
        salvarEstadoTelao();
    } else if(speakerAtual.tipo === "none" && modoSessao !== "condolencias" && modoSessao !== "pausa") {
        return;
    }

    if(cronometroRodando){
        return;
    }

    cronometroRodando = true;

    intervaloCronometro =
    setInterval(()=>{

        // Se tempo extra estiver desligado e o tempo chegou a zero, parar o cronômetro
        // Para Condolências e Pausa, sempre parar ao chegar a zero (sem tempo extra)
        if(tempoRestante <= 0 && (!tempoExtraAtivo || modoSessao === "condolencias" || modoSessao === "pausa")){
            pausarCronometro();
            atualizarCronometro();
            salvarEstadoTelao();
            return;
        }

        tempoRestante--;

        atualizarCronometro();

        // Verificar se deve ativar alarme ao chegar em 00:00 (transição de 1 para 0)
        // alarmeAtivo nunca é alterado aqui - respeita o toggle do usuário
        // Condolências e Pausa não têm alarme
        if(tempoRestante === 0 && alarmeAtivo && modoSessao !== "condolencias" && modoSessao !== "pausa"){
            tocarAlarme();
        }

    },1000);

}

function pausarCronometro(){

    cronometroRodando = false;

    clearInterval(
        intervaloCronometro
    );

}

function restaurarCronometro(){

    pausarCronometro();

    tempoRestante =
    tempoInicial;

    atualizarCronometro();

}

function encerrarCronometro(){

    console.log("[encerrarCronometro] INÍCIO - speakerAtual:", JSON.stringify(speakerAtual), "fila:", JSON.stringify(filaConsideracoes), "replicasConcluidas:", JSON.stringify(replicasConcluidasAtual));

    pausarCronometro();

    if(
        modoSessao === "consideracoes" &&
        speakerAtual.tipo !== "none"
    ){
        if(speakerAtual.tipo === "replica"){
            // É uma réplica - dados estruturados, sem strings
            const nomeOradorOriginal = speakerAtual.nomeOriginal;
            const indexReplicaAtual = speakerAtual.indexReplica;

            // Registrar réplica como concluída usando dados estruturados
            marcarReplicaConcluida(nomeOradorOriginal, indexReplicaAtual);

            // Verificar se há mais réplicas para este orador
            const chaveReplicasEnc = buscarChaveReplicas(nomeOradorOriginal);
            const replicas = chaveReplicasEnc ? replicasPorOrador[chaveReplicasEnc] : null;
            if(replicas && replicas.length > 0){
                // Encontrar a próxima réplica posterior à atual.
                const proximaReplicaInfo = encontrarProximaReplicaSequencial(
                    replicas,
                    nomeOradorOriginal,
                    indexReplicaAtual
                );
                if(proximaReplicaInfo){
                    const proximaReplica = proximaReplicaInfo.replica;
                    const idxProxima = proximaReplicaInfo.index;
                    definirOradorAtual("replica", proximaReplica.nome, nomeOradorOriginal, idxProxima);

                    tempoInicial = proximaReplica.tempo;
                    tempoRestante = proximaReplica.tempo;

                    atualizarCronometro();
                    atualizarFilaConsideracoes();

                    salvarEstadoTelao();
                    console.log("[encerrarCronometro] FIM - próxima réplica:", proximaReplica.nome, "index:", idxProxima);
                    return;
                }
            }

            // Sem mais réplicas, apenas pausar (não avança automaticamente)
            atualizarFilaConsideracoes();
            salvarEstadoTelao();
            console.log("[encerrarCronometro] FIM - sem mais réplicas, pausou");
            return;
        }

        // É um orador principal
        const nomeOrador = speakerAtual.nome;

        const encontrado = vereadores.find(v =>
            v.toUpperCase() === nomeOrador.toUpperCase()
        );

        if(encontrado){
            if(!oradoresEncerrados.includes(encontrado)){
                oradoresEncerrados.push(encontrado);
            }

            // Verificar se há réplicas pendentes
            const replicas = replicasPorOrador[encontrado];
            if(replicas && replicas.length > 0){
                // Encontrar a primeira réplica que ainda não foi concluída (por indexReplica)
                const proximaReplicaInfo = encontrarProximaReplicaSequencial(replicas, encontrado);
                if(proximaReplicaInfo){
                    const proximaReplica = proximaReplicaInfo.replica;
                    const idxProxima = proximaReplicaInfo.index;
                    definirOradorAtual("replica", proximaReplica.nome, encontrado, idxProxima);

                    tempoInicial = proximaReplica.tempo;
                    tempoRestante = proximaReplica.tempo;

                    atualizarCronometro();
                    atualizarFilaConsideracoes();
                    atualizarListaEncerrados();

                    salvarEstadoTelao();
                    console.log("[encerrarCronometro] FIM - avançou para réplica:", proximaReplica.nome, "index:", idxProxima);
                    return;
                }
            }

            // Sem réplicas, apenas pausar
            atualizarListaEncerrados();
            salvarEstadoTelao();
            console.log("[encerrarCronometro] FIM - orador encerrado sem réplicas");
            return;
        } else {
            adicionarAoHistorico(nomeOrador, false);
        }

        atualizarListaEncerrados();
        atualizarHistoricoOradores();
    }

    definirOradorAtual("none");

    if(modoSessao === "tribuna"){
        oradorTribunaLivre = null;
    }

    salvarEstadoTelao();
    console.log("[encerrarCronometro] FIM - modo none");

}

function ativarTempoExtra(){

    tempoExtraAtivo = !tempoExtraAtivo;

    const btn = document.getElementById("btnTempoExtra");

    if(tempoExtraAtivo){
        btn.style.background = "#ff6f00";
        btn.textContent = "🟠 Tempo extra ligado";
    } else {
        btn.style.background = "#2b7cd3";
        btn.textContent = "🟢 Tempo extra desligado";
    }

}

function ativarAlarme(){

    alarmeAtivo = !alarmeAtivo;

    const btn = document.getElementById("btnAlarme");

    if(alarmeAtivo){
        btn.style.background = "#ff6f00";
        btn.textContent = "🟠 Alarme ligado";
    } else {
        btn.style.background = "#2b7cd3";
        btn.textContent = "🟢 Alarme desligado";
    }

}

let audioAlarme = null;
let audioContextAtivado = false;

const CAMINHO_ALARME = "alarme.mp3";

function ativarAudioContexto(){
    if(audioContextAtivado) return;
    // Tocar e pausar um áudio silencioso para "desbloquear" o autoplay do navegador
    const silent = new Audio();
    silent.play().then(() => {
        silent.pause();
        audioContextAtivado = true;
        console.log("Contexto de áudio ativado com sucesso");
    }).catch(() => {
        // Mesmo se falhar, tenta ativar de novo no próximo clique
        audioContextAtivado = false;
    });
}

function tocarAlarme(){
    if(!audioAlarme){
        audioAlarme = new Audio(CAMINHO_ALARME);
    }
    audioAlarme.currentTime = 0;
    audioAlarme.play().catch(function(err){
        console.warn("Não foi possível tocar o alarme:", err);
    });
}

function abrirTelao(){

    window.open('telao.html', 'telao', 'width=1920,height=1080');

}

btnIniciar.addEventListener(
    "click",
    function(){
        ativarAudioContexto();

        console.log("[btnIniciar] selectedSpeaker:", JSON.stringify(selectedSpeaker));

        // Se há um orador selecionado manualmente, iniciar por ele
        if(selectedSpeaker && modoSessao === "consideracoes"){
            if(selectedSpeaker.tipo === "orador"){
                iniciarOradorConsideracoes(selectedSpeaker.nome);
                return;
            } else if(selectedSpeaker.tipo === "replica"){
                // Iniciar a réplica selecionada
                iniciarReplica(selectedSpeaker.nomeOriginal, selectedSpeaker.indexReplica);
                clearSelectedSpeaker();
                return; // iniciarReplica já chama iniciarCronometro
            }
        }

        iniciarCronometro();
    }
);

btnPausar.addEventListener(
    "click",
    pausarCronometro
);

btnRestaurar.addEventListener(
    "click",
    restaurarCronometro
);

btnEncerrar.addEventListener(
    "click",
    encerrarCronometro
);

btnTempoExtra.addEventListener(
    "click",
    ativarTempoExtra
);

btnAlarme.addEventListener(
    "click",
    ativarAlarme
);

btnTelao.addEventListener(
    "click",
    abrirTelao
);

btnProximo.addEventListener(
    "click",
    ()=>{

        if(
            modoSessao ===
            "consideracoes"
        ){

            chamarProximoOrador();

        }

    }
);

function inscreverVereador(
    nome
){

    if(
        filaConsideracoes.includes(
            nome
        )
    ){
        return;
    }

    if(
        speakerAtual.tipo !== "none" &&
        speakerAtual.nome.toUpperCase() === nome.toUpperCase()
    ){
        return;
    }

    filaConsideracoes.push(
        nome
    );

    atualizarFilaConsideracoes();

}

function clearSelectedSpeaker(){
    selectedSpeaker = null;
    // Remove visual selection from all items
    document.querySelectorAll(".itemFila.selected, .itemReplicaNaFila.selected").forEach(el => {
        el.classList.remove("selected");
    });
}

function selecionarItemFila(tipo, nome, nomeOriginal, indexReplica, element){
    clearSelectedSpeaker();

    console.log("[selecionarItemFila]", { tipo, nome, nomeOriginal, indexReplica });

    if(tipo === "orador"){
        selectedSpeaker = { tipo: "orador", nome: nome };
    } else if(tipo === "replica"){
        selectedSpeaker = { tipo: "replica", nome: nome, nomeOriginal: nomeOriginal, indexReplica: indexReplica };
    }

    // Visual highlight - mark the clicked element
    const allItems = document.querySelectorAll(".itemFila, .itemReplicaNaFila");
    allItems.forEach(el => el.classList.remove("selected"));
    if(element){
        element.classList.add("selected");
    }
}

function itemFilaEstaSelecionado(tipo, nome, nomeOriginal, indexReplica){
    if(!selectedSpeaker || selectedSpeaker.tipo !== tipo){
        return false;
    }

    if(tipo === "orador"){
        return selectedSpeaker.nome === nome;
    }

    return selectedSpeaker.nome === nome &&
    selectedSpeaker.nomeOriginal === nomeOriginal &&
    selectedSpeaker.indexReplica === indexReplica;
}

function speakerAtualEhAlvo(tipo, nome, nomeOriginal, indexReplica){
    if(speakerAtual.tipo !== tipo){
        return false;
    }

    if(tipo === "orador"){
        return speakerAtual.nome === nome;
    }

    return speakerAtual.nome === nome &&
    speakerAtual.nomeOriginal === nomeOriginal &&
    speakerAtual.indexReplica === indexReplica;
}

function iniciarOradorConsideracoes(nome){
    pausarCronometro();

    oradorAtualConsideracoes = nome;
    definirOradorAtual("orador", nome);

    tempoInicial = 300;
    tempoRestante = 300;

    atualizarCronometro();
    atualizarFilaConsideracoes();
    salvarEstadoTelao();
    clearSelectedSpeaker();

    ativarAudioContexto();
    iniciarCronometro();
}

function iniciarItemFila(tipo, nome, nomeOriginal, indexReplica){
    if(tipo === "replica"){
        iniciarReplica(nomeOriginal, indexReplica);
        clearSelectedSpeaker();
        return;
    }

    iniciarOradorConsideracoes(nome);
}

function pausarItemFila(tipo, nome, nomeOriginal, indexReplica){
    if(!speakerAtualEhAlvo(tipo, nome, nomeOriginal, indexReplica)){
        return;
    }

    pausarCronometro();
    atualizarFilaConsideracoes();
    salvarEstadoTelao();
}

function adicionarTempoExtraAlvo(tipo, nome, nomeOriginal, indexReplica, segundos){
    if(!speakerAtualEhAlvo(tipo, nome, nomeOriginal, indexReplica)){
        return;
    }

    tempoInicial += segundos;
    tempoRestante += segundos;

    if(tipo === "replica"){
        const replicas = replicasPorOrador[nomeOriginal];
        if(replicas && replicas[indexReplica]){
            replicas[indexReplica].tempo += segundos;
        }
    }

    atualizarCronometro();
    atualizarFilaConsideracoes();
    salvarEstadoTelao();
}

function renderizarOpcoesTempoExtra(tipo, nome, nomeOriginal, indexReplica, desativado){
    return opcoesTempoExtraOrador.map(opcao => `
        <button
        class="tempoExtraOpcao"
        data-segundos="${opcao.segundos}"
        ${desativado ? "disabled" : ""}
        onclick="event.stopPropagation(); adicionarTempoExtraAlvo('${tipo}', '${nome}', ${nomeOriginal ? "'" + nomeOriginal + "'" : "null"}, ${indexReplica === null ? "null" : indexReplica}, ${opcao.segundos})">
            ${opcao.label}
        </button>
    `).join("");
}

function renderizarControlesItemFila(tipo, nome, nomeOriginal, indexReplica, itemAtivo){
    const classeTempoExtra = itemAtivo ? "tempoExtraDropdown" : "tempoExtraDropdown desativado";
    const disabledAttr = itemAtivo ? "" : "disabled";
    const tituloTempoExtra = itemAtivo ? "Acrescentar tempo ao orador atual" : "Inicie este orador para acrescentar tempo";
    const nomeOriginalArg = nomeOriginal ? "'" + nomeOriginal + "'" : "null";
    const indexReplicaArg = indexReplica === null ? "null" : indexReplica;

    return `
        <button
        class="btnControleFila btnIniciarFila"
        onclick="event.stopPropagation(); iniciarItemFila('${tipo}', '${nome}', ${nomeOriginalArg}, ${indexReplicaArg})">
            Iniciar
        </button>

        <button
        class="btnControleFila btnPausarFila"
        ${disabledAttr}
        onclick="event.stopPropagation(); pausarItemFila('${tipo}', '${nome}', ${nomeOriginalArg}, ${indexReplicaArg})">
            Pausar
        </button>

        <div class="${classeTempoExtra}">
            <button
            class="btnControleFila btnTempoExtraFila"
            ${disabledAttr}
            title="${tituloTempoExtra}"
            onclick="event.stopPropagation();">
                Tempo Extra
            </button>
            <div class="tempoExtraOpcoes">
                ${renderizarOpcoesTempoExtra(tipo, nome, nomeOriginal, indexReplica, !itemAtivo)}
            </div>
        </div>
    `;
}

function atualizarFilaConsideracoes(){

    const div =
    document.getElementById(
        "filaOradores"
    );

    if(!div){
        return;
    }

    div.innerHTML = "";

    // Atualizar "Próximo Orador" usando a função centralizada (não filaConsideracoes[0/1])
    atualizarTextoProximoOrador();

    filaConsideracoes.forEach(
        (nome,index)=>{

        const container = document.createElement("div");
        container.className = "itemFilaContainer";

        const item =
        document.createElement(
            "div"
        );

        const itemAtivo = speakerAtualEhAlvo("orador", nome, null, null);
        const itemSelecionado = itemFilaEstaSelecionado("orador", nome, null, null);

        item.className =
        "itemFila" +
        (itemAtivo ? " emUso" : "") +
        (itemSelecionado ? " selected" : "");

        item.onclick = function(e){
            // Ignore clicks on controls inside the item
            if(e.target.closest(".botoesDireita")) return;
            selecionarItemFila("orador", nome, null, null, item);
        };

        item.innerHTML = `

            <button
            class="nomeOradorBtn"
            onclick="event.stopPropagation(); selecionarItemFila('orador', '${nome}', null, null, this.closest('.itemFila'))">

                ${index+1}º
                ${nome}

            </button>

            <div class="botoesDireita">

                <div class="controlesFala">
                    ${renderizarControlesItemFila("orador", nome, null, null, itemAtivo)}
                </div>

                <div class="setasContainer">

                    <button
                    onclick="
                    subirOrador(
                    ${index}
                    )">

                    ▲

                    </button>

                    <button
                    onclick="
                    descerOrador(
                    ${index}
                    )">

                    ▼

                    </button>

                </div>

                <button class="btnMais"
                onclick="
                abrirModalSelecionarVereador(
                    '${nome}'
                )"
                title="Adicionar réplica para ${nome}">

                +

                </button>

            </div>

        `;

        container.appendChild(item);

        // Adicionar réplicas deste orador abaixo dele
        const replicas = replicasPorOrador[nome];
        if(replicas && replicas.length > 0){
            replicas.forEach((replica, repIndex) => {
                const repItem = document.createElement("div");
                repItem.className = "itemReplicaNaFila";

                const replicaAtiva = speakerAtualEhAlvo("replica", replica.nome, nome, repIndex);
                const replicaSelecionada = itemFilaEstaSelecionado("replica", replica.nome, nome, repIndex);

                repItem.className =
                "itemReplicaNaFila" +
                (replicaAtiva ? " emUso" : "") +
                (replicaSelecionada ? " selected" : "");

                repItem.onclick = function(e){
                    // Ignore clicks on controls inside the item
                    if(e.target.closest(".botoesDireita")) return;
                    selecionarItemFila("replica", replica.nome, nome, repIndex, repItem);
                };

                repItem.innerHTML = `
                    <button
                    class="nomeOradorBtn nomeReplicaBtn"
                    onclick="event.stopPropagation(); selecionarItemFila('replica', '${replica.nome}', '${nome}', ${repIndex}, this.closest('.itemReplicaNaFila'))">
                        ${replica.nome}
                        <br>
                        <small>${formatarTempo(replica.tempo)}</small>
                    </button>
                    <div class="botoesDireita">
                        <div class="controlesFala">
                            ${renderizarControlesItemFila("replica", replica.nome, nome, repIndex, replicaAtiva)}
                        </div>
                        <div class="setasContainer">
                            <button onclick="subirReplica('${nome}', ${repIndex})">▲</button>
                            <button onclick="descerReplica('${nome}', ${repIndex})">▼</button>
                        </div>
                    </div>
                `;

                container.appendChild(repItem);
            });
        }

        div.appendChild(container);

    });

}

function subirOrador(
    index
){

    if(index === 0){
        return;
    }

    [
        filaConsideracoes[index-1],
        filaConsideracoes[index]
    ] =
    [
        filaConsideracoes[index],
        filaConsideracoes[index-1]
    ];

    atualizarFilaConsideracoes();

}

function descerOrador(
    index
){

    if(
        index >=
        filaConsideracoes.length-1
    ){
        return;
    }

    [
        filaConsideracoes[index+1],
        filaConsideracoes[index]
    ] =
    [
        filaConsideracoes[index],
        filaConsideracoes[index+1]
    ];

    atualizarFilaConsideracoes();

}

function chamarProximoOrador(){

    console.log("[chamarProximoOrador] INÍCIO - speakerAtual:", JSON.stringify(speakerAtual), "fila:", JSON.stringify(filaConsideracoes), "replicasConcluidas:", JSON.stringify(replicasConcluidasAtual));

    if(
        filaConsideracoes.length === 0
    ){
        console.log("[chamarProximoOrador] fila vazia, retornando");
        return;
    }

    // Se ninguém está falando, iniciar o primeiro (sem remover)
    if(speakerAtual.tipo === "none"){

        // Novo orador principal - limpar réplicas concluídas do ciclo anterior
        replicasConcluidasAtual = [];

        const nome = filaConsideracoes[0];

        oradorAtualConsideracoes =
        nome;

        definirOradorAtual("orador", nome);

        tempoInicial = 300;
        tempoRestante = 300;

        pausarCronometro();
        atualizarCronometro();
        atualizarFilaConsideracoes();

        setTimeout(() => {
            salvarEstadoTelao();
        }, 100);

        console.log("[chamarProximoOrador] FIM - iniciou novo orador:", nome);
        return;
    }

    // Verificar se o orador atual é uma réplica pelo estado explícito
    if(speakerAtual.tipo === "replica"){
        const nomeOradorOriginal = speakerAtual.nomeOriginal;
        const indexReplicaAtual = speakerAtual.indexReplica;

        // Marcar réplica como concluída usando dados estruturados
        marcarReplicaConcluida(nomeOradorOriginal, indexReplicaAtual);

        // Verificar se há mais réplicas para este orador (ainda não concluídas)
        const chaveReplicasEnc = buscarChaveReplicas(nomeOradorOriginal);
        const replicas = chaveReplicasEnc ? replicasPorOrador[chaveReplicasEnc] : null;
        if(replicas && replicas.length > 0){
            // Encontrar a próxima réplica posterior à atual.
            const proximaReplicaInfo = encontrarProximaReplicaSequencial(
                replicas,
                nomeOradorOriginal,
                indexReplicaAtual
            );
            if(proximaReplicaInfo){
                const proximaReplica = proximaReplicaInfo.replica;
                const idxProxima = proximaReplicaInfo.index;
                definirOradorAtual("replica", proximaReplica.nome, nomeOradorOriginal, idxProxima);

                tempoInicial = proximaReplica.tempo;
                tempoRestante = proximaReplica.tempo;

                pausarCronometro();
                atualizarCronometro();
                atualizarFilaConsideracoes();
                atualizarListaEncerrados();

                setTimeout(() => {
                    salvarEstadoTelao();
                }, 100);

                console.log("[chamarProximoOrador] FIM - avançou para próxima réplica:", proximaReplica.nome, "index:", idxProxima);
                return;
            }
        }

        // Sem mais réplicas, avança para remover o orador principal (cai no fluxo normal abaixo)
        console.log("[chamarProximoOrador] sem mais réplicas, avançando orador principal");
    } else {
        // Orador atual é um orador principal - verificar se há réplicas pendentes
        const oradorPrincipalNome = speakerAtual.nome;
        const chaveReplicasOrador = buscarChaveReplicas(oradorPrincipalNome);
        const replicasPendentes = chaveReplicasOrador ? replicasPorOrador[chaveReplicasOrador] : null;
        
        if(replicasPendentes && replicasPendentes.length > 0){
            // Há réplicas pendentes - avançar para a primeira
            const primeiraReplicaInfo = encontrarProximaReplicaSequencial(replicasPendentes, oradorPrincipalNome);
            if(!primeiraReplicaInfo){
                console.log("[chamarProximoOrador] orador sem réplicas pendentes não concluídas");
            } else {
            const primeiraReplica = primeiraReplicaInfo.replica;
            const idxPrimeira = primeiraReplicaInfo.index;
            definirOradorAtual("replica", primeiraReplica.nome, oradorPrincipalNome, idxPrimeira);

            tempoInicial = primeiraReplica.tempo;
            tempoRestante = primeiraReplica.tempo;

            pausarCronometro();
            atualizarCronometro();
            atualizarFilaConsideracoes();
            atualizarListaEncerrados();

            setTimeout(() => {
                salvarEstadoTelao();
            }, 100);

            console.log("[chamarProximoOrador] FIM - avançou para primeira réplica:", primeiraReplica.nome, "index:", idxPrimeira);
            return;
            }
        }
    }

    // ==========================================
    // AVANÇAR PARA O PRÓXIMO ORADOR PRINCIPAL
    // ==========================================
    // IMPORTANTE: não assumir que filaConsideracoes[0] é o orador atual
    // O orador atual pode ter sido selecionado manualmente (ex: Pedro quando João é [0])
    // Usamos speakerAtual para identificar quem está falando, e filaConsideracoes
    // para remover a pessoa correta.
    // ==========================================

    // Identificar quem é o orador principal atual via speakerAtual (fonte única da verdade)
    const oradorPrincipalAtual = speakerAtual.tipo === "replica" ?
    speakerAtual.nomeOriginal :
    speakerAtual.nome;

    // Encontrar o orador principal atual na fila
    const indexNaFila = encontrarOradorNaFila(oradorPrincipalAtual);

    if(indexNaFila === -1){
        // Orador não está na fila (caso raro) - usar o primeiro da fila como fallback
        console.warn("[chamarProximoOrador] orador atual não encontrado na fila:", oradorPrincipalAtual);
    }

    // O orador principal a ser removido é o que está falando
    const oradorParaRemover = (indexNaFila !== -1) ? filaConsideracoes[indexNaFila] : filaConsideracoes[0];

    // Adicionar ao histórico
    if(oradorParaRemover && !oradoresEncerrados.includes(oradorParaRemover)){
        oradoresEncerrados.push(oradorParaRemover);
    }
    if(oradorParaRemover){
        adicionarAoHistorico(oradorParaRemover, false);
    }

    // Adicionar réplicas concluídas ao histórico
    // Buscar o nome do vereador que fez cada réplica nos dados de réplicas
    replicasConcluidasAtual.forEach(rep => {
        const replicas = replicasPorOrador[rep.nomeOriginal];
        if(replicas && replicas[rep.indexReplica]){
            adicionarAoHistorico(replicas[rep.indexReplica].nome, true);
        }
    });

    replicasConcluidasAtual = [];

    // Limpar réplicas pendentes do orador que está sendo removido
    const chaveReplicas = buscarChaveReplicas(oradorParaRemover);
    if(chaveReplicas){
        delete replicasPorOrador[chaveReplicas];
    }

    atualizarListaEncerrados();
    atualizarHistoricoOradores();

    // Remove o orador da fila (pela posição correta, não necessariamente [0])
    if(indexNaFila !== -1){
        filaConsideracoes.splice(indexNaFila, 1);
        console.log("[chamarProximoOrador] removeu da fila na posição", indexNaFila, ":", oradorParaRemover);
    } else {
        filaConsideracoes.shift();
        console.log("[chamarProximoOrador] removeu primeiro da fila (fallback)");
    }

    if(
        filaConsideracoes.length === 0
    ){
        // Não há mais oradores
        oradorAtualConsideracoes = "";
        definirOradorAtual("none");

        pausarCronometro();
        tempoInicial = 300;
        tempoRestante = 300;
        atualizarCronometro();
        atualizarFilaConsideracoes();

        console.log("[chamarProximoOrador] FIM - fila vazia após remoção");
        return;
    }

    // Define o próximo orador respeitando a posição de quem acabou de sair.
    const proximoIndex =
    indexNaFila !== -1 ?
    Math.min(indexNaFila, filaConsideracoes.length - 1) :
    0;

    const nome = filaConsideracoes[proximoIndex];

    oradorAtualConsideracoes =
    nome;

    definirOradorAtual("orador", nome);

    tempoInicial = 300;
    tempoRestante = 300;

    pausarCronometro();
    atualizarCronometro();

    atualizarFilaConsideracoes();

    // Forçar sincronização do telão
    setTimeout(() => {
        salvarEstadoTelao();
    }, 100);

    console.log("[chamarProximoOrador] FIM - próximo orador principal:", nome);
}

/* ==========================
LISTA DE ENCERRADOS
========================== */

function atualizarListaEncerrados(){
    const div = document.getElementById("listaEncerrados");
    if(!div){
        return;
    }

    div.innerHTML = "";

    if(oradoresEncerrados.length === 0){
        div.innerHTML = "<div style='color:#888;padding:8px;'>Nenhum orador encerrado</div>";
        return;
    }

    oradoresEncerrados.forEach(nome => {
        const container = document.createElement("div");
        container.className = "itemEncerrado";

        const nomeSpan = document.createElement("span");
        nomeSpan.className = "nomeEncerrado";
        nomeSpan.textContent = nome;
        container.appendChild(nomeSpan);

        const btnMais = document.createElement("button");
        btnMais.className = "btnMais";
        btnMais.textContent = "+";
        btnMais.title = "Adicionar réplica para " + nome;
        btnMais.onclick = function(){
            abrirModalSelecionarVereador(nome);
        };
        container.appendChild(btnMais);

        div.appendChild(container);
    });
}

/* ==========================
HISTÓRICO DE ORADORES
========================== */

function atualizarHistoricoOradores(){
    const div = document.getElementById("historicoOradores");
    if(!div){
        return;
    }

    div.innerHTML = "";

    if(historicoOradores.length === 0){
        div.innerHTML = "<div style='color:#888;padding:8px;'>Nenhum orador registrado</div>";
        return;
    }

    historicoOradores
    .slice()
    .reverse()
    .forEach((entry, index) => {
        const posicao = historicoOradores.length - index;

        if(typeof entry === 'object' && entry.nome){
            // É um orador principal com possíveis réplicas
            const container = document.createElement("div");
            container.className = "itemFilaContainer";
            container.style.marginBottom = "6px";

            const item = document.createElement("div");
            item.className = "itemFila";
            item.style.background = "#f9f9f9";
            item.style.padding = "6px 10px";
            item.innerHTML = `
                <span style="font-size:13px;font-weight:bold;">
                    ${posicao}º ${entry.nome}
                </span>
            `;
            container.appendChild(item);

            // Adicionar réplicas abaixo
            if(entry.replicas && entry.replicas.length > 0){
                entry.replicas.forEach((repNome) => {
                    const repItem = document.createElement("div");
                    repItem.className = "itemReplicaHistorico";
                    repItem.innerHTML = `
                        <span>
                            ${repNome}
                        </span>
                    `;
                    container.appendChild(repItem);
                });
            }

            div.appendChild(container);
        } else {
            // É uma entrada simples (string)
            const item = document.createElement("div");
            item.className = "itemFila";
            item.style.background = "#f9f9f9";
            item.style.padding = "6px 10px";
            item.innerHTML = `
                <span style="font-size:13px;">
                    ${posicao}º ${entry}
                </span>
            `;
            div.appendChild(item);
        }
    });
}

/* ==========================
RÉPLICAS - FUNÇÕES
========================== */

function adicionarReplica(nomeOriginal, vereadorNome){
    if(!replicasPorOrador[nomeOriginal]){
        replicasPorOrador[nomeOriginal] = [];
    }

    // Verificar se este vereador já tem réplica para este orador
    const jaExiste = replicasPorOrador[nomeOriginal].some(r => r.nome === vereadorNome);
    if(jaExiste){
        return;
    }

    replicasPorOrador[nomeOriginal].push({
        nome: vereadorNome,
        tempo: 120 // 2 minutos
    });

    atualizarFilaReplicas();
    atualizarFilaConsideracoes();
    salvarEstadoTelao();
}

function iniciarReplica(nomeOriginal, indexReplica){
    const replicas = replicasPorOrador[nomeOriginal];
    if(!replicas || indexReplica >= replicas.length){
        return;
    }

    const replica = replicas[indexReplica];

    console.log("[iniciarReplica] INÍCIO - nomeOriginal:", nomeOriginal, "indexReplica:", indexReplica, "replica:", JSON.stringify(replica), "speakerAtual antes:", JSON.stringify(speakerAtual), "fila:", JSON.stringify(filaConsideracoes), "replicasConcluidas:", JSON.stringify(replicasConcluidasAtual));

    // Pausar o cronômetro atual e configurar para a réplica
    pausarCronometro();

    definirOradorAtual("replica", replica.nome, nomeOriginal, indexReplica);

    tempoInicial = replica.tempo;
    tempoRestante = replica.tempo;

    // NÃO remover da lista de réplicas pendentes - elas ficam visíveis até "Próximo Orador"
    atualizarCronometro();
    atualizarFilaReplicas();
    atualizarFilaConsideracoes();

    salvarEstadoTelao();

    // Iniciar o cronômetro automaticamente, igual ao botão "Iniciar" principal
    ativarAudioContexto();
    iniciarCronometro();

    console.log("[iniciarReplica] FIM - speakerAtual:", JSON.stringify(speakerAtual));
}

function subirReplica(nomeOriginal, index){
    const replicas = replicasPorOrador[nomeOriginal];
    if(!replicas || index === 0){
        return;
    }

    [replicas[index - 1], replicas[index]] = [replicas[index], replicas[index - 1]];
    atualizarFilaReplicas();
    atualizarFilaConsideracoes();
}

function descerReplica(nomeOriginal, index){
    const replicas = replicasPorOrador[nomeOriginal];
    if(!replicas || index >= replicas.length - 1){
        return;
    }

    [replicas[index + 1], replicas[index]] = [replicas[index], replicas[index + 1]];
    atualizarFilaReplicas();
    atualizarFilaConsideracoes();
}

function abrirModalSelecionarVereador(nomeOriginal){
    // Criar modal para selecionar vereador para réplica
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.onclick = function(e){
        if(e.target === overlay){
            overlay.remove();
        }
    };

    const modal = document.createElement("div");
    modal.className = "modal-replica-select";

    const titulo = document.createElement("h3");
    titulo.textContent = "Selecionar Vereador para Réplica de " + nomeOriginal;
    modal.appendChild(titulo);

    const lista = document.createElement("div");
    lista.className = "modal-replica-lista";

    const checkboxes = [];

    vereadores.forEach(v => {
        const label = document.createElement("label");
        label.className = "modal-checkbox-label";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = v;
        checkbox.style.width = "auto";
        checkbox.style.margin = "0 8px 0 0";

        const text = document.createTextNode(v);

        label.appendChild(checkbox);
        label.appendChild(text);
        lista.appendChild(label);

        checkboxes.push(checkbox);
    });

    modal.appendChild(lista);

    const botoesContainer = document.createElement("div");
    botoesContainer.style.cssText = "display:flex;gap:10px;margin-top:12px;";

    const btnAdicionar = document.createElement("button");
    btnAdicionar.className = "botaoConfirmar";
    btnAdicionar.textContent = "Adicionar";
    btnAdicionar.onclick = function(){
        let added = false;
        checkboxes.forEach(cb => {
            if(cb.checked){
                adicionarReplica(nomeOriginal, cb.value);
                added = true;
            }
        });
        if(added){
            overlay.remove();
        }
    };

    const btnCancelar = document.createElement("button");
    btnCancelar.className = "botaoCancelar";
    btnCancelar.textContent = "Cancelar";
    btnCancelar.onclick = function(){
        overlay.remove();
    };

    botoesContainer.appendChild(btnAdicionar);
    botoesContainer.appendChild(btnCancelar);
    modal.appendChild(botoesContainer);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

function atualizarFilaReplicas(){
    const div = document.getElementById("filaReplicas");
    if(!div){
        return;
    }

    div.innerHTML = "";

    // Verificar se há oradores com réplicas pendentes
    const oradoresComReplicas = Object.keys(replicasPorOrador);

    if(oradoresComReplicas.length === 0){
        div.innerHTML = "<div style='color:#888;padding:8px;'>Nenhuma réplica pendente</div>";
        return;
    }

    oradoresComReplicas.forEach(nomeOriginal => {
        const replicas = replicasPorOrador[nomeOriginal];
        if(!replicas || replicas.length === 0){
            return;
        }

        const oradorDiv = document.createElement("div");
        oradorDiv.className = "replica-orador-container";

        const cabecalho = document.createElement("div");
        cabecalho.className = "replica-orador-header";
        cabecalho.textContent = nomeOriginal;
        oradorDiv.appendChild(cabecalho);

        replicas.forEach((replica, index) => {
            const item = document.createElement("div");
            const replicaAtiva = speakerAtualEhAlvo("replica", replica.nome, nomeOriginal, index);
            item.className = "itemReplica" + (replicaAtiva ? " emUso" : "");

            item.innerHTML = `
                <button
                class="nomeOradorBtn nomeReplicaBtn"
                onclick="event.stopPropagation(); selecionarItemFila('replica', '${replica.nome}', '${nomeOriginal}', ${index}, this.closest('.itemReplica'))">
                    ${replica.nome}
                    <br>
                    <small>${formatarTempo(replica.tempo)}</small>
                </button>
                <div class="botoesDireita">
                    <div class="controlesFala">
                        ${renderizarControlesItemFila("replica", replica.nome, nomeOriginal, index, replicaAtiva)}
                    </div>
                    <div class="setasContainer">
                        <button onclick="subirReplica('${nomeOriginal}', ${index})">▲</button>
                        <button onclick="descerReplica('${nomeOriginal}', ${index})">▼</button>
                    </div>
                </div>
            `;

            oradorDiv.appendChild(item);
        });

        div.appendChild(oradorDiv);
    });
}
