const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { JSDOM } = require("jsdom");

const app = express();
// O Render exige process.env.PORT para funcionar na nuvem
const PORT = process.env.PORT || 3000; 

app.use(cors());
app.use(express.json());

app.get("/editais/:categoria/:ano", async (req, res) => {
    const { categoria, ano } = req.params;
    
    // Lista de URLs para tentar (Padrão e a variação que você descobriu)
    const urlsParaTestar = [
        `https://www.ifpb.edu.br/campus/cajazeiras/editais/${categoria}/${ano}`,
        `https://www.ifpb.edu.br/campus/cajazeiras/editais/${categoria}/${ano}-1`
    ];

    let editais = [];

    for (const url of urlsParaTestar) {
        try {
            console.log(`Tentando conexão em: ${url}`);
            const response = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 5000 // 5 segundos para não travar o Render
            });

            const dom = new JSDOM(response.data);
            const document = dom.window.document;
            const cards = document.querySelectorAll(".listing-item");

            if (cards.length > 0) {
                cards.forEach(card => {
                    const linkTag = card.querySelector("a");
                    const tituloTag = card.querySelector(".title, h2");
                    
                    if (linkTag && tituloTag) {
                        let href = linkTag.getAttribute("href");
                        const linkCompleto = href.startsWith("http") ? href : `https://www.ifpb.edu.br${href}`;
                        editais.push({
                            nome: tituloTag.textContent.trim(),
                            link: linkCompleto
                        });
                    }
                });
                
                // Se encontrou editais nesta URL, interrompe o loop e retorna
                console.log(`✅ Sucesso em ${url}: ${editais.length} itens encontrados.`);
                break; 
            }
        } catch (err) {
            console.log(`⚠️ Falha na URL ${url}: ${err.message}`);
            // Continua para a próxima tentativa no loop
        }
    }

    res.json({ editais });
});

app.listen(PORT, () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
});