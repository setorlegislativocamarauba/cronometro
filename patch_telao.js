import fs from 'fs';

let html = fs.readFileSync('telao.html', 'utf8');

// The replacement logic
const oldScript = `setInterval(()=>{
    
    try{
        const dados = JSON.parse(localStorage.getItem('estadoCronometro') || '{}');
        const modo = dados.modoSessao || 'consideracoes';
        const opacidade = localStorage.getItem('opacidadeBrasao') || '0.5';
        document.body.style.setProperty('--brasao-opacity', opacidade);
        
        document.getElementById('tituloSessaoTelao').textContent = dados.tituloSessao || 'CONSIDERAÇÕES FINAIS';
        
        // Mostrar/esconder conteúdo da Tela Simples
        const normalContent = document.getElementById('conteudoNormalTelao');
        const simpleContent = document.getElementById('conteudoSimplesTelao');
        const bodyEl = document.body;
        
        if(modo === 'tela_simples'){
            normalContent.style.display = 'none';
            simpleContent.style.display = 'flex';
            bodyEl.classList.add('tela-simples-mode');
            document.getElementById('tituloSessaoTelao').style.display = 'none';
        } else {
            normalContent.style.display = 'flex';
            simpleContent.style.display = 'none';
            bodyEl.classList.remove('tela-simples-mode');
            document.getElementById('tituloSessaoTelao').style.display = '';
        }
        
        const isModoSimples = dados.modoSessao === 'condolencias' || dados.modoSessao === 'pausa';
        
        // Para Condolências e Pausa, esconder "USANDO A PALAVRA" e "AGUARDANDO INÍCIO"
        const statusEl = document.getElementById('statusTelao');
        const oradorAtualEl = document.getElementById('oradorAtualTelao');
        
        if(isModoSimples){
            statusEl.style.display = 'none';
            oradorAtualEl.style.display = 'none';
        } else {
            statusEl.style.display = '';
            oradorAtualEl.style.display = '';
            const oradorTexto = dados.oradorAtual || 'AGUARDANDO INÍCIO';
            const replicaMatch = oradorTexto.match(/^(.+)\\s*\\(RÉPLICA DE\\s*(.+)\\)$/i);
            if(replicaMatch){
                oradorAtualEl.innerHTML = replicaMatch[1] + '<span class="replica-subtitle">RÉPLICA DE ' + replicaMatch[2] + '</span>';
            } else {
                oradorAtualEl.textContent = oradorTexto;
            }
        }
        
        const corOrador = localStorage.getItem('corNomeOrador') || '#fff';
        oradorAtualEl.style.color = corOrador;

        const cronEl = document.getElementById('cronometroTelao');
        // Se o cronômetro estiver oculto no operador, ocultar também no telão
        if(dados.cronometroOculto){
            cronEl.style.display = 'none';
        } else {
            cronEl.style.display = '';
            cronEl.textContent = dados.cronometro || '05:00';
            const partes = cronEl.textContent.split(':');
            const segundos = parseInt(partes[0]) * 60 + parseInt(partes[1]);

            if(segundos <= 10 && segundos > 0){
                cronEl.classList.add('cronometroPiscando');
            }else{
                cronEl.classList.remove('cronometroPiscando');
            }
            // Cor do cronômetro branca por padrão, muda conforme o tempo
            // O controle.js já envia a cor correta via dados.cronometroCor
            cronEl.style.color = dados.cronometroCor || '#fff';
        }
        
        const proximoEl = document.getElementById('proximoOradorTelao');
        if(dados.modoSessao === 'consideracoes'){
            proximoEl.style.display = '';
            proximoEl.textContent = dados.proximoOrador || 'Próximo Orador: ---';
        } else {
            proximoEl.style.display = 'none';
        }
        
        // O modo convidados mostra o botão "Iniciar" e "Pausar" normalmente sem "Próximo Orador"
        
    } catch(e){
        console.log('Erro ao sincronizar:', e);
    }
    
}, 500);`;

const newScript = `function atualizarTelao() {
    try{
        const dados = JSON.parse(localStorage.getItem('estadoCronometro') || '{}');
        const modo = dados.modoSessao || 'consideracoes';
        const opacidade = localStorage.getItem('opacidadeBrasao') || '0.5';
        document.body.style.setProperty('--brasao-opacity', opacidade);
        
        document.getElementById('tituloSessaoTelao').textContent = dados.tituloSessao || 'CONSIDERAÇÕES FINAIS';
        
        // Mostrar/esconder conteúdo da Tela Simples
        const normalContent = document.getElementById('conteudoNormalTelao');
        const simpleContent = document.getElementById('conteudoSimplesTelao');
        const bodyEl = document.body;
        
        if(modo === 'tela_simples'){
            normalContent.style.display = 'none';
            simpleContent.style.display = 'flex';
            bodyEl.classList.add('tela-simples-mode');
            document.getElementById('tituloSessaoTelao').style.display = 'none';
        } else {
            normalContent.style.display = 'flex';
            simpleContent.style.display = 'none';
            bodyEl.classList.remove('tela-simples-mode');
            document.getElementById('tituloSessaoTelao').style.display = '';
        }
        
        const isModoSimples = dados.modoSessao === 'condolencias' || dados.modoSessao === 'pausa';
        
        // Para Condolências e Pausa, esconder "USANDO A PALAVRA" e "AGUARDANDO INÍCIO"
        const statusEl = document.getElementById('statusTelao');
        const oradorAtualEl = document.getElementById('oradorAtualTelao');
        
        if(isModoSimples){
            statusEl.style.display = 'none';
            oradorAtualEl.style.display = 'none';
        } else {
            statusEl.style.display = '';
            oradorAtualEl.style.display = '';
            const oradorTexto = dados.oradorAtual || 'AGUARDANDO INÍCIO';
            const replicaMatch = oradorTexto.match(/^(.+)\\s*\\(RÉPLICA DE\\s*(.+)\\)$/i);
            if(replicaMatch){
                oradorAtualEl.innerHTML = replicaMatch[1] + '<span class="replica-subtitle">RÉPLICA DE ' + replicaMatch[2] + '</span>';
            } else {
                oradorAtualEl.textContent = oradorTexto;
            }
        }
        
        const corOrador = localStorage.getItem('corNomeOrador') || '#fff';
        oradorAtualEl.style.color = corOrador;

        const cronEl = document.getElementById('cronometroTelao');
        // Se o cronômetro estiver oculto no operador, ocultar também no telão
        if(dados.cronometroOculto){
            cronEl.style.display = 'none';
        } else {
            cronEl.style.display = '';
            cronEl.textContent = dados.cronometro || '05:00';
            const partes = cronEl.textContent.split(':');
            const segundos = parseInt(partes[0]) * 60 + parseInt(partes[1]);

            if(segundos <= 10 && segundos > 0){
                cronEl.classList.add('cronometroPiscando');
            }else{
                cronEl.classList.remove('cronometroPiscando');
            }
            
            const baseTimerColor = localStorage.getItem('corCronometro') || '#fff';
            cronEl.style.color = dados.cronometroCor || baseTimerColor;
        }
        
        const proximoEl = document.getElementById('proximoOradorTelao');
        if(dados.modoSessao === 'consideracoes'){
            proximoEl.style.display = '';
            proximoEl.textContent = dados.proximoOrador || 'Próximo Orador: ---';
        } else {
            proximoEl.style.display = 'none';
        }
        
    } catch(e){
        console.log('Erro ao sincronizar:', e);
    }
}

// Inicia na primeira carga
atualizarTelao();

// Atualiza instantaneamente sempre que houver mudanças
window.addEventListener('storage', atualizarTelao);`;

html = html.replace(oldScript, newScript);
fs.writeFileSync('telao.html', html);
