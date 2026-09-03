import fs from 'fs';
let code = fs.readFileSync('controle.js', 'utf8');

const oldAdminColors = `<div class="admin-card" style="display:flex; flex-direction:column; align-items:center;">
            <h3 style="font-size:16px; color:inherit;">Cor do Nome do Orador (Telão)</h3>
            <div id="paletaCoresOrador" style="display: flex; gap: 10px; align-items: center; margin-top: 10px;">
                \${['#ffffff', '#ffeb3b', '#4caf50', '#2196f3', '#f44336', '#ff9800'].map(c => 
                    \`<div class="cor-swatch" data-cor="\${c}" style="background-color: \${c}; width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ccc; cursor: pointer;"></div>\`
                ).join('')}
                <input type="color" id="corOradorPersonalizada" value="\${corOradorAtual}" style="width: 35px; height: 35px; border: none; cursor: pointer; border-radius: 4px; padding: 0; background: none;">
            </div>
        </div>`;

const newAdminColors = `<div class="admin-card" style="display:flex; flex-direction:column; align-items:center;">
            <h3 style="font-size:16px; color:inherit;">Cor do Nome do Orador (Telão)</h3>
            <div id="paletaCoresOrador" style="display: flex; gap: 10px; align-items: center; margin-top: 10px;">
                \${['#ffffff', '#ffeb3b', '#4caf50', '#2196f3', '#f44336', '#ff9800'].map(c => 
                    \`<div class="cor-swatch" data-cor="\${c}" style="background-color: \${c}; width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ccc; cursor: pointer;"></div>\`
                ).join('')}
                <input type="color" id="corOradorPersonalizada" value="\${corOradorAtual}" style="width: 35px; height: 35px; border: none; cursor: pointer; border-radius: 4px; padding: 0; background: none;">
            </div>
        </div>

        <div class="admin-card" style="display:flex; flex-direction:column; align-items:center;">
            <h3 style="font-size:16px; color:inherit;">Cor do Cronômetro (Telão)</h3>
            <div id="paletaCoresCronometro" style="display: flex; gap: 10px; align-items: center; margin-top: 10px;">
                \${['#ffffff', '#ffeb3b', '#4caf50', '#2196f3', '#f44336', '#ff9800'].map(c => 
                    \`<div class="cor-swatch-cron" data-cor="\${c}" style="background-color: \${c}; width: 30px; height: 30px; border-radius: 50%; border: 2px solid #ccc; cursor: pointer;"></div>\`
                ).join('')}
                <input type="color" id="corCronometroPersonalizada" value="\${corCronometroAtual}" style="width: 35px; height: 35px; border: none; cursor: pointer; border-radius: 4px; padding: 0; background: none;">
            </div>
        </div>`;

code = code.replace(oldAdminColors, newAdminColors);

code = code.replace(
    'const corOradorAtual = localStorage.getItem("corNomeOrador") || "#ffffff";',
    'const corOradorAtual = localStorage.getItem("corNomeOrador") || "#ffffff";\n    const corCronometroAtual = localStorage.getItem("corCronometro") || "#ffffff";'
);

const oldEventHandlers = `    const swatches = document.querySelectorAll(".cor-swatch");
    const inputCorPersonalizada = document.getElementById("corOradorPersonalizada");
    
    function atualizarCorTelao(cor) {
        localStorage.setItem("corNomeOrador", cor);
        if(inputCorPersonalizada) inputCorPersonalizada.value = cor;
    }

    swatches.forEach(swatch => {
        swatch.addEventListener("click", (e) => {
            const cor = e.target.dataset.cor;
            atualizarCorTelao(cor);
        });
    });

    if (inputCorPersonalizada) {
        inputCorPersonalizada.addEventListener("input", (e) => {
            atualizarCorTelao(e.target.value);
        });
    }`;

const newEventHandlers = `    const swatches = document.querySelectorAll(".cor-swatch");
    const inputCorPersonalizada = document.getElementById("corOradorPersonalizada");
    
    function atualizarCorTelao(cor) {
        localStorage.setItem("corNomeOrador", cor);
        if(inputCorPersonalizada) inputCorPersonalizada.value = cor;
    }

    swatches.forEach(swatch => {
        swatch.addEventListener("click", (e) => {
            const cor = e.target.dataset.cor;
            atualizarCorTelao(cor);
        });
    });

    if (inputCorPersonalizada) {
        inputCorPersonalizada.addEventListener("input", (e) => {
            atualizarCorTelao(e.target.value);
        });
    }
    
    const swatchesCron = document.querySelectorAll(".cor-swatch-cron");
    const inputCorCronPersonalizada = document.getElementById("corCronometroPersonalizada");
    
    function atualizarCorCronometro(cor) {
        localStorage.setItem("corCronometro", cor);
        if(inputCorCronPersonalizada) inputCorCronPersonalizada.value = cor;
        // The telao.html listens to storage events, so it will update instantly!
    }

    swatchesCron.forEach(swatch => {
        swatch.addEventListener("click", (e) => {
            const cor = e.target.dataset.cor;
            atualizarCorCronometro(cor);
        });
    });

    if (inputCorCronPersonalizada) {
        inputCorCronPersonalizada.addEventListener("input", (e) => {
            atualizarCorCronometro(e.target.value);
        });
    }`;

code = code.replace(oldEventHandlers, newEventHandlers);
fs.writeFileSync('controle.js', code);
