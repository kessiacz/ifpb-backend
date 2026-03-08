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
    const url = `https://www.ifpb.edu.br/campus/cajazeiras/editais/${categoria}/${ano}`;

    try {
        console.log(`Tentando acessar: ${url}`);
        
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const dom = new JSDOM(response.data);
        const document = dom.window.document;
        
        const cards = document.querySelectorAll(".listing-item"); 
        const editais = [];

        cards.forEach(card => {
            const linkTag = card.querySelector("a");
            const tituloTag = card.querySelector(".title");
            
            if (linkTag && tituloTag) {
                let href = linkTag.getAttribute("href");
                const linkCompleto = href.startsWith("http") ? href : `https://www.ifpb.edu.br${href}`;
                
                editais.push({
                    nome: tituloTag.textContent.trim(),
                    link: linkCompleto
                });
            }
        });

        console.log(`Encontrados ${editais.length} editais.`);
        res.json({ editais });

    } catch (err) {
        console.error("Erro ao buscar no IFPB:", err.message);
        // Evita enviar resposta duplicada se o erro ocorrer após o res.json
        if (!res.headersSent) {
            res.status(500).json({ editais: [], error: "Erro na extração dos dados." });
        }
    }
});

app.listen(PORT, () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
});