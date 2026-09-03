import fs from 'fs';
let code = fs.readFileSync('controle.js', 'utf8');

const funcs = [
    'carregarConvidados',
    'adicionarOradorConvidados',
    'removerOradorConvidados',
    'subirOradorConvidados',
    'descerOradorConvidados',
    'iniciarOradorConvidados',
    'pausarOradorConvidados',
    'adicionarTempoOradorConvidados',
    'encerrarOradorConvidados',
    'atualizarFilaConvidados',
    'atualizarHistoricoConvidados'
];

let out = "";
for (let fname of funcs) {
    let startIdx = code.indexOf(`function ${fname}(`);
    if (startIdx === -1) {
        console.log("NOT FOUND: " + fname);
        continue;
    }
    
    let braceCount = 0;
    let endIdx = -1;
    let foundFirstBrace = false;
    for (let i = startIdx; i < code.length; i++) {
        if (code[i] === '{') {
            braceCount++;
            foundFirstBrace = true;
        } else if (code[i] === '}') {
            braceCount--;
        }
        if (foundFirstBrace && braceCount === 0) {
            endIdx = i;
            break;
        }
    }
    
    if (endIdx !== -1) {
        out += code.substring(startIdx, endIdx + 1) + "\n\n";
    }
}

fs.writeFileSync('convidados_funcs.js', out);
