import fs from 'fs';
let html = fs.readFileSync('telao_antes.html', 'utf8');

// Update header grid and colors
html = html.replace(
    /header\s*\{\s*display:\s*grid;\s*grid-template-columns:\s*1fr auto 1fr;\s*align-items:\s*center;\s*background-color:\s*#0b5c9e;\s*color:\s*#fff;\s*padding:\s*20px 40px;\s*box-shadow:\s*0 4px 6px rgba\(0,0,0,0\.1\);\s*\}/,
    `header {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            background-color: #ffffff;
            color: #333333;
            padding: 20px 40px;
            border-bottom: 3px solid #e2e8f0;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }`
);

html = html.replace(
    /\.header-titles\s*\{\s*display:\s*flex;\s*flex-direction:\s*column;\s*text-align:\s*center;\s*\}/,
    `.header-titles {
            display: flex;
            flex-direction: column;
            text-align: left;
            padding-left: 10px;
        }`
);

html = html.replace(
    /h1\s*\{\s*font-size:\s*32px;\s*font-weight:\s*bold;\s*letter-spacing:\s*1px;\s*text-transform:\s*uppercase;\s*\}/,
    `h1 {
            font-size: 30px;
            font-weight: 600;
            letter-spacing: 0px;
            text-transform: none;
            color: #2c3e50;
            margin: 0;
            line-height: 1.2;
        }`
);

html = html.replace(
    /\.subtitle\s*\{\s*font-size:\s*18px;\s*color:\s*#b3d4ff;\s*margin-top:\s*5px;\s*font-weight:\s*500;\s*\}/,
    `.subtitle {
            font-size: 22px;
            color: #4a5568;
            margin-top: 2px;
            font-weight: 500;
        }`
);

// Replace HTML
html = html.replace(
    /<div class="header-titles">\s*<h1>Câmara Municipal de Ubá\/MG<\/h1>\s*<\/div>/,
    `<div class="header-titles">
            <h1>Câmara Municipal de Ubá</h1>
            <div class="subtitle">Estado de Minas Gerais</div>
        </div>`
);

fs.writeFileSync('telao_antes.html', html);
