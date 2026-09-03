import fs from 'fs';
let code = fs.readFileSync('controle.js', 'utf8');

// Rename the "Telão" button in Tela Simples
code = code.replace(/btnTelaoSimples\.innerHTML = '<img class="iconeBotao" src="icons\/tela-simples\.svg" alt=""> Tel\\\\u00e3o';/, 'btnTelaoSimples.innerHTML = \'<img class="iconeBotao" src="icons/tela-simples.svg" alt=""> Tel\\\\u00e3o - Sess\\\\u00e3o Iniciada\';');

// Also inject the "Telão - Antes da Sessão" button
const btnAntes = `
        let btnTelaoAntes = document.getElementById("btnTelaoAntes");
        if(!btnTelaoAntes){
            btnTelaoAntes = document.createElement("button");
            btnTelaoAntes.id = "btnTelaoAntes";
            btnTelaoAntes.innerHTML = '<img class="iconeBotao" src="icons/tela-simples.svg" alt=""> Tel\\\\u00e3o - Antes da Sess\\\\u00e3o';
            btnTelaoAntes.style.cssText = "display:block;margin:15px auto 0;padding:10px 24px;background:#10b981;color:white;border:none;border-radius:4px;cursor:pointer;font-size:16px;font-weight:bold;";
            btnTelaoAntes.addEventListener("click", () => window.open("telao_antes.html", "telao_antes", "width=1280,height=720"));
            tituloSessao.parentNode.insertBefore(btnTelaoAntes, btnTelaoSimples);
        }
        btnTelaoAntes.style.display = "block";
`;
code = code.replace(/btnTelaoSimples\.style\.display = "block";/, 'btnTelaoSimples.style.display = "block";' + btnAntes);

// And hide the new button when not in tela_simples
const hideBtnAntes = `
        const btnTelaoAntes = document.getElementById("btnTelaoAntes");
        if(btnTelaoAntes) btnTelaoAntes.style.display = "none";
`;
code = code.replace(/const btnTelaoSimples = document\.getElementById\("btnTelaoSimples"\);\s*if\(btnTelaoSimples\) btnTelaoSimples\.style\.display = "none";/, 'const btnTelaoSimples = document.getElementById("btnTelaoSimples");\n        if(btnTelaoSimples) btnTelaoSimples.style.display = "none";' + hideBtnAntes);

fs.writeFileSync('controle.js', code);
