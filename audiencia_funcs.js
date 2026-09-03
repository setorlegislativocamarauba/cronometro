function carregarAudiencia(){

    

    painelEsquerdo.innerHTML = `

        
        <h2 style="text-align:center; margin-bottom: 5px;">
            Configuração do Evento
        </h2>
        
        <div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:10px 0;">
            <div style="display: flex; gap: 15px;">
                <label><input type="radio" name="tipoEventoAudiencia" value="Audiência Pública" checked> Audiência Pública</label>
                <label><input type="radio" name="tipoEventoAudiencia" value="Seminário"> Seminário</label>
            </div>
            <input
            id="temaAudienciaInput"
            placeholder="Ex: Resíduos Sólidos"
            style="width:100%;max-width:300px;">

            <button
            id="btnDefinirTemaAudiencia"
            class="botaoVereador"
            style="width:100%;max-width:300px;background:#10b981;color:white;font-size:14px;">
                Inserir Tema
            </button>
        </div>

        <hr style="margin:15px 0;">

        <h2 style="text-align:center;">
            Inserir Orador
        </h2>


        <div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:10px 0;">
            <input
            id="nomeAudienciaExterno"
            placeholder="Nome do(a) Orador(a)"
            style="width:100%;max-width:300px;">

            <button
            id="btnAdicionarAudiencia"
            class="botaoVereador"
            style="width:100%;max-width:300px;background:#2b7cd3;color:white;font-size:14px;">

                Adicionar Orador

            </button>
        </div>

        <hr style="margin:15px 0;">

        <h2 style="text-align:center;">
            Vereadores
        </h2>

        <div id="listaVereadoresAudiencia"></div>

        <hr style="margin:15px 0;">

        <h2 style="text-align:center;">
            Histórico
        </h2>

        <div id="historicoAudiencia"></div>

    `;

    painelCentro.innerHTML = `

        <h2>
            Fila de Oradores
        </h2>

        <div id="filaAudienciaOradores"></div>

    `;

    painelEsquerdo.innerHTML = `

        <h2 style="text-align:center;">
            Inserir Orador
        </h2>

        <div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:10px 0;">
            <input
            id="nomeAudienciaExterno"
            placeholder="Nome do(a) Orador(a)"
            style="width:100%;max-width:300px;">

            <button
            id="btnAdicionarAudiencia"
            class="botaoVereador"
            style="width:100%;max-width:300px;background:#2b7cd3;color:white;font-size:14px;">

                Adicionar Orador

            </button>
        </div>

        <hr style="margin:15px 0;">

        <h2 style="text-align:center;">
            Vereadores
        </h2>

        <div id="listaVereadoresAudiencia"></div>

    `;

    // Renderizar lista de vereadores
    const listaVereadores = document.getElementById("listaVereadoresAudiencia");
    vereadores.forEach(nome => {
        const btn = document.createElement("button");
        btn.className = "botaoVereador";
        btn.textContent = nome;
        btn.onclick = function(){
            adicionarOradorAudiencia("vereador", nome);
        };
        listaVereadores.appendChild(btn);
    });

    
    // Lógica para o Tema
    document.getElementById("btnDefinirTemaAudiencia").addEventListener("click", function(){
        const input = document.getElementById("temaAudienciaInput");
        const tipoEvento = document.querySelector('input[name="tipoEventoAudiencia"]:checked').value;
        const tema = input.value.trim();
        
        let tituloStr = tipoEvento.toUpperCase();
        if(tema !== ""){
            tituloStr += ": " + tema.toUpperCase();
        }
        
        tituloSessao.textContent = tituloStr;
        salvarEstadoTelao();
    });

    // Adicionar listener para o botão de audiencia externo

    document.getElementById("btnAdicionarAudiencia").addEventListener("click", function(){
        const input = document.getElementById("nomeAudienciaExterno");
        const nome = input.value.trim();
        if(nome === ""){
            alert("Por favor, insira o nome do audiencia");
            return;
        }
        adicionarOradorAudiencia("audiencia", nome);
        input.value = "";
    });

    // Pausar cronômetro e limpar orador atual
    

    atualizarFilaAudiencia();
}

function adicionarOradorAudiencia(tipo, nome){
    // Verificar se já está na fila
    const jaNaFila = filaAudienciaOradores.some(o => o.nome.toUpperCase() === nome.toUpperCase());
    if(jaNaFila){
        return;
    }

    // Verificar se já está falando
    if(speakerAtual.tipo !== "none" && speakerAtual.nome.toUpperCase() === nome.toUpperCase()){
        return;
    }

    // Tempo inicial é 0 - o operador define o tempo antes de iniciar
    filaAudienciaOradores.push({
        tipo: tipo,
        nome: nome,
        tempo: 0
    });

    // Se for audiencia, adicionar à lista de audiencia adicionados
    if(tipo === "audiencia" && !audienciaAdicionados.includes(nome)){
        audienciaAdicionados.push(nome);
    }

    atualizarFilaAudiencia();
    salvarEstadoTelao();
}

function removerOradorAudiencia(index){
    filaAudienciaOradores.splice(index, 1);
    atualizarFilaAudiencia();
    salvarEstadoTelao();
}

function subirOradorAudiencia(index){
    if(index === 0) return;
    [filaAudienciaOradores[index - 1], filaAudienciaOradores[index]] = [filaAudienciaOradores[index], filaAudienciaOradores[index - 1]];
    atualizarFilaAudiencia();
}

function descerOradorAudiencia(index){
    if(index >= filaAudienciaOradores.length - 1) return;
    [filaAudienciaOradores[index + 1], filaAudienciaOradores[index]] = [filaAudienciaOradores[index], filaAudienciaOradores[index + 1]];
    atualizarFilaAudiencia();
}

function iniciarOradorAudiencia(index){
    const orador = filaAudienciaOradores[index];
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
        atualizarFilaAudiencia();
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

    atualizarFilaAudiencia();
    salvarEstadoTelao();
}

function pausarOradorAudiencia(index){
    const orador = filaAudienciaOradores[index];
    if(!orador) return;

    if(!speakerAtualEhAlvo("orador", orador.nome, null, null)){
        return;
    }

    pausarCronometro();
    atualizarFilaAudiencia();
    salvarEstadoTelao();
}

function adicionarTempoOradorAudiencia(index, segundos){
    const orador = filaAudienciaOradores[index];
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

    atualizarFilaAudiencia();
    salvarEstadoTelao();
}

function encerrarOradorAudiencia(index){
    const orador = filaAudienciaOradores[index];
    if(!orador) return;

    if(!speakerAtualEhAlvo("orador", orador.nome, null, null)){
        return;
    }

    pausarCronometro();

    // Remover da fila
    filaAudienciaOradores.splice(index, 1);

    definirOradorAtual("none");
    tempoInicial = 300;
    tempoRestante = 300;
    atualizarCronometro();
    atualizarFilaAudiencia();
    salvarEstadoTelao();
}

function atualizarFilaAudiencia(){
    const div = document.getElementById("filaAudienciaOradores");
    if(!div) return;

    div.innerHTML = "";

    if(filaAudienciaOradores.length === 0){
        div.innerHTML = "<div style='color:#888;padding:8px;text-align:center;font-size:13px;'>Nenhum orador na fila</div>";
        return;
    }

    filaAudienciaOradores.forEach((orador, index) => {
        const container = document.createElement("div");
        container.className = "itemFilaContainer";
        
        configurarDragAndDrop(container, index, filaAudienciaOradores, atualizarFilaAudiencia, 'audiencia');

        const item = document.createElement("div");
        const itemAtivo = speakerAtualEhAlvo("orador", orador.nome, null, null);

        item.className = "itemFila" + (itemAtivo ? " emUso" : "");

        const tipoLabel = orador.tipo === "audiencia" ? "Audiencia" : "Vereador";

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
                    onclick="event.stopPropagation(); iniciarOradorAudiencia(${index})">
                        Iniciar
                    </button>

                    <button
                    class="btnControleFila btnPausarFila"
                    ${itemAtivo ? "" : "disabled"}
                    onclick="event.stopPropagation(); pausarOradorAudiencia(${index})">
                        Pausar
                    </button>

                    <div class="tempoExtraDropdown">
                        <button
                        class="btnControleFila btnTempoExtraFila"
                        data-alvo="conv_${index}"
                        onclick="abrirMenuTempoAudiencia(event, ${index})">
                            Tempo
                        </button>
                    </div>
                </div>

                <div class="setasContainer">
                    <button onclick="subirOradorAudiencia(${index})">▲</button>
                    <button onclick="descerOradorAudiencia(${index})">▼</button>
                </div>

                <button class="btnMais"
                style="background:#d32f2f;"
                onclick="removerOradorAudiencia(${index})"
                title="Remover da fila">
                    ✕
                </button>

            </div>

        `;

        container.appendChild(item);
        div.appendChild(container);
    });
}

function atualizarHistoricoAudiencia(){
    const div = document.getElementById("historicoAudiencia");
    if(!div) return;

    div.innerHTML = "";

    if(historicoAudiencia.length === 0){
        div.innerHTML = "<div style='color:#888;padding:8px;text-align:center;font-size:13px;'>Nenhum orador registrado</div>";
        return;
    }

    historicoAudiencia.slice().reverse().forEach(nome => {
        const item = document.createElement("div");
        item.className = "botaoVereador";
        item.textContent = nome;
        div.appendChild(item);
    });
}

