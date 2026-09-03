function carregarConvidados(){

    

    painelEsquerdo.innerHTML = `

        <h2 style="text-align:center;">
            Inserir Convidado/Convocado
        </h2>

        <div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:10px 0;">
            <input
            id="nomeConvidadoExterno"
            placeholder="Nome do(a) Convidado(a)"
            style="width:100%;max-width:300px;">

            <button
            id="btnAdicionarConvidado"
            class="botaoVereador"
            style="width:100%;max-width:300px;background:#2b7cd3;color:white;font-size:14px;">

                Adicionar Convidado/Convocado

            </button>
        </div>

        <hr style="margin:15px 0;">

        <h2 style="text-align:center;">
            Vereadores
        </h2>

        <div id="listaVereadoresConvidados"></div>

        <hr style="margin:15px 0;">

        <h2 style="text-align:center;">
            Histórico
        </h2>

        <div id="historicoConvidados"></div>

    `;

    painelCentro.innerHTML = `

        <h2>
            Fila de Oradores
        </h2>

        <div id="filaConvidadosOradores"></div>

    `;

    painelEsquerdo.innerHTML = `

        <h2 style="text-align:center;">
            Inserir Convidado/Convocado
        </h2>

        <div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:10px 0;">
            <input
            id="nomeConvidadoExterno"
            placeholder="Nome do(a) Convidado(a)"
            style="width:100%;max-width:300px;">

            <button
            id="btnAdicionarConvidado"
            class="botaoVereador"
            style="width:100%;max-width:300px;background:#2b7cd3;color:white;font-size:14px;">

                Adicionar Convidado/Convocado

            </button>
        </div>

        <hr style="margin:15px 0;">

        <h2 style="text-align:center;">
            Vereadores
        </h2>

        <div id="listaVereadoresConvidados"></div>

    `;

    // Renderizar lista de vereadores
    const listaVereadores = document.getElementById("listaVereadoresConvidados");
    vereadores.forEach(nome => {
        const btn = document.createElement("button");
        btn.className = "botaoVereador";
        btn.textContent = nome;
        btn.onclick = function(){
            adicionarOradorConvidados("vereador", nome);
        };
        listaVereadores.appendChild(btn);
    });

    // Adicionar listener para o botão de convidado externo
    document.getElementById("btnAdicionarConvidado").addEventListener("click", function(){
        const input = document.getElementById("nomeConvidadoExterno");
        const nome = input.value.trim();
        if(nome === ""){
            alert("Por favor, insira o nome do convidado");
            return;
        }
        adicionarOradorConvidados("convidado", nome);
        input.value = "";
    });

    // Pausar cronômetro e limpar orador atual
    

    atualizarFilaConvidados();
}

function adicionarOradorConvidados(tipo, nome){
    // Verificar se já está na fila
    const jaNaFila = filaConvidadosOradores.some(o => o.nome.toUpperCase() === nome.toUpperCase());
    if(jaNaFila){
        return;
    }

    // Verificar se já está falando
    if(speakerAtual.tipo !== "none" && speakerAtual.nome.toUpperCase() === nome.toUpperCase()){
        return;
    }

    // Tempo inicial é 0 - o operador define o tempo antes de iniciar
    filaConvidadosOradores.push({
        tipo: tipo,
        nome: nome,
        tempo: 0
    });

    // Se for convidado, adicionar à lista de convidados adicionados
    if(tipo === "convidado" && !convidadosAdicionados.includes(nome)){
        convidadosAdicionados.push(nome);
    }

    atualizarFilaConvidados();
    salvarEstadoTelao();
}

function removerOradorConvidados(index){
    filaConvidadosOradores.splice(index, 1);
    atualizarFilaConvidados();
    salvarEstadoTelao();
}

function subirOradorConvidados(index){
    if(index === 0) return;
    [filaConvidadosOradores[index - 1], filaConvidadosOradores[index]] = [filaConvidadosOradores[index], filaConvidadosOradores[index - 1]];
    atualizarFilaConvidados();
}

function descerOradorConvidados(index){
    if(index >= filaConvidadosOradores.length - 1) return;
    [filaConvidadosOradores[index + 1], filaConvidadosOradores[index]] = [filaConvidadosOradores[index], filaConvidadosOradores[index + 1]];
    atualizarFilaConvidados();
}

function iniciarOradorConvidados(index){
    const orador = filaConvidadosOradores[index];
    if(!orador) return;

    if(speakerAtualEhAlvo("orador", orador.nome, null, null)){
        const cronEl = document.getElementById("cronometro");
        if(orador.tempo <= 0){
            cronEl.style.display = "none";
        } else {
            if(tempoRestante > 0){
                cronEl.style.display = "";
                ativarAudioContexto();
                iniciarCronometro();
            } else {
                cronEl.style.display = "none";
            }
        }
        atualizarFilaConvidados();
        salvarEstadoTelao();
        return;
    }

    pausarCronometro();

    definirOradorAtual("orador", orador.nome);

    tempoInicial = orador.tempo;
    tempoRestante = orador.tempo;

    // Se não há tempo definido, ocultar o cronômetro
    const cronEl = document.getElementById("cronometro");
    if(orador.tempo <= 0){
        cronEl.style.display = "none";
    } else {
        cronEl.style.display = "";
        atualizarCronometro();
        ativarAudioContexto();
        iniciarCronometro();
    }

    atualizarFilaConvidados();
    salvarEstadoTelao();
}

function pausarOradorConvidados(index){
    const orador = filaConvidadosOradores[index];
    if(!orador) return;

    if(!speakerAtualEhAlvo("orador", orador.nome, null, null)){
        return;
    }

    pausarCronometro();
    atualizarFilaConvidados();
    salvarEstadoTelao();
}

function adicionarTempoOradorConvidados(index, segundos){
    const orador = filaConvidadosOradores[index];
    if(!orador) return;

    // Define o tempo (não é extra - é o tempo total ofertado)
    orador.tempo = segundos;

    // Se o orador estiver falando, atualizar o cronômetro
    const cronEl = document.getElementById("cronometro");
    if(speakerAtualEhAlvo("orador", orador.nome, null, null)){
        if(segundos <= 0){
            cronEl.style.display = "none";
        } else {
            cronEl.style.display = "";
            tempoInicial = segundos;
            tempoRestante = segundos;
            atualizarCronometro();
        }
    }

    atualizarFilaConvidados();
    salvarEstadoTelao();
}

function encerrarOradorConvidados(index){
    const orador = filaConvidadosOradores[index];
    if(!orador) return;

    if(!speakerAtualEhAlvo("orador", orador.nome, null, null)){
        return;
    }

    pausarCronometro();

    // Remover da fila
    filaConvidadosOradores.splice(index, 1);

    definirOradorAtual("none");
    tempoInicial = 300;
    tempoRestante = 300;
    atualizarCronometro();
    atualizarFilaConvidados();
    salvarEstadoTelao();
}

function atualizarFilaConvidados(){
    const div = document.getElementById("filaConvidadosOradores");
    if(!div) return;

    div.innerHTML = "";

    if(filaConvidadosOradores.length === 0){
        div.innerHTML = "<div style='color:#888;padding:8px;text-align:center;font-size:13px;'>Nenhum orador na fila</div>";
        return;
    }

    filaConvidadosOradores.forEach((orador, index) => {
        const container = document.createElement("div");
        container.className = "itemFilaContainer";
        
        configurarDragAndDrop(container, index, filaConvidadosOradores, atualizarFilaConvidados, 'convidados');

        const item = document.createElement("div");
        const itemAtivo = speakerAtualEhAlvo("orador", orador.nome, null, null);

        item.className = "itemFila" + (itemAtivo ? " emUso" : "");

        const tipoLabel = orador.tipo === "convidado" ? "Convidado" : "Vereador";

        item.innerHTML = `

            <button
            class="nomeOradorBtn"
            onclick="event.stopPropagation();">

                ${index + 1}º
                ${orador.nome}
                <br>
                <small style="color:#888;font-size:10px;">${tipoLabel} · ${formatarTempo(orador.tempo)}</small>

            </button>

            <div class="botoesDireita">

                <div class="controlesFala">
                    <button
                    class="btnControleFila btnIniciarFila"
                    onclick="event.stopPropagation(); iniciarOradorConvidados(${index})">
                        Iniciar
                    </button>

                    <button
                    class="btnControleFila btnPausarFila"
                    ${itemAtivo ? "" : "disabled"}
                    onclick="event.stopPropagation(); pausarOradorConvidados(${index})">
                        Pausar
                    </button>

                    <div class="tempoExtraDropdown">
                        <button
                        class="btnControleFila btnTempoExtraFila"
                        data-alvo="conv_${index}"
                        onclick="abrirMenuTempoConvidado(event, ${index})">
                            Tempo
                        </button>
                    </div>
                </div>

                <div class="setasContainer">
                    <button onclick="subirOradorConvidados(${index})">▲</button>
                    <button onclick="descerOradorConvidados(${index})">▼</button>
                </div>

                <button class="btnMais"
                style="background:#d32f2f;"
                onclick="removerOradorConvidados(${index})"
                title="Remover da fila">
                    ✕
                </button>

            </div>

        `;

        container.appendChild(item);
        div.appendChild(container);
    });
}

function atualizarHistoricoConvidados(){
    const div = document.getElementById("historicoConvidados");
    if(!div) return;

    div.innerHTML = "";

    if(historicoConvidados.length === 0){
        div.innerHTML = "<div style='color:#888;padding:8px;text-align:center;font-size:13px;'>Nenhum orador registrado</div>";
        return;
    }

    historicoConvidados.slice().reverse().forEach(nome => {
        const item = document.createElement("div");
        item.className = "botaoVereador";
        item.textContent = nome;
        div.appendChild(item);
    });
}

