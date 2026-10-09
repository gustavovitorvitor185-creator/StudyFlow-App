require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = 3000;

// ==============================
// MIDDLEWARES
// ==============================

app.use(cors());
app.use(express.json());

// ==============================
// CONEXÃO COM GEMINI
// ==============================

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// ==============================
// ROTA PRINCIPAL
// ==============================

app.get("/", (req, res) => {
    res.send("StudyFlow AI Backend funcionando!");
});

// ==============================
// FUNÇÃO PARA GERAR RESPOSTA
// ==============================

async function gerarResposta(pergunta) {

    const maxTentativas = 3;

    for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {

        try {

            const response = await ai.models.generateContent({

                model: "gemini-3.5-flash-lite",

                contents: `
Você é o StudyFlow AI, um assistente de estudos integrado ao sistema StudyFlow.

Seu objetivo é ajudar estudantes a aprender de forma clara, simples e prática.

REGRAS:

- Explique os conteúdos de maneira fácil de entender.
- Adapte suas explicações para estudantes do Ensino Médio.
- Quando possível, utilize exemplos práticos.
- Em exercícios, explique o raciocínio passo a passo.
- Não entregue apenas a resposta quando o estudante estiver tentando aprender.
- Em Matemática, mostre os cálculos e explique cada etapa.
- Em Português e Literatura, explique os conceitos com exemplos.
- Em História e Geografia, apresente o contexto de forma simples e organizada.
- Em Ciências, explique os conceitos utilizando exemplos do cotidiano quando possível.
- Em Redação, ajude o estudante a desenvolver e melhorar seus textos.
- Seja objetivo, mas forneça detalhes suficientes para que o estudante realmente compreenda.
- Evite utilizar palavras excessivamente técnicas sem explicá-las.
- Responda sempre em português do Brasil.
- Mantenha um tom amigável, educativo e motivador.
- Organize respostas maiores utilizando títulos, listas e etapas quando isso facilitar a compreensão.
- Nunca invente informações quando não tiver certeza sobre algo.

PERFIL DO ASSISTENTE:

Você faz parte do StudyFlow e sua função é ajudar o estudante a estudar, revisar conteúdos, resolver exercícios e organizar seu aprendizado.

PERGUNTA DO ESTUDANTE:

${pergunta}
`
            });

            return response.text;

        } catch (error) {

            console.error(
                `Tentativa ${tentativa}/${maxTentativas} falhou:`,
                error.status || error.message
            );

            const podeTentarNovamente =
                error.status === 503 ||
                error.status === 429 ||
                error.status === 500;

            if (!podeTentarNovamente || tentativa === maxTentativas) {
                throw error;
            }

            const tempoEspera = tentativa * 2000;

            console.log(
                `Aguardando ${tempoEspera / 1000}s antes de tentar novamente...`
            );

            await new Promise(resolve =>
                setTimeout(resolve, tempoEspera)
            );
        }
    }
}

// ==============================
// API DA IA
// ==============================

app.post("/api/ia", async (req, res) => {

    try {

        const { pergunta } = req.body;

        // Verifica se existe uma pergunta
        if (!pergunta || !pergunta.trim()) {

            return res.status(400).json({
                erro: "Digite uma pergunta."
            });

        }

        // Gera resposta
        const resposta = await gerarResposta(pergunta);

        // Envia resposta para o frontend
        res.json({
            resposta: resposta
        });

    } catch (error) {

        console.error("Erro na IA:", error);

        res.status(500).json({
            erro: "Não foi possível obter uma resposta da IA."
        });
    }
});

// ==============================
// INICIALIZAÇÃO DO SERVIDOR
// ==============================

app.listen(PORT, () => {

    console.log(
        `StudyFlow AI rodando em http://localhost:${PORT}`
    );

});