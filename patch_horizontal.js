import fs from 'fs';
let code = fs.readFileSync('controle.js', 'utf8');

code = code.replace(
    /tituloSessao\.textContent =\s*"TELA SIMPLES";/,
    'tituloSessao.textContent =\n        "TELÃO";'
);

const newButtonsLogic = `        // Container para os botões do Telão
        let containerBotoesTelao = document.getElementById("containerBotoesTelao");
        if(!containerBotoesTelao) {
            containerBotoesTelao = document.createElement("div");
            containerBotoesTelao.id = "containerBotoesTelao";
            containerBotoesTelao.style.cssText = "display: flex; gap: 15px; justify-content: center; margin-top: 25px;";
            
            const btnTelaoAntes = document.createElement("button");
            btnTelaoAntes.id = "btnTelaoAntes";
            btnTelaoAntes.innerHTML = '<img class="iconeBotao" src="icons/tela-simples.svg" alt=""> Telão - Antes da Sessão';
            btnTelaoAntes.style.cssText = "padding:12px 24px;background:#10b981;color:white;border:none;border-radius:4px;cursor:pointer;font-size:16px;font-weight:bold; display: flex; align-items: center; gap: 8px;";
            btnTelaoAntes.addEventListener("click", () => window.open("telao_antes.html", "telao_antes", "width=1280,height=720"));
            
            const btnTelaoSimples = document.createElement("button");
            btnTelaoSimples.id = "btnTelaoSimples";
            btnTelaoSimples.innerHTML = '<img class="iconeBotao" src="icons/tela-simples.svg" alt=""> Telão - Sessão Iniciada';
            btnTelaoSimples.style.cssText = "padding:12px 24px;background:#2b7cd3;color:white;border:none;border-radius:4px;cursor:pointer;font-size:16px;font-weight:bold; display: flex; align-items: center; gap: 8px;";
            btnTelaoSimples.addEventListener("click", abrirTelao);
            
            containerBotoesTelao.appendChild(btnTelaoAntes);
            containerBotoesTelao.appendChild(btnTelaoSimples);
            
            tituloSessao.parentNode.insertBefore(containerBotoesTelao, tituloSessao.nextSibling);
        }
        containerBotoesTelao.style.display = "flex";

    } else {
        // Remover botões da tela simples ao sair do modo
        const containerBotoesTelao = document.getElementById("containerBotoesTelao");
        if(containerBotoesTelao) {
            containerBotoesTelao.remove();
        }
        
        // Limpar possíveis botões residuais antigos
        const btnTelaoSimples = document.getElementById("btnTelaoSimples");
        if(btnTelaoSimples) btnTelaoSimples.remove();
        
        const btnTelaoAntes = document.getElementById("btnTelaoAntes");
        if(btnTelaoAntes) btnTelaoAntes.remove();
    }`;

const regexButtons = /\/\/ Adicionar botão Telão abaixo do título, centralizado[\s\S]*?\}\s*\}\s*$/m;

code = code.replace(/\/\/ Adicionar botão Telão abaixo do título, centralizado[\s\S]*?btnTelaoSimples\.remove\(\);\s*\}\s*\}/, newButtonsLogic);

fs.writeFileSync('controle.js', code);
