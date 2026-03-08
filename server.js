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
    
    // Lista de prioridade: tenta o normal, se falhar, tenta o -1
    const urlsParaTestar = [
        `https://www.ifpb.edu.br/campus/cajazeiras/editais/${categoria}/${ano}`,
        `https://www.ifpb.edu.br/campus/cajazeiras/editais/${categoria}/${ano}-1`
    ];

    let editaisEncontrados = [];

    for (const url of urlsParaTestar) {
        try {
            console.log(`📡 Tentando buscar em: ${url}`);
            
            const response = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 10000 // Aumentamos para 10s porque o IFPB é lento
            });

            const dom = new JSDOM(response.data);
            const document = dom.window.document;
            const cards = document.querySelectorAll(".listing-item, .tileItem");

            if (cards.length > 0) {
                cards.forEach(card => {
                    const linkTag = card.querySelector("a");
                    const tituloTag = card.querySelector(".title, h2, .tileHeadline");
                    
                    if (linkTag && tituloTag) {
                        let href = linkTag.getAttribute("href");
                        editaisEncontrados.push({
                            nome: tituloTag.textContent.trim(),
                            link: href.startsWith("http") ? href : `https://www.ifpb.edu.br${href}`
                        });
                    }
                });

                if (editaisEncontrados.length > 0) {
                    console.log(`✅ Sucesso! Encontrados ${editaisEncontrados.length} editais em ${url}`);
                    return res.json({ editais: editaisEncontrados }); // Retorna e sai da função
                }
            }
        } catch (err) {
            // Aqui está o segredo: se der erro (404), ele apenas loga e CONTINUA o loop para a próxima URL
            console.log(`⚠️ URL ${url} falhou (Erro: ${err.response ? err.response.status : err.message}). Tentando a próxima...`);
        }
    }

    // Se saiu do loop e não retornou nada, é porque ambas falharam
    console.log("❌ Nenhuma das URLs retornou resultados.");
    res.json({ editais: [] });
});

app.listen(PORT, () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
});