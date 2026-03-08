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
    
    // Lista de tentativas na ordem correta
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
                timeout: 7000 // Tempo para o IFPB responder
            });

            const dom = new JSDOM(response.data);
            const document = dom.window.document;
            const cards = document.querySelectorAll(".listing-item, .tileItem");

            // Se encontrou algo, processa e para o loop
            if (cards.length > 0) {
                cards.forEach(card => {
                    const linkTag = card.querySelector("a");
                    const tituloTag = card.querySelector(".title, h2, .tileHeadline");
                    
                    if (linkTag && tituloTag) {
                        let href = linkTag.getAttribute("href");
                        const linkCompleto = href.startsWith("http") ? href : `https://www.ifpb.edu.br${href}`;
                        editais.push({
                            nome: tituloTag.textContent.trim(),
                            link: linkCompleto
                        });
                    }
                });
                
                console.log(` Sucesso em ${url}: ${editais.length} itens encontrados.`);
                return res.json({ editais }); // Finaliza a rota enviando os dados
            }
        } catch (err) {
            console.log(`URL falhou ou vazia (${url}). Tentando próxima...`);
            // Se for a última URL da lista e falhou, o loop acaba naturalmente
        }
    }

    // Se chegou aqui, nenhuma URL funcionou
    res.json({ editais: [], mensagem: "Nenhum edital encontrado em nenhuma das rotas." });
});

app.listen(PORT, () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
});