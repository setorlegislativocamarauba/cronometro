import fs from 'fs';
let code = fs.readFileSync('telao_antes.html', 'utf8');

const mediaQuery = `
        /* Responsive adjustments for smaller screens */
        @media (max-height: 850px) {
            header { padding: 10px 20px; }
            .brasao { height: 50px; }
            h1 { font-size: 24px; }
            .subtitle { font-size: 16px; }
            .main-content { padding: 15px 20px; }
            .session-info { margin-bottom: 15px; }
            .session-info h2 { font-size: 22px; }
            .session-info h3 { font-size: 18px; margin-top: 5px; }
            .carousel-page { gap: 10px; }
            .materia-card { padding: 15px 20px; }
            .materia-titulo { font-size: 18px; }
            .materia-ementa { font-size: 16px; line-height: 1.4; }
            .materia-autor { font-size: 14px; padding: 3px 10px; }
        }
        @media (max-height: 700px) {
            header { padding: 5px 15px; }
            .brasao { height: 40px; }
            h1 { font-size: 20px; }
            .subtitle { font-size: 14px; }
            .main-content { padding: 10px 15px; }
            .session-info { margin-bottom: 10px; }
            .session-info h2 { font-size: 18px; }
            .session-info h3 { font-size: 16px; margin-top: 2px; }
            .carousel-page { gap: 8px; }
            .materia-card { padding: 10px 15px; }
            .materia-titulo { font-size: 16px; margin-bottom: 5px; }
            .materia-ementa { font-size: 14px; line-height: 1.3; }
            .materia-header { margin-bottom: 5px; }
        }
    </style>
`;

code = code.replace('    </style>', mediaQuery);

fs.writeFileSync('telao_antes.html', code);
