import fs from 'fs';
let html = fs.readFileSync('telao_antes.html', 'utf8');

// Replace CSS
html = html.replace(
    /header\s*\{\s*display:\s*flex;\s*align-items:\s*center;\s*justify-content:\s*center;\s*background-color:\s*#00447c;\s*color:\s*#fff;\s*padding:\s*20px 40px;\s*box-shadow:\s*0 4px 6px rgba\(0,0,0,0\.1\);\s*\}/,
    `header {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            background-color: #00447c;
            color: #fff;
            padding: 20px 40px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .brasao-container {
            display: flex;
            justify-content: flex-end;
            padding-right: 25px;
        }`
);

html = html.replace(
    /\.brasao\s*\{\s*height:\s*80px;\s*margin-right:\s*25px;\s*\}/,
    `.brasao {
            height: 80px;
            filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.7));
        }`
);

html = html.replace(
    /\.header-titles\s*\{\s*display:\s*flex;\s*flex-direction:\s*column;\s*\}/,
    `.header-titles {
            display: flex;
            flex-direction: column;
            text-align: center;
        }`
);

// Replace HTML
html = html.replace(
    /<header>[\s\S]*?<\/header>/,
    `<header>
        <div class="brasao-container">
            <img src="https://setorlegislativocamarauba.github.io/cronometro/Brasao_Uba.png" alt="Brasão de Ubá" class="brasao">
        </div>
        <div class="header-titles">
            <h1>Câmara Municipal de Ubá/MG</h1>
        </div>
        <div></div>
    </header>`
);

fs.writeFileSync('telao_antes.html', html);
