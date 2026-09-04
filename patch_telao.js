import fs from 'fs';
let code = fs.readFileSync('telao.html', 'utf8');

const mediaQuery = `
        /* Responsive adjustments for smaller screens */
        @media (max-height: 850px) {
            .container-telao { padding: 10px 20px; }
            .espacador-telao { height: 20px; }
            .titulo-sessao-telao { min-height: 60px; font-size: clamp(24px, 3.5vw, 45px); margin-top: 5px; }
            .status-telao { font-size: 28px; height: 40px; }
            .orador-atual-telao { font-size: clamp(30px, 2.5vw, 45px); min-height: 60px; }
            .cronometro-telao { font-size: 130px; }
            .proximo-orador-telao { font-size: 22px; margin-bottom: 10px; min-height: 30px; }
            .relogio-telao { font-size: 22px; bottom: 10px; right: 10px; }
        }
        @media (max-height: 700px) {
            .container-telao { padding: 5px 15px; }
            .espacador-telao { height: 10px; }
            .titulo-sessao-telao { min-height: 40px; font-size: clamp(20px, 3vw, 35px); }
            .status-telao { font-size: 22px; height: 30px; }
            .orador-atual-telao { font-size: clamp(24px, 2vw, 35px); min-height: 40px; }
            .cronometro-telao { font-size: 100px; }
            .proximo-orador-telao { font-size: 18px; margin-bottom: 5px; min-height: 25px; }
            .relogio-telao { font-size: 18px; }
        }
    </style>
`;

if (!code.includes('@media (max-height: 850px)')) {
    code = code.replace('</style>', mediaQuery);
    fs.writeFileSync('telao.html', code);
}
