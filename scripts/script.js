document.addEventListener('DOMContentLoaded', () => {

  /* ── THEME TOGGLE ── */
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('change', () => {
        const on = themeToggle.checked;
        document.documentElement.classList.toggle('light-mode', on);
        document.body.classList.toggle('light-mode', on);
    });

  /* ── THEME TOGGLE ── */
  document.getElementById('themeToggle').addEventListener('change', e => {
    document.body.classList.toggle('light-mode', e.target.checked);
  });

  /* ── SOURCE TABS ── */
  document.querySelectorAll('.source-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.source-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.code-block').forEach(b => b.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });

  // ── Cursor (só desktop) ──
  const cursorDot = document.querySelector(".cursor-dot");
  const cursorOutline = document.querySelector(".cursor-outline");

  window.addEventListener("mousemove", (e) => {
      const posX = e.clientX;
      const posY = e.clientY;

      cursorDot.style.left = `${posX}px`;
      cursorDot.style.top = `${posY}px`;

      cursorOutline.animate({
          left: `${posX}px`,
          top: `${posY}px`
      }, { duration: 500, fill: "forwards" });
  });

  window.addEventListener("mousedown", () => {
      cursorOutline.style.transform = "translate(-50%, -50%) scale(0.7)";
  });

  window.addEventListener("mouseup", () => {
      cursorOutline.style.transform = "translate(-50%, -50%) scale(1)";
  });

  /* ── BARRA DE PROGRESSAO ── */
  const progressBar = document.getElementById('progress-bar');

  const updateProgress = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = pct + '%';
  };

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();


  /* ── TERMINAL ── */
  (async () => {
    const term = new Terminal({
      cursorBlink: true,
      rows: 22,
      cols: 80,
      theme: {
        background: '#000000',
        foreground: '#e8e8e8',
        cursor: '#00ff88',
        green: '#00ff88',
        brightGreen: '#00ff88',
      },
      fontFamily: 'JetBrains Mono, Courier New, monospace',
      fontSize: 14,
      lineHeight: 1.4,
      scrollback: 500,
    });

    term.open(document.getElementById('terminal-container'));

    const W  = s => term.write(s);
    const WL = s => term.writeln(s);

    // colors
    const G  = s => `\x1b[32m${s}\x1b[0m`;   // green
    const Y  = s => `\x1b[33m${s}\x1b[0m`;   // yellow
    const C  = s => `\x1b[36m${s}\x1b[0m`;   // cyan
    const R  = s => `\x1b[31m${s}\x1b[0m`;   // red
    const DIM = s => `\x1b[2m${s}\x1b[0m`;   // dim
    const B  = s => `\x1b[1m${s}\x1b[0m`;    // bold

    WL(G('╔══════════════════════════════════════════════════════════╗'));
    WL(G('║') + B('  IFPB Campus Cajazeiras — Listagem de Editais       ') + G('║'));
    WL(G('╚══════════════════════════════════════════════════════════╝'));
    WL('');
    WL(DIM('  Terminal pronto. Clique em ') + Y('RUN') + DIM(' para iniciar.'));
    WL('');

    let inputBuffer = '';
    let resolveInput = null;

    term.onData(e => {
      if (!resolveInput) return;
      if (e === '\r') {
        const data = inputBuffer;
        inputBuffer = '';
        W('\r\n');
        resolveInput(data);
        resolveInput = null;
      } else if (e === '\u007f') {
        if (inputBuffer.length > 0) {
          inputBuffer = inputBuffer.slice(0, -1);
          W('\b \b');
        }
      } else {
        inputBuffer += e;
        W(e);
      }
    });

    const ask = (msg = '') => {
      W(msg);
      return new Promise(r => { resolveInput = r; });
    };

    const backendUrl = 'https://ifpb-backend.onrender.com';

    const categorias = {
      '1': 'direcao-geral',
      '2': 'pesquisa',
      '3': 'extensao',
      '4': 'assistencia-estudantil',
      '5': 'ensino',
      '6': 'inovacao'
    };

    const catLabels = {
      '1': 'Direção Geral',
      '2': 'Pesquisa',
      '3': 'Extensão',
      '4': 'Assistência Estudantil',
      '5': 'Ensino',
      '6': 'Inovação'
    };

    const buscar = async (cat, ano) => {
      const res = await fetch(`${backendUrl}/editais/${cat}/${ano}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    };

    const mostrarEditais = (lista) => {
      if (!lista || lista.length === 0) {
        WL('');
        WL(Y('  Nenhum edital encontrado para os parâmetros informados.'));
        WL('');
        return;
      }
      WL('');
      WL(G(`  ─── ${lista.length} edital(is) encontrado(s) ───`));
      WL('');
      lista.forEach((e, i) => {
        WL(DIM(`  [${'0'.repeat(2 - String(i+1).length)}${i+1}] `) + B(e.nome || '—'));
        WL('      ' + C(e.link || ''));
        WL('');
      });
    };

    const menu = () => {
      WL(DIM('  ┌─────────────────────────────────┐'));
      WL(DIM('  │') + '  ' + Y('(0)') + ' Sair                       ' + DIM('│'));
      WL(DIM('  │') + '  ' + G('(1)') + ' Direção Geral              ' + DIM('│'));
      WL(DIM('  │') + '  ' + G('(2)') + ' Pesquisa                   ' + DIM('│'));
      WL(DIM('  │') + '  ' + G('(3)') + ' Extensão                   ' + DIM('│'));
      WL(DIM('  │') + '  ' + G('(4)') + ' Assistência Estudantil     ' + DIM('│'));
      WL(DIM('  │') + '  ' + G('(5)') + ' Ensino                     ' + DIM('│'));
      WL(DIM('  │') + '  ' + G('(6)') + ' Inovação                   ' + DIM('│'));
      WL(DIM('  └─────────────────────────────────┘'));
      WL('');
    };

    const btn = document.getElementById('btnRun');

    const runSession = async () => {
      btn.disabled = true;
      btn.textContent = '● rodando';
      term.clear();

      WL(G('╔══════════════════════════════════════════════════════════╗'));
      WL(G('║') + B('  IFPB Campus Cajazeiras — Listagem de Editais       ') + G('║'));
      WL(G('╚══════════════════════════════════════════════════════════╝'));
      WL('');

      while (true) {
        menu();
        const rawOp = await ask(G('  ❯ ') + 'Escolha uma opção: ');
        const op = rawOp.trim();

        if (op === '0') {
          WL('');
          WL(DIM('  Sessão encerrada. Clique em ') + Y('RUN') + DIM(' para reiniciar.'));
          break;
        }

        const cat = categorias[op];
        if (!cat) {
          WL('');
          WL(R('  [!] Opção inválida. Digite um número de 0 a 6.'));
          WL('');
          continue;
        }

        WL('');
        const rawAno = await ask(G('  ❯ ') + `Categoria: ${B(catLabels[op])} — Ano (ex: 2024): `);
        const anoStr = rawAno.trim();

        if (!/^\d{4}$/.test(anoStr)) {
          WL('');
          WL(R('  [!] Ano inválido. Digite 4 dígitos (ex: 2024).'));
          WL('');
          continue;
        }

        WL('');
        WL(DIM(`  Buscando ${catLabels[op]} / ${anoStr}...`));

        try {
          let data = await buscar(cat, anoStr);
          if (!data.editais || data.editais.length === 0) {
            WL(DIM(`  Sem resultados em ${anoStr}. Tentando ${anoStr}-1...`));
            data = await buscar(cat, `${anoStr}-1`);
          }
          mostrarEditais(data.editais);
        } catch (err) {
          WL(DIM(`  Tentativa principal falhou. Tentando ${anoStr}-1...`));
          try {
            const alt = await buscar(cat, `${anoStr}-1`);
            mostrarEditais(alt.editais);
          } catch (e2) {
            WL('');
            WL(R('  [ERRO] Servidor offline ou sem resposta.'));
            WL(DIM('         Aguarde ~1 min (cold start) e tente novamente.'));
            WL('');
          }
        }
      }

      btn.disabled = false;
      btn.textContent = '▶ RUN';
    };

    btn.addEventListener('click', runSession);
  })();
});