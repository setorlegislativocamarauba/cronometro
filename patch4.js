import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/const distPath = path\.join\(process\.cwd\(\), 'dist'\);/, "const distPath = process.cwd();");

fs.writeFileSync('server.ts', code);
