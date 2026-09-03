import fs from 'fs';
let html = fs.readFileSync('telao_antes.html', 'utf8');

html = html.replace(
    /\.session-info h3\s*\{\s*font-size:\s*22px;\s*color:\s*#555;\s*font-weight:\s*normal;\s*\}/,
    `.session-info h3 {
            font-size: 24px;
            color: #2c3e50;
            font-weight: 600;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-top: 8px;
        }`
);

fs.writeFileSync('telao_antes.html', html);
