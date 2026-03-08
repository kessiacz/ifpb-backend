document.addEventListener('DOMContentLoaded', () => {
    const checkbox = document.querySelector('#checkbox');
    const menuBtn = document.querySelector('.ri-menu-line');
    const closeBtn = document.querySelector('.ri-close-line');
    const menuOverlay = document.querySelector('#menuOverlay');

    // --- Lógica de Interface ---
    if (checkbox) {
        checkbox.addEventListener('change', () => {
            document.body.classList.toggle('light-mode');
        });
    }

    const openMenu = () => {
        menuOverlay.classList.remove('hidden');
        menuBtn.classList.add('hidden');
        closeBtn.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    };

    const closeMenu = () => {
        menuOverlay.classList.add('hidden');
        menuBtn.classList.remove('hidden');
        closeBtn.classList.add('hidden');
        document.body.style.overflow = 'auto';
    };

    if (menuBtn) menuBtn.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    menuOverlay.addEventListener('click', (e) => { if (e.target === menuOverlay) closeMenu(); });
    menuOverlay.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

    // --- Terminal e Backend ---
    (async () => {
        const term = new Terminal({
            cursorBlink: true,
            rows: 20,
            theme: { background: '#000000', foreground: '#ffffff' },
            fontFamily: 'Courier New, monospace',
            fontSize: 14
        });
        
        term.open(document.getElementById('terminal-container'));
        term.writeln("Terminal pronto. Clique em RUN.");

        let inputBuffer = "";
        let resolveInput;

        const customInput = async (promptMsg = "") => {
            term.write(promptMsg);
            return new Promise(resolve => { resolveInput = resolve; });
        };

        term.onData(e => {
            if (!resolveInput) return;
            if (e === "\r") {
                const data = inputBuffer;
                inputBuffer = "";
                term.write("\r\n");
                resolveInput(data);
                resolveInput = null;
            } else if (e === "\u007f") {
                if (inputBuffer.length > 0) {
                    inputBuffer = inputBuffer.slice(0, -1);
                    term.write("\b \b");
                }
            } else {
                inputBuffer += e;
                term.write(e);
            }
        });

        const mostrar_editais = (lista) => {
            if (!lista || lista.length === 0) {
                term.writeln("\r\nNenhum edital encontrado para este ano.");
                return;
            }
            lista.forEach(e => {
                term.writeln("-".repeat(60));
                term.writeln(`EDITAL: ${e.nome}`);
                term.writeln(`LINK: ${e.link}`);
            });
            term.writeln("-".repeat(60));
        };

        document.getElementById('btnRunTerminal').addEventListener('click', async () => {
            term.clear();
            const backendUrl = "https://ifpb-backend.onrender.com";

            while (true) {
                term.writeln("\r\n(0) Sair\r\n(1) Direcao Geral\r\n(2) Pesquisa\r\n(3) Extensao\r\n(4) Assistencia Estudantil\r\n(5) Ensino\r\n(6) Inovacao");
                const op = await customInput("Escolha uma opcao: ");
                if (op === "0") { term.writeln("Encerrado."); break; }

                const anoStr = await customInput("Digite o ano desejado (ex: 2024): ");
                if (!/^\d{4}$/.test(anoStr)) {
                    term.writeln("\r\nAno invalido."); continue;
                }

                const categorias = {
                    "1": "direcao-geral", "2": "pesquisa", "3": "extensao",
                    "4": "assistencia-estudantil", "5": "ensino", "6": "inovacao"
                };

                const categoria = categorias[op];
                if (!categoria) {
                    term.writeln("\r\nOpcao invalida."); continue;
                }

                try {
                    term.writeln(`\r\nBuscando em: ${categoria}/${anoStr}...`);
                    // Chamada corrigida para bater com o server.js
                    const res = await fetch(`${backendUrl}/editais/${categoria}/${anoStr}`);
                    
                    if (!res.ok) throw new Error();
                    const data = await res.json();
                    
                    mostrar_editais(data.editais);
                } catch (err) {
                    term.writeln("\r\n[ERRO]: Nao foi possivel conectar ao servidor.");
                    term.writeln("Certifique-se que o server.js esta rodando (Node.js).");
                }
            }
        });
    })();
});