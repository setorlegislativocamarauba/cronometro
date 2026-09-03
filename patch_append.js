import fs from 'fs';

let funcs = fs.readFileSync('audiencia_funcs.js', 'utf8');

let stateVars = `
/* ==========================
AUDIÊNCIA PÚBLICA / SEMINÁRIO
========================== */
let filaAudienciaOradores = [];
let historicoAudiencia = [];
let audienciaAdicionados = [];
`;

let code = fs.readFileSync('controle.js', 'utf8');

// Insert state vars at the top with others
code = code.replace('let filaConvidadosOradores = [];', 'let filaConvidadosOradores = [];\n' + stateVars);

// Append the functions at the end of the file
code += '\n\n' + funcs;

// Now modify selecionarModo
const modoAudienciaBlock = `
    if(
        modo ===
        "audiencia"
    ){

        // O título é configurado dentro de carregarAudiencia caso ele mude. 
        // Mas podemos definir um padrão se for o primeiro carregamento:
        if (tituloSessao.textContent === "AUDIÊNCIA PÚBLICA / SEMINÁRIO" || tituloSessao.textContent === "TELÃO") {
            tituloSessao.textContent = "AUDIÊNCIA PÚBLICA / SEMINÁRIO";
        }

        document.getElementById("modoAudiencia")
        .classList.add(
            "modoAtivo"
        );

        proximoEl.style.display = "none";
        btnProximoEl.style.display = "none";

        const container = document.querySelector(".container");
        if(container){
            container.style.display = "";
        }

        carregarAudiencia();

    }
`;

code = code.replace(/if\(\s*modo ===\s*"pausa"\s*\)\{/, modoAudienciaBlock + '\n    if(\n        modo ===\n        "pausa"\n    ){');

// Add the event listener for the new button
const eventListener = `
const modoAudiencia =
document.getElementById(
    "modoAudiencia"
);

modoAudiencia
.addEventListener(
    "click",
    ()=>selecionarModo(
        "audiencia"
    )
);
`;

code = code.replace(/const modoConvidados =/, eventListener + '\nconst modoConvidados =');

fs.writeFileSync('controle.js', code);
