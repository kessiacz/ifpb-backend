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
    
    // Ordem de tentativa: primeiro o padrão, depois o sufixo -1
    const urls = [
        `https://www.ifpb.edu.br/campus/cajazeiras/editais/${categoria}/${ano}`,
        `https://www.ifpb.edu.br/campus/cajazeiras/editais/${categoria}/${ano}-1`
    ];

    let editaisEncontrados = [];

    for (const url of urls) {
        try {
            console.log(`Tentando: ${url}`);
            const { data } = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 6000 
            });

            const dom = new JSDOM(data);
            const document = dom.window.document;
            const cards = document.querySelectorAll(".listing-item, .tileItem");

            if (cards.length > 0) {
                cards.forEach(card => {
                    const linkTag = card.querySelector("a");
                    const tituloTag = card.querySelector(".title, h2, .tileHeadline");
                    if (linkTag && tituloTag) {
                        const href = linkTag.getAttribute("href");
                        editaisEncontrados.push({
                            nome: tituloTag.textContent.trim(),
                            link: href.startsWith("http") ? href : `https://www.ifpb.edu.br${href}`
                        });
                    }
                });
                
                if (editaisEncontrados.length > 0) {
                    console.log(`✅ Sucesso em: ${url}`);
                    break; // Para o loop se achar resultados
                }
            }
        } catch (err) {
            console.log(`❌ Falha na URL: ${url}`);
        }
    }

    res.json({ editais: editaisEncontrados });
});

app.listen(PORT, () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
});