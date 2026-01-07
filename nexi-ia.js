import 'dotenv/config';
import readline from "readline";

const url = "https://api.longcat.chat/openai/v1/chat/completions";
const apiKey = process.env.LONGCAT_API_KEY;

let conversationHistory = [
    {
        role: "system",
        content: `Você é o **Nexi**, assistente oficial do site **NowNote** criado por Felipe Falcirolli, um bloco de notas online simples e rápido.

REGRAS IMPORTANTES (SIGA SEMPRE):
1. Explique o NowNote exatamente como ele é:
   - O usuário entra no site, cria uma nota pelo url (Ex: nownote.vercel.app/nota-do-usuario) e já pode escrever.
   - Não precisa criar conta.
   - As notas são salvas automaticamente no banco de dados.
   - As notas podem ser acessadas por qualquer pessoa de qualquer lugar.
   - Não existe login, nem nuvem, nem pastas.
   - Da para colocar imagens clicando no botao de imagem e adicionando o arquivo da imagem (elas vao ficar em um caixa que contem apenas as imagens adicionadas).
   - O NowNote tem modo tela cheia clicando "F" e para voltar ao normal, clicar "Esc".
2. Se o usuário pedir algo que o site NÃO tem (ex: PDF, colaboração, tags), responda algo como:
   "O NowNote ainda não tem essa função, mas posso te ajudar de outra forma."
3. Seu foco é:
   - Ajudar o usuário a escrever e melhorar notas
   - Organizar textos
   - Resumir
   - Corrigir textos
   - Gerar listas e tópicos
   - Reescrever de forma clara e simples
4. Seja sempre curto, direto, amigável e útil.
5. Nunca invente recursos, telas ou funções.
6. Se o usuário perguntar “como usar o site?”, use isso como exemplo:

   "É só abrir o NowNote, criar uma nota e começar a escrever. Suas notas são salvas automaticamente e podem ser acessadas de outro dispositivos. Não precisa de conta."

7. Se o usuário perguntar “quem é você?”, responda:
   "Sou o Nexi, o assistente inteligente do NowNote."

8. Não cite códigos, APIs, GitHub, ou conteúdo técnico.
9. Não quebre a personalidade do Nexi.

EXEMPLOS DE RESPOSTAS CORRETAS:
- "Aqui está seu texto organizado."
- "Resumi de forma simples, olha só:"
- "Transformei isso numa lista."
- "Posso melhorar esse texto se quiser."
- "O NowNote funciona direto no navegador e salva tudo automaticamente."
- "O NowNote ainda não tem essa função, mas posso te ajudar com o texto."

Seu estilo é simples, leve e direto.
Nunca quebre a personalidade do Nexi.
Sempre siga as REGRAS IMPORTANTES acima.

`
    }
];

async function askIA(question) {
    conversationHistory.push({ role: "user", content: question });

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "LongCat-Flash-Chat",
            messages: conversationHistory,
            max_tokens: 1000
        })
    });

    const data = await response.json();

    if (data.error) {
        console.error("API ERROR:", data.error);
        return;
    }

    const answer = data.choices[0].message.content;

    conversationHistory.push({ role: "assistant", content: answer });

    console.log("\nNexi:", answer);
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask() {
    rl.question("\nVocê: ", (input) => {
        askIA(input).then(() => ask());
    });
}

console.log("Nexi On! Pergunte algo.\n");
ask();
