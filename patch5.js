import fs from 'fs';
let code = fs.readFileSync('controle.js', 'utf8');

const saplCardAdminRegex = /<div class="admin-card">\s*<h2>Integração SAPL \(Telão Antes da Sessão\)<\/h2>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

// Find the SAPL card and remove it from the admin section
const match = code.match(saplCardAdminRegex);
if(match) {
    code = code.replace(saplCardAdminRegex, '');
} else {
    console.log("Could not find SAPL card in admin");
}

const saplListenerAdminRegex = /const btnSalvarSapl = document\.getElementById\("btnSalvarSapl"\);\s*if\(btnSalvarSapl\) \{\s*btnSalvarSapl\.addEventListener\("click", \(\) => \{\s*const val = document\.getElementById\("saplSessaoIdInput"\)\.value\.trim\(\);\s*localStorage\.setItem\("saplSessaoId", val\);\s*alert\("ID da Sessão salvo com sucesso!"\);\s*\}\);\s*\}/;
if (code.match(saplListenerAdminRegex)) {
    code = code.replace(saplListenerAdminRegex, '');
} else {
    console.log("Could not find SAPL listener in admin");
}

// Now insert into tela_simples
const telaSimplesAppend = `
        let containerSaplConfig = document.getElementById("containerSaplConfig");
        if(!containerSaplConfig) {
            containerSaplConfig = document.createElement("div");
            containerSaplConfig.id = "containerSaplConfig";
            containerSaplConfig.style.cssText = "margin-top: 30px; display: flex; flex-direction: column; align-items: center; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 500px; margin-left: auto; margin-right: auto;";
            
            const saplSessaoId = localStorage.getItem("saplSessaoId") || "";
            containerSaplConfig.innerHTML = \`
                <h2 style="margin-top: 0; color: #00447c; font-size: 18px;">Integração SAPL (Telão Antes da Sessão)</h2>
                <div style="display:flex; flex-direction:column; align-items:center; margin-top: 15px;">
                    <label style="font-weight:bold; margin-bottom: 5px;">ID da Sessão no SAPL:</label>
                    <div style="display:flex; gap: 10px;">
                        <input type="text" id="saplSessaoIdInput" value="\${saplSessaoId}" placeholder="Ex: 1947" style="padding: 8px; border: 1px solid #ccc; border-radius: 4px; width: 120px; text-align: center;">
                        <button id="btnSalvarSapl" style="margin: 0; padding: 8px 15px; background: #064f86; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">Salvar ID</button>
                    </div>
                </div>
            \`;
            
            tituloSessao.parentNode.insertBefore(containerSaplConfig, containerBotoesTelao.nextSibling);

            document.getElementById("btnSalvarSapl").addEventListener("click", () => {
                const val = document.getElementById("saplSessaoIdInput").value.trim();
                localStorage.setItem("saplSessaoId", val);
                alert("ID da Sessão salvo com sucesso!");
            });
        }
        containerSaplConfig.style.display = "flex";
`;

code = code.replace(/containerBotoesTelao\.style\.display = "flex";/, 'containerBotoesTelao.style.display = "flex";' + telaSimplesAppend);

const telaSimplesRemove = `
        const containerSaplConfig = document.getElementById("containerSaplConfig");
        if(containerSaplConfig) containerSaplConfig.remove();
`;
code = code.replace(/if\(containerBotoesTelao\) \{\s*containerBotoesTelao\.remove\(\);\s*\}/, '$&' + telaSimplesRemove);

fs.writeFileSync('controle.js', code);
