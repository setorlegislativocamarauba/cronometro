import fs from 'fs';
let html = fs.readFileSync('telao_antes.html', 'utf8');

html = html.replace(
    /background-color:\s*#00447c;/g,
    `background-color: #0b5c9e;`
);

html = html.replace(
    /filter:\s*drop-shadow\(0 0 10px rgba\(255, 255, 255, 0\.7\)\);/g,
    ``
);

fs.writeFileSync('telao_antes.html', html);
