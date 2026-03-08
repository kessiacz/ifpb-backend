document.addEventListener('DOMContentLoaded', () => {
    const checkbox = document.querySelector('#checkbox');
    const menuBtn = document.querySelector('.ri-menu-line');
    const closeBtn = document.querySelector('.ri-close-line');
    const menuOverlay = document.querySelector('#menuOverlay');

    if (checkbox) checkbox.addEventListener('change', () => document.body.classList.toggle('light-mode'));

    const openMenu = () => {
        menuOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    };
    const closeMenu = () => {
        menuOverlay.classList.add('hidden');
        document.body.style.overflow = 'auto';
    };

    if (menuBtn) menuBtn.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);

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
                term.writeln("\r\nNenhum edital encontrado em nenhuma das tentativas.");
                return;
            }
            lista.forEach(e => {
                term.writeln("-".repeat(50));
                term.writeln(`EDITAL: ${e.nome}`);
                term.writeln(`LINK: ${e.link}`);
            });
            term.writeln("-".repeat(50));
        };

        const btnRun = document.getElementById('btnRunTerminal');
        if (btnRun) {
            btnRun.addEventListener('click', async () => {
                term.clear();
                const backendUrl = "https://ifpb-backend.onrender.com";

                while (true) {
                    term.writeln("\r\n(0) Sair\r\n(1) Direcao Geral\r\n(2) Pesquisa\r\n(3) Extensao\r\n(4) Assistencia Estudantil\r\n(5) Ensino\r\n(6) Inovacao");
                    const rawOp = await customInput("Escolha uma opcao: ");
                    const op = rawOp.trim();

                    if (op === "0") { term.writeln("Encerrado."); break; }

                    const categorias = {
                        "1": "direcao-geral", "2": "pesquisa", "3": "extensao",
                        "4": "assistencia-estudantil", "5": "ensino", "6": "inovacao"
                    };

                    const categoria = categorias[op];
                    if (!categoria) {
                        term.writeln("\r\n[!] Opcao invalida. Digite o numero (1-6).");
                        continue;
                    }

                    const rawAno = await customInput("Digite o ano (ex: 2024): ");
                    const anoStr = rawAno.trim();

                    const buscar = async (anoBusca) => {
                        term.writeln(`\r\nTentando: ${categoria}/${anoBusca}...`);
                        const res = await fetch(`${backendUrl}/editais/${categoria}/${anoBusca}`);
                        return await res.json();
                    };

                    try {
                        let data = await buscar(anoStr);
                        if (!data.editais || data.editais.length === 0) {
                            term.writeln(`Nada em ${anoStr}. Tentando ${anoStr}-1...`);
                            data = await buscar(`${anoStr}-1`);
                        }
                        mostrar_editais(data.editais);
                    } catch (err) {
                        term.writeln("\r\n[!] Erro de conexao. Tentando alternativa direto...");
                        try {
                            const dataAlt = await buscar(`${anoStr}-1`);
                            mostrar_editais(dataAlt.editais);
                        } catch (e) {
                            term.writeln("\r\n[ERRO]: Servidor offline. Tente novamente em 1 min.");
                        }
                    }
                }
            });
        }
    })();
});