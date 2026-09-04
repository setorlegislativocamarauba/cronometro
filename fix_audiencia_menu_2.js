import fs from 'fs';
let code = fs.readFileSync('controle.js', 'utf8');

const correctFunc = `
function abrirMenuTempoAudiencia(event, index){
    event.stopPropagation();
    
    const orador = filaAudienciaOradores[index];
    if(!orador) return;

    const botao = event.currentTarget;
    const menuExistente = menuTempoExtraAberto;
    fecharMenuTempoExtra();

    if(menuExistente && menuExistente.dataset.alvo === "aud_" + index){
        return;
    }

    const menu = document.createElement("div");
    menu.className = "tempoExtraMenuFlutuante";
    menu.dataset.alvo = "aud_" + index;

    opcoesTempoConvidado.forEach(opcao => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "tempoExtraOpcao";
        item.textContent = opcao.label;
        item.onclick = function(e){
            e.stopPropagation();
            adicionarTempoOradorAudiencia(index, opcao.segundos);
            fecharMenuTempoExtra();
        };
        menu.appendChild(item);
    });

    document.body.appendChild(menu);

    // Força o layout para obter altura real
    void menu.offsetHeight;
    const menuRect = menu.getBoundingClientRect();
    const botaoRect = botao.getBoundingClientRect();
    const menuHeight = menuRect.height;
    const menuWidth = 150; 
    const windowHeight = window.innerHeight;

    let top = botaoRect.bottom + 5;
    let left = botaoRect.left + (botaoRect.width / 2) - (menuWidth / 2);

    if (top + menuHeight > windowHeight) {
        top = botaoRect.top - menuHeight - 5;
    }

    if (top < 0) {
        top = 5;
    }

    menu.style.top = top + "px";
    menu.style.left = left + "px";
    menuTempoExtraAberto = menu;
}
`;

const regex = /function abrirMenuTempoAudiencia\(event, index\)\{[\s\S]*?abrirMenuTempoExtra\(event, 'audiencia', orador.nome, true, null\);\n\}/m;

code = code.replace(regex, correctFunc.trim());

// We also need to update the data-alvo in atualizarFilaAudiencia to use "aud_" 
code = code.replace(/data-alvo="conv_\$\{index\}"\s+onclick="abrirMenuTempoAudiencia/g, 'data-alvo="aud_${index}"\n                        onclick="abrirMenuTempoAudiencia');

fs.writeFileSync('controle.js', code);
