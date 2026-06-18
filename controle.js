"use strict";

/* ==========================
ESTADO GLOBAL
========================== */

let modoSessao =
"tela_simples";
let historicoDiscussao = [];

let historicoOradores = [];

function adicionarAoHistorico(nome, isReplica){
    if(isReplica){
        // Adicionar réplica ao último orador principal no histórico
        for(let i = historicoOradores.length - 1; i >= 0; i--){
            const entry = historicoOradores[i];
            if(typeof entry === 'object' && entry.nome){
                if(!entry.replicas){
                    entry.replicas = [];
                }
                entry.replicas.push(nome);
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
    const el = document.getElementById("oradorAtual");
    return el.getAttribute("data-fulltext") || el.textContent.trim();
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

function avancarProximoOrador(){
    atualizarFilaConsideracoes();
    atualizarListaEncerrados();
    atualizarHistoricoOradores();

    if(filaConsideracoes.length > 0){
        const proximoNome = filaConsideracoes[0];
        oradorAtualConsideracoes = proximoNome;
        document.getElementById("oradorAtual").textContent = proximoNome.toUpperCase();
        document.getElementById("oradorAtual").removeAttribute("data-fulltext");
        tempoInicial = 300;
        tempoRestante = 300;
        pausarCronometro();
        atualizarCronometro();
    } else {
        oradorAtualConsideracoes = "";
        document.getElementById("oradorAtual").textContent = "AGUARDANDO INÍCIO";
        document.getElementById("oradorAtual").removeAttribute("data-fulltext");
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
let tempoExtraAtivo = false;
let alarmeAtivo = false;
let oradorTribunaLivre = null;
let filaReplicas = [];
let replicasConcluidasAtual = [];
let historicoTribuna = [];
let filaConvidadosTribuna = [];

/* ==========================
PILHA DE RETORNO
Salva estado completo antes de "Próximo" para permitir "Retornar"
========================== */
let pilhaRetorno = [];

function salvarEstadoParaRetorno(){
    const currentSpeaker = obterTextoOradorAtual();
    pilhaRetorno.push({
        // Estado completo do orador atual
        oradorAtual: currentSpeaker,
        oradorAtualConsideracoes: oradorAtualConsideracoes,
        replicasConcluidasAtual: [...replicasConcluidasAtual],
        replicasPorOrador: JSON.parse(JSON.stringify(replicasPorOrador)),
        tempoInicial: tempoInicial,
        tempoRestante: tempoRestante
    });
}

function retornarOradorAnterior(){
    if(pilhaRetorno.length === 0 || historicoOradores.length === 0){
        return;
    }

    pausarCronometro();

    const estado = pilhaRetorno.pop();

    // Pegar o último orador do histórico (foi movido para lá pelo "Próximo")
    const ultimoEntry = historicoOradores[historicoOradores.length - 1];
    let nomeAnterior;
    let replicasAnteriores = [];

    if(typeof ultimoEntry === 'object' && ultimoEntry.nome){
        nomeAnterior = ultimoEntry.nome;
        replicasAnteriores = ultimoEntry.replicas || [];
    } else {
        nomeAnterior = ultimoEntry;
    }

    // Remover do histórico
    historicoOradores.pop();

    // Remover de oradoresEncerrados
    const idxEncerrado = oradoresEncerrados.indexOf(nomeAnterior);
    if(idxEncerrado !== -1){
        oradoresEncerrados.splice(idxEncerrado, 1);
    }

    // Colocar o orador anterior de volta no início da fila
    filaConsideracoes.unshift(nomeAnterior);

    // Restaurar réplicas que tinha antes de ser encerrado
    if(replicasAnteriores.length > 0 && !replicasPorOrador[nomeAnterior]){
        replicasPorOrador[nomeAnterior] = [];
    }
    if(replicasAnteriores.length > 0){
        replicasAnteriores.forEach(repNome => {
            const jaTem = replicasPorOrador[nomeAnterior].some(r => r.nome === repNome);
            if(!jaTem){
                replicasPorOrador[nomeAnterior].push({
                    nome: repNome,
                    tempo: 120
                });
            }
        });
    }

    // Restaurar réplicas concluídas ao estado anterior ao "Próximo"
    replicasConcluidasAtual = estado.replicasConcluidasAtual || [];

    // Restaurar o orador anterior como atual
    oradorAtualConsideracoes = nomeAnterior;
    document.getElementById("oradorAtual").textContent = nomeAnterior.toUpperCase();
    document.getElementById("oradorAtual").removeAttribute("data-fulltext");

    tempoInicial = 300;
    tempoRestante = 300;

    atualizarCronometro();
    atualizarFilaConsideracoes();
    atualizarListaEncerrados();
    atualizarHistoricoOradores();
    salvarEstadoTelao();
}

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

    const oradorAtualElemento = document.getElementById("oradorAtual");
    let oradorExibir = oradorAtualElemento.getAttribute("data-fulltext") || oradorAtualElemento.textContent;

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

    // Garantir que o orador atual esteja zerado ao carregar considerações
    if(!oradorAtualConsideracoes && filaConsideracoes.length === 0){
        document.getElementById("oradorAtual").textContent = "AGUARDANDO INÍCIO";
        document.getElementById("oradorAtual").removeAttribute("data-fulltext");
        pausarCronometro();
        tempoInicial = 300;
        tempoRestante = 300;
        atualizarCronometro();
        salvarEstadoTelao();
    }

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

        lista.appendChild(btn);

    });

    // Adicionar listener para registrar convidado
    document.getElementById("btnRegistrarConvidado").addEventListener("click", registrarConvidado);

    // Garantir que o orador atual esteja zerado ao carregar a tribuna
    if(!oradorTribunaLivre){
        document.getElementById("oradorAtual").textContent = "AGUARDANDO INÍCIO";
        document.getElementById("oradorAtual").removeAttribute("data-fulltext");
        pausarCronometro();
        tempoInicial = 300;
        tempoRestante = 300;
        atualizarCronometro();
        salvarEstadoTelao();
    }

    // Atualizar fila de convidados (caso existam pendentes)
    atualizarFilaConvidadosTribuna();

}

function registrarConvidado(){

    const nomeInput = document.getElementById("nomeConvidado");
    const nome = nomeInput.value.trim();

    if(nome === ""){
        alert("Por favor, insira um nome");
        return;
    }

    // Verificar se já está na fila
    if(filaConvidadosTribuna.includes(nome)){
        alert("Este orador já está na fila");
        return;
    }

    // Adicionar à fila de convidados
    filaConvidadosTribuna.push(nome);

    nomeInput.value = "";

    // Adicionar ao histórico da tribuna
    if(!historicoTribuna.includes(nome)){
        historicoTribuna.push(nome);
    }
    atualizarHistoricoTribuna();
    atualizarFilaConvidadosTribuna();

}

function atualizarFilaConvidadosTribuna(){
    const div = document.getElementById("listaComentarios");
    if(!div){
        return;
    }

    // Remover botões de convidados existentes (manter os vereadores)
    const botoesConvidados = div.querySelectorAll(".botaoConvidadoTribuna");
    botoesConvidados.forEach(btn => btn.remove());

    // Separador se houver convidados
    if(filaConvidadosTribuna.length > 0){
        const sep = document.createElement("hr");
        sep.style.cssText = "margin:10px 0;border-color:#555;";
        sep.className = "separadorConvidados";
        // Verificar se já existe separador
        const sepExistente = div.querySelector(".separadorConvidados");
        if(!sepExistente){
            div.appendChild(sep);
        }

        // Título da seção de convidados
        const tituloExistente = div.querySelector(".tituloConvidados");
        if(!tituloExistente){
            const titulo = document.createElement("div");
            titulo.className = "tituloConvidados";
            titulo.textContent = "Oradores Convidados:";
            titulo.style.cssText = "font-size:13px;font-weight:bold;color:#000;margin:8px 0 4px;text-align:center;";
            div.appendChild(titulo);
        }
    }

    // Adicionar botões de convidados (um abaixo do outro)
    filaConvidadosTribuna.forEach((nome, index) => {
        const btn = document.createElement("button");
        btn.className = "botaoVereador botaoConvidadoTribuna";
        btn.textContent = nome;
        btn.style.cssText = "background:#4caf50;color:white;width:100%;";
        btn.onclick = function(){
            selecionarConvidadoTribuna(nome, index);
        };
        div.appendChild(btn);
    });
}

function selecionarConvidadoTribuna(nome, index){
    pausarCronometro();

    oradorTribunaLivre = nome;

    document.getElementById("oradorAtual").textContent = nome.toUpperCase();

    tempoInicial = 60;
    tempoRestante = 60;

    atualizarCronometro();
    salvarEstadoTelao();

    // Remover da fila
    filaConvidadosTribuna.splice(index, 1);
    atualizarFilaConvidadosTribuna();
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

    document.getElementById("oradorAtual").textContent = nome.toUpperCase();

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

    const btnRetornarEl =
    document.getElementById(
        "btnRetornar"
    );

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
        btnRetornarEl.style.display = "none";

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
        btnRetornarEl.style.display = "";

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
        btnRetornarEl.style.display = "none";

        // Mostrar container ao sair da tela simples
        const container = document.querySelector(".container");
        if(container){
            container.style.display = "";
        }

        carregarTribuna();

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
        btnRetornarEl.style.display = "none";

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

    document
    .getElementById(
        "oradorAtual"
    )
    .textContent =
    nome.toUpperCase();

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
    } else if(tempoRestante <= 10){
        cronEl.style.color = "#f57c00";
    } else if(tempoRestante <= 30){
        cronEl.style.color = "#f9a825";
    } else {
        cronEl.style.color = "";
    }

    salvarEstadoTelao();

}

function iniciarCronometro(){

    if(
        document
        .getElementById("oradorAtual")
        .textContent.trim() ===
        "AGUARDANDO INÍCIO"
    ){

        // Em considerações finais, iniciar define o primeiro da fila como orador
        if(
            modoSessao === "consideracoes" &&
            filaConsideracoes.length > 0
        ){
            const nome = filaConsideracoes[0];
            oradorAtualConsideracoes = nome;
            document.getElementById("oradorAtual")
            .textContent = nome.toUpperCase();

            tempoInicial = 300;
            tempoRestante = 300;
            atualizarCronometro();

            // Atualizar próximo orador (próximo após o atual)
            document.getElementById("proximoOrador")
            .textContent =
            filaConsideracoes.length > 1
            ? "Próximo Orador: " + filaConsideracoes[1]
            : "Próximo Orador: ---";

            salvarEstadoTelao();
        } else {
            return;
        }

    }

    if(cronometroRodando){
        return;
    }

    cronometroRodando = true;

    intervaloCronometro =
    setInterval(()=>{

        // Se tempo extra estiver desligado e o tempo chegou a zero, parar o cronômetro
        if(tempoRestante <= 0 && !tempoExtraAtivo){
            pausarCronometro();
            atualizarCronometro();
            salvarEstadoTelao();
            return;
        }

        tempoRestante--;

        atualizarCronometro();

        // Verificar se deve ativar alarme ao chegar em 00:00 ou ultrapassar
        if(tempoRestante <= 0 && alarmeAtivo){
            tocarAlarme();
            // Desativar após tocar para não repetir a cada tick
            alarmeAtivo = false;
            const btn = document.getElementById("btnAlarme");
            btn.style.background = "#2b7cd3";
            btn.textContent = "🟢 Alarme desligado";
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

    pausarCronometro();

    const oradorAtual = obterTextoOradorAtual();

    if(
        modoSessao === "consideracoes" &&
        oradorAtual !== "AGUARDANDO INÍCIO"
    ){
        // Verificar se é uma réplica
        const replicaMatch = oradorAtual.match(/^(.+)\s*\(RÉPLICA DE\s*(.+)\)$/i);

        let oradorOriginal;
        if(replicaMatch){
            oradorOriginal = replicaMatch[2];

            if(!replicasConcluidasAtual.includes(oradorAtual)){
                // Registrar réplica como concluída (histórico será atualizado ao avançar orador)
                replicasConcluidasAtual.push(oradorAtual);
            }

            // Verificar se há mais réplicas para este orador (sem removê-las da lista)
            const chaveReplicasEnc = buscarChaveReplicas(oradorOriginal);
            const replicas = chaveReplicasEnc ? replicasPorOrador[chaveReplicasEnc] : null;
            if(replicas && replicas.length > 0){
                // Encontrar a próxima réplica que ainda não foi concluída
                const proximaReplica = replicas.find(r => {
                    const fullText = r.nome.toUpperCase() + " (RÉPLICA DE " + oradorOriginal.toUpperCase() + ")";
                    return !replicasConcluidasAtual.includes(fullText);
                });
                if(proximaReplica){
                    document.getElementById("oradorAtual")
                    .innerHTML = proximaReplica.nome.toUpperCase() + "<br><small>RÉPLICA DE " + oradorOriginal.toUpperCase() + "</small>";
                    document.getElementById("oradorAtual")
                    .setAttribute("data-fulltext", proximaReplica.nome.toUpperCase() + " (RÉPLICA DE " + oradorOriginal.toUpperCase() + ")");

                    tempoInicial = proximaReplica.tempo;
                    tempoRestante = proximaReplica.tempo;

                    atualizarCronometro();
                    atualizarFilaConsideracoes();

                    salvarEstadoTelao();
                    return;
                }
            }

            // Sem mais réplicas, apenas pausar (não avançar automaticamente)
            atualizarFilaConsideracoes();
            salvarEstadoTelao();
            document.getElementById("oradorAtual").textContent = "AGUARDANDO INÍCIO";
            document.getElementById("oradorAtual").removeAttribute("data-fulltext");
            return;
        }

        // É um orador principal
        const nomeOriginal = oradorAtual
        .toLowerCase()
        .split(" ")
        .map(palavra =>
            palavra.charAt(0).toUpperCase() + palavra.slice(1)
        )
        .join(" ");

        const encontrado = vereadores.find(v =>
            v.toUpperCase() === oradorAtual ||
            nomeOriginal.toUpperCase() === v.toUpperCase()
        );

        if(encontrado){
            if(!oradoresEncerrados.includes(encontrado)){
                oradoresEncerrados.push(encontrado);
            }

            // Não adicionar ao histórico nem remover da fila aqui
            // Será feito ao clicar em "Próximo Orador"

            // Verificar se há réplicas pendentes (sem removê-las da lista)
            const replicas = replicasPorOrador[encontrado];
            if(replicas && replicas.length > 0){
                // Encontrar a primeira réplica que ainda não foi concluída
                const proximaReplica = replicas.find(r => {
                    const fullText = r.nome.toUpperCase() + " (RÉPLICA DE " + encontrado.toUpperCase() + ")";
                    return !replicasConcluidasAtual.includes(fullText);
                });
                if(proximaReplica){
                    document.getElementById("oradorAtual")
                    .innerHTML = proximaReplica.nome.toUpperCase() + "<br><small>RÉPLICA DE " + encontrado.toUpperCase() + "</small>";
                    document.getElementById("oradorAtual")
                    .setAttribute("data-fulltext", proximaReplica.nome.toUpperCase() + " (RÉPLICA DE " + encontrado.toUpperCase() + ")");

                    tempoInicial = proximaReplica.tempo;
                    tempoRestante = proximaReplica.tempo;

                    atualizarCronometro();
                    atualizarFilaConsideracoes();
                    atualizarListaEncerrados();

                    salvarEstadoTelao();
                    return;
                }
            }

            // Sem réplicas, apenas pausar
            atualizarListaEncerrados();
            salvarEstadoTelao();
            document.getElementById("oradorAtual").textContent = "AGUARDANDO INÍCIO";
            document.getElementById("oradorAtual").removeAttribute("data-fulltext");
            oradorAtualConsideracoes = "";
            oradorTribunaLivre = null;
            return;
        } else {
            adicionarAoHistorico(oradorAtual, false);
        }

        atualizarListaEncerrados();
        atualizarHistoricoOradores();
    }

    document
    .getElementById("oradorAtual")
    .textContent =
    "AGUARDANDO INÍCIO";
    document
    .getElementById("oradorAtual")
    .removeAttribute("data-fulltext");

    oradorAtualConsideracoes = "";
    oradorTribunaLivre = null;

    salvarEstadoTelao();

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

const btnRetornar = document.getElementById("btnRetornar");

btnRetornar.addEventListener(
    "click",
    ()=>{

        if(
            modoSessao ===
            "consideracoes"
        ){

            retornarOradorAnterior();

        }

    }
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
        document
        .getElementById("oradorAtual")
        .textContent.trim() ===
        nome.toUpperCase()
    ){
        return;
    }

    filaConsideracoes.push(
        nome
    );

    atualizarFilaConsideracoes();

}

function selecionarOradorDaFila(nome){
    pausarCronometro();

    oradorAtualConsideracoes = nome;

    document.getElementById("oradorAtual").textContent = nome.toUpperCase();
    document.getElementById("oradorAtual").removeAttribute("data-fulltext");

    tempoInicial = 300;
    tempoRestante = 300;

    atualizarCronometro();
    atualizarFilaConsideracoes();
    salvarEstadoTelao();
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

    const currentSpeaker = obterTextoOradorAtual();

    const isSpeaking =
    currentSpeaker !== "AGUARDANDO INÍCIO";

    // Calcular o próximo orador considerando réplicas pendentes
    let proximoTexto = "Próximo Orador: ---";

    if(isSpeaking){
        // Verificar se o orador atual é uma réplica
        const replicaMatch = currentSpeaker.match(/^(.+)\s*\(RÉPLICA DE\s*(.+)\)$/i);

        if(replicaMatch){
            // Orador atual é uma réplica - verificar se há mais réplicas para o mesmo orador
            const oradorOriginal = replicaMatch[2];
            const chaveReplicas = buscarChaveReplicas(oradorOriginal);
            const replicas = chaveReplicas ? replicasPorOrador[chaveReplicas] : null;

            let encontrouProximaReplica = false;
            if(replicas && replicas.length > 0){
                const proximaReplica = replicas.find(r => {
                    const fullText = r.nome.toUpperCase() + " (RÉPLICA DE " + oradorOriginal.toUpperCase() + ")";
                    // Excluir a réplica que está falando agora (não está concluída mas é a atual)
                    return !replicasConcluidasAtual.includes(fullText) && fullText !== currentSpeaker;
                });
                if(proximaReplica){
                    proximoTexto = "Próximo: " + proximaReplica.nome + " (Réplica)";
                    encontrouProximaReplica = true;
                }
            }

            // Se não há mais réplicas, mostrar o próximo orador principal
            if(!encontrouProximaReplica){
                const nextIndex = 1;
                proximoTexto = filaConsideracoes.length > nextIndex
                    ? "Próximo Orador: " + filaConsideracoes[nextIndex]
                    : "Próximo Orador: ---";
            }
        } else {
            // Orador atual é um orador principal - verificar se tem réplicas pendentes
            const chaveReplicas = buscarChaveReplicas(currentSpeaker);
            const replicas = chaveReplicas ? replicasPorOrador[chaveReplicas] : null;

            let encontrouProximaReplica = false;
            if(replicas && replicas.length > 0){
                const proximaReplica = replicas.find(r => {
                    const fullText = r.nome.toUpperCase() + " (RÉPLICA DE " + currentSpeaker.toUpperCase() + ")";
                    return !replicasConcluidasAtual.includes(fullText);
                });
                if(proximaReplica){
                    proximoTexto = "Próximo: " + proximaReplica.nome + " (Réplica)";
                    encontrouProximaReplica = true;
                }
            }

            // Se não há réplicas, mostrar o próximo orador principal
            if(!encontrouProximaReplica){
                const nextIndex = 1;
                proximoTexto = filaConsideracoes.length > nextIndex
                    ? "Próximo Orador: " + filaConsideracoes[nextIndex]
                    : "Próximo Orador: ---";
            }
        }
    } else {
        // Ninguém falando - próximo é o primeiro da fila
        proximoTexto = filaConsideracoes.length > 0
            ? "Próximo Orador: " + filaConsideracoes[0]
            : "Próximo Orador: ---";
    }

    document
    .getElementById(
        "proximoOrador"
    )
    .textContent =
    proximoTexto;

    filaConsideracoes.forEach(
        (nome,index)=>{

        const container = document.createElement("div");
        container.className = "itemFilaContainer";

        const item =
        document.createElement(
            "div"
        );

        item.className =
        "itemFila";

        // Destacar se este nome é o orador atual
        const isCurrentSpeaker = (currentSpeaker === nome.toUpperCase());
        if(isCurrentSpeaker){
            item.style.borderLeft = "4px solid #4caf50";
            item.style.background = "#e8f5e9";
        }

        item.innerHTML = `

            <span
                class="nomeOradorClicavel"
                onclick="selecionarOradorDaFila('${nome}')"
                title="Clique para selecionar ${nome}"
                style="cursor:pointer;${isCurrentSpeaker?'font-weight:bold;':''}">

                ${index+1}º
                ${nome}

            </span>

            <div class="botoesDireita">

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

                repItem.innerHTML = `
                    <span>
                        ${replica.nome}
                        <br>
                        <small>${formatarTempo(replica.tempo)}</small>
                    </span>
                    <div class="botoesDireita">
                        <div class="setasContainer">
                            <button onclick="subirReplica('${nome}', ${repIndex})">▲</button>
                            <button onclick="descerReplica('${nome}', ${repIndex})">▼</button>
                        </div>
                        <button onclick="iniciarReplica('${nome}', ${repIndex})" class="btnIniciarReplica">▶</button>
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

    // Salvar estado atual para permitir "Retornar"
    salvarEstadoParaRetorno();

    if(
        filaConsideracoes.length === 0
    ){
        return;
    }

    const currentSpeaker = obterTextoOradorAtual();

    // Se ninguém está falando, iniciar o primeiro (sem remover)
    if(currentSpeaker === "AGUARDANDO INÍCIO"){

        // Novo orador principal - limpar réplicas concluídas do ciclo anterior
        replicasConcluidasAtual = [];

        const nome = filaConsideracoes[0];

        oradorAtualConsideracoes =
        nome;

        document
        .getElementById("oradorAtual")
        .textContent =
        nome.toUpperCase();

        tempoInicial = 300;
        tempoRestante = 300;

        pausarCronometro();
        atualizarCronometro();
        atualizarFilaConsideracoes();

        setTimeout(() => {
            salvarEstadoTelao();
        }, 100);

        return;
    }

    // Verificar se o orador atual é uma réplica
    const replicaMatch = currentSpeaker.match(/^(.+)\s*\(RÉPLICA DE\s*(.+)\)$/i);

    if(replicaMatch){
        // Orador atual é uma réplica

    if(!replicasConcluidasAtual.includes(currentSpeaker)){
            // Registrar réplica como concluída
            replicasConcluidasAtual.push(currentSpeaker);
        }

        const oradorOriginal = replicaMatch[2];

        // Verificar se há mais réplicas para este orador
        const chaveReplicasEnc = buscarChaveReplicas(oradorOriginal);
        const replicas = chaveReplicasEnc ? replicasPorOrador[chaveReplicasEnc] : null;
        if(replicas && replicas.length > 0){
            // Encontrar a próxima réplica que ainda não foi concluída
            const proximaReplica = replicas.find(r => {
                const fullText = r.nome.toUpperCase() + " (RÉPLICA DE " + oradorOriginal.toUpperCase() + ")";
                return !replicasConcluidasAtual.includes(fullText);
            });
            if(proximaReplica){
                document.getElementById("oradorAtual")
                .innerHTML = proximaReplica.nome.toUpperCase() + "<br><small>RÉPLICA DE " + oradorOriginal.toUpperCase() + "</small>";
                document.getElementById("oradorAtual")
                .setAttribute("data-fulltext", proximaReplica.nome.toUpperCase() + " (RÉPLICA DE " + oradorOriginal.toUpperCase() + ")");

                tempoInicial = proximaReplica.tempo;
                tempoRestante = proximaReplica.tempo;

                pausarCronometro();
                atualizarCronometro();
                atualizarFilaConsideracoes();
                atualizarListaEncerrados();

                setTimeout(() => {
                    salvarEstadoTelao();
                }, 100);
                return;
            }
        }

        // Sem mais réplicas, avançar para o próximo orador principal
        // (cai no fluxo normal abaixo)
    }

    // Verificar se o orador atual (principal) tem réplicas pendentes
    const oradorAtualNome = currentSpeaker;
    const chaveReplicasPending = buscarChaveReplicas(oradorAtualNome);
    const replicasPending = chaveReplicasPending ? replicasPorOrador[chaveReplicasPending] : null;

        if(replicasPending && replicasPending.length > 0){
        // Encontrar a primeira réplica que ainda não foi concluída
        const proximaReplica = replicasPending.find(r => {
            const fullText = r.nome.toUpperCase() + " (RÉPLICA DE " + oradorAtualNome.toUpperCase() + ")";
            // Excluir a réplica que está falando agora (não está concluída mas é a atual)
            return !replicasConcluidasAtual.includes(fullText) && fullText !== currentSpeaker;
        });
        if(proximaReplica){
            document.getElementById("oradorAtual")
            .innerHTML = proximaReplica.nome.toUpperCase() + "<br><small>RÉPLICA DE " + oradorAtualNome.toUpperCase() + "</small>";
            document.getElementById("oradorAtual")
            .setAttribute("data-fulltext", proximaReplica.nome.toUpperCase() + " (RÉPLICA DE " + oradorAtualNome.toUpperCase() + ")");

            tempoInicial = proximaReplica.tempo;
            tempoRestante = proximaReplica.tempo;

            pausarCronometro();
            atualizarCronometro();
            atualizarFilaConsideracoes();
            atualizarListaEncerrados();

            setTimeout(() => {
                salvarEstadoTelao();
            }, 100);
            return;
        }
    }

    // Avançar para o próximo orador principal
    const oradorPrincipal = filaConsideracoes[0];

    // Adicionar orador principal ao histórico
    if(oradorPrincipal && !oradoresEncerrados.includes(oradorPrincipal)){
        oradoresEncerrados.push(oradorPrincipal);
    }
    if(oradorPrincipal){
        adicionarAoHistorico(oradorPrincipal, false);
    }

    // Adicionar réplicas concluídas ao histórico (diretamente ao orador principal correto)
    const entryPrincipal = historicoOradores.find(entry => typeof entry === 'object' && entry.nome === oradorPrincipal);
    if(entryPrincipal){
        replicasConcluidasAtual.forEach(replicaNome => {
            if(!entryPrincipal.replicas.includes(replicaNome)){
                entryPrincipal.replicas.push(replicaNome);
            }
        });
    }
    replicasConcluidasAtual = [];

    // Limpar réplicas pendentes deste orador
    const chaveReplicas = buscarChaveReplicas(oradorPrincipal);
    if(chaveReplicas){
        delete replicasPorOrador[chaveReplicas];
    }

    atualizarListaEncerrados();
    atualizarHistoricoOradores();

    // Remove o orador atual (primeiro da fila)
    filaConsideracoes.shift();

    if(
        filaConsideracoes.length === 0
    ){
        // Não há mais oradores
        oradorAtualConsideracoes = "";
        document
        .getElementById("oradorAtual")
        .textContent =
        "AGUARDANDO INÍCIO";

        pausarCronometro();
        tempoInicial = 300;
        tempoRestante = 300;
        atualizarCronometro();
        atualizarFilaConsideracoes();
        return;
    }

    // Define o próximo da fila como orador (sem remover)
    const nome = filaConsideracoes[0];

    oradorAtualConsideracoes =
    nome;

    document
    .getElementById("oradorAtual")
    .textContent =
    nome.toUpperCase();

    tempoInicial = 300;
    tempoRestante = 300;

    pausarCronometro();
    atualizarCronometro();

    atualizarFilaConsideracoes();

    // Forçar sincronização do telão
    setTimeout(() => {
        salvarEstadoTelao();
    }, 100);

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

    // Pausar o cronômetro atual e configurar para a réplica
    pausarCronometro();

    document.getElementById("oradorAtual")
    .innerHTML = replica.nome.toUpperCase() + "<br><small>RÉPLICA DE " + nomeOriginal.toUpperCase() + "</small>";
    document.getElementById("oradorAtual")
    .setAttribute("data-fulltext", replica.nome.toUpperCase() + " (RÉPLICA DE " + nomeOriginal.toUpperCase() + ")");

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
            item.className = "itemReplica";

            item.innerHTML = `
                <span>
                    ${replica.nome}
                    <br>
                    <small>${formatarTempo(replica.tempo)}</small>
                </span>
                <div class="botoesDireita">
                    <div class="setasContainer">
                        <button onclick="subirReplica('${nomeOriginal}', ${index})">▲</button>
                        <button onclick="descerReplica('${nomeOriginal}', ${index})">▼</button>
                    </div>
                    <button onclick="iniciarReplica('${nomeOriginal}', ${index})" class="btnIniciarReplica">▶</button>
                </div>
            `;

            oradorDiv.appendChild(item);
        });

        div.appendChild(oradorDiv);
    });
}