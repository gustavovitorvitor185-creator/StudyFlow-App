# StudyFlow

Interface atualizada para React, TypeScript e Vite. O backend da IA continua em Node.js/Express.

## Requisitos

- Node.js 20 ou superior
- Uma chave da API Gemini para usar o assistente

## Iniciar

1. Abra este diretório no terminal e instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env` e preencha `GEMINI_API_KEY`.
3. Em um terminal, inicie o backend com `npm run server`.
4. Em outro terminal, inicie a interface com `npm run dev` e abra o endereço mostrado pelo Vite.

O assistente usa o proxy local do Vite para encaminhar `/api` ao servidor na porta 3000. Para gerar os arquivos de produção, rode `npm run build`; para pré-visualizar a build, use `npm run preview`.

## Dados e contas

Tarefas, matérias, eventos e perfil ficam no `localStorage` deste navegador. A interface reconhece e importa os dados do formato anterior do StudyFlow. A tela de entrada serve como identificação local do perfil, não como autenticação segura para publicação. Para disponibilizar o produto publicamente, conecte cadastro e login a um provedor de autenticação e banco de dados.

Nunca publique sua chave Gemini. O arquivo `.env` é ignorado pelo Git; `.env.example` contém apenas os nomes das configurações.
