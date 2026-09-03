import fs from 'fs';
let code = fs.readFileSync('controle.js', 'utf8');

const toastFn = `
function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '30px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = isError ? '#f44336' : '#4caf50';
    toast.style.color = '#fff';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    toast.style.zIndex = '9999';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.fontFamily = 'inherit';
    toast.style.fontSize = '14px';
    toast.style.fontWeight = '500';
    
    document.body.appendChild(toast);
    
    // Trigger layout
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(-10px)';
    });
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
`;

// Insert after the first few variable declarations to be available globally
code = code.replace(
    'let editandoOradorTribunaId = null;',
    toastFn + '\nlet editandoOradorTribunaId = null;'
);

code = code.replace(/alert\("Por favor, insira um nome"\);/g, 'showToast("Por favor, insira um nome", true);');
code = code.replace(/alert\("ID da Sessão salvo com sucesso!"\);/g, 'showToast("ID da Sessão salvo com sucesso!");');
code = code.replace(/alert\("Por favor, insira o nome do convidado"\);/g, 'showToast("Por favor, insira o nome do convidado", true);');
code = code.replace(/alert\("Por favor, insira o nome do audiencia"\);/g, 'showToast("Por favor, insira o nome do participante", true);');

fs.writeFileSync('controle.js', code);
