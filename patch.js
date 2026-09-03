import fs from 'fs';
let code = fs.readFileSync('controle.js', 'utf8');

// 1. Remove admin timer reset
code = code.replace(/pausarCronometro\(\);\s*definirOradorAtual\("none"\);\s*tempoInicial = 300;\s*tempoRestante = 300;\s*atualizarCronometro\(\);/, '');

// 2. Remove carregarTribuna resets
code = code.replace(/filaTribunaOradores = \[\];/, '');
code = code.replace(/pausarCronometro\(\);\s*definirOradorAtual\("none"\);\s*tempoInicial = 300;\s*tempoRestante = 300;\s*document\.getElementById\("cronometro"\)\.style\.display = "none";\s*salvarEstadoTelao\(\);/g, '');

// 3. Remove carregarDiscussao resets
code = code.replace(/filaDiscussaoOradores = \[\];/, '');

// 4. Remove carregarConvidados resets
code = code.replace(/\/\/ Limpar estado ao carregar\s*filaConvidadosOradores = \[\];\s*historicoConvidados = \[\];\s*convidadosAdicionados = \[\];\s*tempoInicialConvidado = 120;/, '');
// Note that carregarConvidados also had the same timer reset block, but it is covered by the global replace above! (wait, with the comment...)

// Let's do it better
code = code.replace(/\/\/ Ocultar cronômetro no modo convidados \(tempo é facultativo\)/, '');
code = code.replace(/pausarCronometro\(\);\s*definirOradorAtual\("none"\);\s*tempoInicial = 300;\s*tempoRestante = 300;\s*document\.getElementById\("cronometro"\)\.style\.display = "none";\s*salvarEstadoTelao\(\);/g, '');


fs.writeFileSync('controle.js', code);
