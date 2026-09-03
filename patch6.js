import fs from 'fs';
let code = fs.readFileSync('controle.js', 'utf8');

const regex = /const saplSessaoId = localStorage\.getItem\("saplSessaoId"\) \|\| "";[\s\S]*?\}\);\s*\}/;

const replacement = `
            const saplSessaoId = localStorage.getItem("saplSessaoId") || "";
            let history = [];
            try {
                history = JSON.parse(localStorage.getItem("saplSessaoIdHistory")) || [];
            } catch(e) {}
            
            const renderHistory = () => {
                if (history.length === 0) return "";
                return '<div style="margin-top: 15px; font-size: 13px; color: #555; display:flex; align-items:center; gap: 8px;">' +
                       '<span>Últimas utilizadas:</span> ' +
                       history.map(id => '<span style="display:inline-block; padding: 4px 10px; background: #e2e8f0; border-radius: 12px; cursor: pointer; color: #00447c; font-weight: bold; transition: background 0.2s;" onmouseover="this.style.background=\\'#cbd5e1\\'" onmouseout="this.style.background=\\'#e2e8f0\\'" onclick="document.getElementById(\\'saplSessaoIdInput\\').value=\\''+id+'\\';">' + id + '</span>').join('') +
                       '</div>';
            };

            containerSaplConfig.innerHTML = \`
                <h2 style="margin-top: 0; color: #00447c; font-size: 18px;">Integração SAPL (Telão Antes da Sessão)</h2>
                <div style="display:flex; flex-direction:column; align-items:center; margin-top: 15px;">
                    <label style="font-weight:bold; margin-bottom: 5px;">ID da Sessão no SAPL:</label>
                    <div style="display:flex; gap: 10px;">
                        <input type="text" id="saplSessaoIdInput" value="\${saplSessaoId}" placeholder="Ex: 1947" style="padding: 8px; border: 1px solid #ccc; border-radius: 4px; width: 120px; text-align: center;">
                        <button id="btnSalvarSapl" style="margin: 0; padding: 8px 15px; background: #064f86; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">Salvar ID</button>
                    </div>
                    <div id="saplHistoryWrapper">
                        \${renderHistory()}
                    </div>
                </div>
            \`;
            
            tituloSessao.parentNode.insertBefore(containerSaplConfig, containerBotoesTelao.nextSibling);

            document.getElementById("btnSalvarSapl").addEventListener("click", () => {
                const val = document.getElementById("saplSessaoIdInput").value.trim();
                if (!val) return;
                
                localStorage.setItem("saplSessaoId", val);
                
                // Update history
                history = history.filter(id => id !== val);
                history.unshift(val);
                history = history.slice(0, 5); // Keep last 5
                localStorage.setItem("saplSessaoIdHistory", JSON.stringify(history));
                
                document.getElementById("saplHistoryWrapper").innerHTML = renderHistory();
                alert("ID da Sessão salvo com sucesso!");
            });
        }
`;

code = code.replace(regex, replacement.trim());
fs.writeFileSync('controle.js', code);
