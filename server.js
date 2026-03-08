const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { JSDOM } = require("jsdom");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Função para buscar editais em uma URL
async function buscarEditaisNaUrl(url) {
    try {
        const response = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' 
            },
            timeout: 12000,
            validateStatus: (status) => status < 500
        });

        if (response.status === 404) return [];

        const dom = new JSDOM(response.data);
        const document = dom.window.document;
        const cards = document.querySelectorAll(".listing-item, .tileItem");
        const editaisEncontrados = [];

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

        return editaisEncontrados;

    } catch (err) {
        console.log(`Erro ao buscar em ${url}: ${err.message}`);
        return [];
    }
}

// Rota de editais com fallback automático
app.get("/editais/:categoria/:ano", async (req, res) => {
    const { categoria, ano } = req.params;
    console.log(`\n--- Buscando editais: ${categoria} / ${ano} ---`);

    // Tenta primeiro o ano normal
    let urls = [`https://www.ifpb.edu.br/campus/cajazeiras/editais/${categoria}/${ano}`];

    // Se o ano não termina com "-1", adiciona tentativa com "-1" automaticamente
    if (!ano.endsWith("-1")) urls.push(`https://www.ifpb.edu.br/campus/cajazeiras/editais/${categoria}/${ano}-1`);

    for (const url of urls) {
        const editais = await buscarEditaisNaUrl(url);
        if (editais.length > 0) {
            console.log(`Encontrados ${editais.length} editais em: ${url}`);
            return res.json({ editais });
        } else {
            console.log(`Nenhum edital encontrado em: ${url}`);
        }
    }

    // Nenhum resultado
    console.log(`Nenhum edital encontrado para ${ano} ou ${ano}-1`);
    return res.json({ editais: [] });
});

app.get("/", (req, res) => res.send("API Editais IFPB - Online 🚀"));

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});