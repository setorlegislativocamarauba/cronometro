import fs from 'fs';
let css = fs.readFileSync('controle.css', 'utf8');

css = css.replace(
    /\.acoes\s*\{\s*margin-top:10px;\s*display:flex;/g,
    '.acoes{ margin-top:10px; display:none;'
);

css = css.replace(
    /\.opcoes\s*\{\s*margin-top:30px;\s*text-align:center;\s*display:flex;/g,
    '.opcoes{ margin-top:30px; text-align:center; display:none;'
);

fs.writeFileSync('controle.css', css);
