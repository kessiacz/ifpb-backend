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
    const urls = [
        `https://www.ifpb.edu.br/campus/cajazeiras/editais/${categoria}/${ano}`,
        `https://www.ifpb.edu.br/campus/cajazeiras/editais/${categoria}/${ano}-1`
    ];

    for (const url of urls) {
        try {
            const response = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 10000,
                validateStatus: (s) => s < 500
            });

            if (response.status === 404) continue;

            const dom = new JSDOM(response.data);
            const cards = dom.window.document.querySelectorAll(".listing-item, .tileItem");
            let encontrados = [];

            cards.forEach(card => {
                const link = card.querySelector("a");
                const titulo = card.querySelector(".title, h2, .tileHeadline");
                if (link && titulo) {
                    const href = link.getAttribute("href");
                    encontrados.push({
                        nome: titulo.textContent.trim().replace(/\s+/g, ' '),
                        link: href.startsWith("http") ? href : `https://www.ifpb.edu.br${href}`
                    });
                }
            });

            if (encontrados.length > 0) return res.json({ editais: encontrados });
        } catch (e) { console.log("Erro na URL:", url); }
    }
    res.json({ editais: [] });
});

app.listen(PORT, () => console.log(`Servidor na porta ${PORT}`));