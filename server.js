const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { JSDOM } = require("jsdom");

const app = express();
const PORT = process.env.PORT || 3000; 

app.use(cors());
app.use(express.json());

app.get("/editais/:categoria/:ano", async (req, res) => {
    const { categoria, ano } = req.params;
    
    // Lista de URLs para tentar na ordem de prioridade
    const urlsParaTestar = [
        `https://www.ifpb.edu.br/campus/cajazeiras/editais/${categoria}/${ano}`,
        `https://www.ifpb.edu.br/campus/cajazeiras/editais/${categoria}/${ano}-1`
    ];

    console.log(`\n--- Nova busca iniciada: ${categoria} / ${ano} ---`);

    for (const url of urlsParaTestar) {
        try {
            console.log(`📡 Tentando buscar em: ${url}`);
            
            const response = await axios.get(url, {
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' 
                },
                timeout: 12000, 
                // Permite que o código trate o 404 sem disparar uma exceção que trava o loop
                validateStatus: (status) => status < 500 
            });

            // Se a página não existir, logamos e usamos o 'continue' para pular para a próxima URL da lista
            if (response.status === 404) {
                console.log(`⚠️ Página não encontrada (404) em: ${url}.`);
                continue; 
            }

            const dom = new JSDOM(response.data);
            const document = dom.window.document;
            const cards = document.querySelectorAll(".listing-item, .tileItem");
            let editaisEncontrados = [];

            if (cards.length > 0) {
                cards.forEach(card => {
                    const linkTag = card.querySelector("a");
                    const tituloTag = card.querySelector(".title, h2, .tileHeadline");
                    
                    if (linkTag && tituloTag) {
                        let href = linkTag.getAttribute("href");
                        const linkCompleto = href.startsWith("http") ? href : `https://www.ifpb.edu.br${href}`;
                        
                        editaisEncontrados.push({
                            nome: tituloTag.textContent.trim().replace(/\s+/g, ' '),
                            link: linkCompleto
                        });
                    }
                });

                if (editaisEncontrados.length > 0) {
                    console.log(`✅ Sucesso! Encontrados ${editaisEncontrados.length} editais.`);
                    return res.json({ editais: editaisEncontrados });
                }
            }
            
            console.log(`ℹ️ Página em ${url} carregada, mas sem editais listados.`);

        } catch (err) {
            // Se houver erro de conexão/timeout, ele loga e o loop segue para a tentativa com "-1"
            console.log(`❌ Erro técnico em ${url}: ${err.message}`);
        }
    }

    // Se percorrer as duas URLs e não encontrar nada
    console.log("❌ Nenhuma das tentativas retornou resultados.");
    res.json({ editais: [] });
});

app.get("/", (req, res) => res.send("API Editais IFPB - Online 🚀"));

app.listen(PORT, () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
});