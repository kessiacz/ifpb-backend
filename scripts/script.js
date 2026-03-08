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
    
    if (menuOverlay) {
        menuOverlay.addEventListener('click', (e) => { if (e.target === menuOverlay) closeMenu(); });
        menuOverlay.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    }

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
            if (e === "\r") { // Enter
                const data = inputBuffer;
                inputBuffer = "";
                term.write("\r\n");
                resolveInput(data);
                resolveInput = null;
            } else if (e === "\u007f") { // Backspace
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
                term.writeln("\r\nNenhum edital encontrado.");
                return;
            }
            lista.forEach(e => {
                term.writeln("-".repeat(60));
                term.writeln(`EDITAL: ${e.nome}`);
                term.writeln(`LINK: ${e.link}`);
            });
            term.writeln("-".repeat(60));
        };

        const btnRun = document.getElementById('btnRunTerminal');
        if (btnRun) {
            btnRun.addEventListener('click', async () => {
                term.clear();
                const backendUrl = "https://ifpb-backend.onrender.com";

                while (true) {
                    term.writeln("\r\n(0) Sair\r\n(1) Direcao Geral\r\n(2) Pesquisa\r\n(3) Extensao\r\n(4) Assistencia Estudantil\r\n(5) Ensino\r\n(6) Inovacao");
                    const op = await customInput("Escolha uma opcao: ");
                    
                    if (op === "0") { 
                        term.writeln("Encerrado."); 
                        break; 
                    }

                    const anoInput = await customInput("Digite o ano desejado (ex: 2024): ");
                    const anoStr = anoInput.trim();

                    if (!/^\d{4}$/.test(anoStr)) {
                        term.writeln("\r\n[!] Ano invalido. Use o formato AAAA."); 
                        continue;
                    }

                    const categorias = {
                        "1": "direcao-geral", "2": "pesquisa", "3": "extensao",
                        "4": "assistencia-estudantil", "5": "ensino", "6": "inovacao"
                    };

                    const categoria = categorias[op];
                    if (!categoria) {
                        term.writeln("\r\n[!] Opcao invalida."); 
                        continue;
                    }

                    // Função para buscar editais do backend
                    const buscarEditais = async (categoria, ano) => {
                        const res = await fetch(`${backendUrl}/editais/${categoria}/${ano}`);
                        if (!res.ok) throw new Error("Falha na conexao com o servidor");
                        const data = await res.json();
                        return data.editais || [];
                    };

                    try {
                        // Tenta ano normal
                        let editais = await buscarEditais(categoria, anoStr);

                        // Se não encontrou, tenta ano-1
                        if (!editais || editais.length === 0) {
                            term.writeln(`Nenhum edital em ${anoStr}. Tentando ${anoStr}-1...`);
                            editais = await buscarEditais(categoria, `${anoStr}-1`);
                        }

                        // Mostra resultado final
                        if (!editais || editais.length === 0) {
                            term.writeln(`Nenhum edital encontrado para ${anoStr} ou ${anoStr}-1`);
                        } else {
                            mostrar_editais(editais);
                        }

                    } catch (err) {
                        term.writeln("\r\n[ERRO]: Não foi possível conectar ao servidor.");
                        term.writeln("DICA: O Render pode levar até 1 minuto para ligar (Cold Start).");
                        term.writeln("Tente novamente em instantes.");
                    }
                }
            });
        }
    })();
});