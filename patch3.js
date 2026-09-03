import fs from 'fs';
let code = fs.readFileSync('controle.js', 'utf8');

const saplSessaoId = 'const saplSessaoId = localStorage.getItem("saplSessaoId") || "";';
code = code.replace(/const corOradorAtual = .*/, '$&\n    ' + saplSessaoId);

const saplCard = `
        <div class="admin-card">
            <h2>Integração SAPL (Telão Antes da Sessão)</h2>
            <div style="display:flex; flex-direction:column; align-items:center; margin-top: 15px;">
                <label style="font-weight:bold; margin-bottom: 5px;">ID da Sessão no SAPL:</label>
                <div style="display:flex; gap: 10px;">
                    <input type="text" id="saplSessaoIdInput" value="\${saplSessaoId}" placeholder="Ex: 1947" style="padding: 8px; border: 1px solid #ccc; border-radius: 4px; width: 120px; text-align: center;">
                    <button id="btnSalvarSapl" class="botaoAdmin botaoAdminSalvar" style="margin: 0; padding: 8px 15px;">Salvar ID</button>
                </div>
            </div>
        </div>
`;

code = code.replace(/<div class="admin-card">\s*<h2>Cadastro de Vereadores<\/h2>/, saplCard + '\n        $&');

const saplListener = `
    const btnSalvarSapl = document.getElementById("btnSalvarSapl");
    if(btnSalvarSapl) {
        btnSalvarSapl.addEventListener("click", () => {
            const val = document.getElementById("saplSessaoIdInput").value.trim();
            localStorage.setItem("saplSessaoId", val);
            alert("ID da Sessão salvo com sucesso!");
        });
    }
`;

code = code.replace(/const listaEl = document.getElementById\("listaAdministradorVereadores"\);/, saplListener + '\n\n    $&');

fs.writeFileSync('controle.js', code);
