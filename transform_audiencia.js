import fs from 'fs';

let text = fs.readFileSync('convidados_funcs.js', 'utf8');

text = text.replace(/Convidados/g, 'Audiencia');
text = text.replace(/convidados/g, 'audiencia');
text = text.replace(/Convidado/g, 'Audiencia');
text = text.replace(/convidado/g, 'audiencia');

text = text.replace(/Inserir Audiencia\/Convocado/g, 'Inserir Orador');
text = text.replace(/Adicionar Audiencia\/Convocado/g, 'Adicionar Orador');
text = text.replace(/Nome do\(a\) Audiencia\(a\)/g, 'Nome do(a) Orador(a)');

// We need to inject the Theme UI into carregarAudiencia
const themeUI = `
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
`;

text = text.replace(/<h2 style="text-align:center;">\s*Inserir Orador\s*<\/h2>/, themeUI);

const bindThemeLogic = `
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
`;

text = text.replace(/\/\/ Adicionar listener para o botão de audiencia externo/, bindThemeLogic);

fs.writeFileSync('audiencia_funcs.js', text);
