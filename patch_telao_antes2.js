import fs from 'fs';
let code = fs.readFileSync('telao_antes.html', 'utf8');

code = code.replace(
    /text-align: justify;/g, 
    'text-align: justify;\n            display: -webkit-box;\n            -webkit-line-clamp: 3;\n            -webkit-box-orient: vertical;\n            overflow: hidden;'
);

fs.writeFileSync('telao_antes.html', code);
