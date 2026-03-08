const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { JSDOM } = require("jsdom");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Rota corrigida para bater com o seu fetch
app.get("/editais/:categoria/:ano?", async (req, res) => {
    const { categoria, ano } = req.params;
    
    // URL base do IFPB Cajazeiras
    let url = `https://www.ifpb.edu.br/campus/cajazeiras/editais/${categoria}`;
    if (ano) url += `/${ano}`;

    try {
        console.log(`Buscando: ${url}`);
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        const dom = new JSDOM(data);
        const document = dom.window.document;
        const cards = document.querySelectorAll(".listing-item.edital-listing");
        const editais = [];

        cards.forEach(card => {
            const linkTag = card.querySelector("a");
            const tituloTag = card.querySelector("h2.title");
            
            if (linkTag && tituloTag) {
                let href = linkTag.getAttribute("href");
                // Converte link relativo em link completo
                const linkCompleto = href.startsWith("http") ? href : `https://www.ifpb.edu.br${href}`;
                
                editais.push({
                    nome: tituloTag.textContent.trim(),
                    link: linkCompleto
                });
            }
        });

        res.json({ editais });
    } catch (err) {
        console.error("Erro no servidor:", err.message);
        res.status(500).json({ editais: [], error: "Erro ao buscar editais." });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});