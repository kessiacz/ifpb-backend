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
    
    // Tenta primeiro a versão com -1, depois a normal
    const urlsParaTestar = [
        `https://www.ifpb.edu.br/campus/cajazeiras/editais/${categoria}/${ano}`
        `https://www.ifpb.edu.br/campus/cajazeiras/editais/${categoria}/${ano}-1`,
    ];

    let editais = [];

    for (const url of urlsParaTestar) {
        try {
            console.log(`Buscando em: ${url}`);
            const response = await axios.get(url, {
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html'
                },
                timeout: 8000 
            });

            const dom = new JSDOM(response.data);
            const document = dom.window.document;
            
            // O seletor .tileItem é muito comum no sistema Plone do IFPB
            const cards = document.querySelectorAll(".listing-item, .tileItem");

            if (cards.length > 0) {
                cards.forEach(card => {
                    const linkTag = card.querySelector("a");
                    const tituloTag = card.querySelector(".title, h2, .tileHeadline");
                    
                    if (linkTag && tituloTag) {
                        let href = linkTag.getAttribute("href");
                        const linkCompleto = href.startsWith("http") ? href : `https://www.ifpb.edu.br${href}`;
                        
                        editais.push({
                            nome: tituloTag.textContent.trim().replace(/\n/g, ' '),
                            link: linkCompleto
                        });
                    }
                });
                
                if (editais.length > 0) break; 
            }
        } catch (err) {
            console.log(`Sem sucesso em ${url}`);
        }
    }

    // Se após tentar todas as URLs não houver nada, retorna lista vazia
    res.json({ editais });
});

app.listen(PORT, () => {
    console.log(`✅ Servidor ativo na porta ${PORT}`);
});