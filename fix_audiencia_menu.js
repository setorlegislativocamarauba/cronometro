import fs from 'fs';
let code = fs.readFileSync('controle.js', 'utf8');

if (!code.includes("function abrirMenuTempoAudiencia")) {
    const newFunc = `
function abrirMenuTempoAudiencia(event, index){
    event.stopPropagation();
    const orador = filaAudienciaOradores[index];
    if(!orador) return;
    const botao = event.currentTarget;
    const menuExistente = menuTempoExtraAberto;
    fecharMenuTempoExtra();
    
    if (menuExistente && menuExistente.dataset.alvo === botao.dataset.alvo) {
        return; 
    }
    abrirMenuTempoExtra(event, 'audiencia', orador.nome, true, null);
}
`;
    code += "\n" + newFunc;
    fs.writeFileSync('controle.js', code);
    console.log("Added abrirMenuTempoAudiencia");
}
