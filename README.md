# Vicinato Finanças

O Vicinato Finanças é uma aplicação web moderna para gerenciamento de finanças pessoais e de casais. Ele permite que os usuários controlem suas receitas e despesas, estabeleçam metas financeiras e compartilhem uma visão financeira com um(a) parceiro(a).

## ✨ Funcionalidades Principais

- **Dashboard Financeiro:** Visualize um resumo de suas finanças, incluindo balanço mensal, últimas transações e progresso em direção às metas.
- **Gerenciamento de Transações:** Adicione, edite e remova transações de receita e despesa.
- **Metas Financeiras:** Crie metas de gastos mensais por categoria e metas de economia pessoais.
- **Transações Agendadas:** Agende transações futuras para um planejamento financeiro mais preciso.
- **Gerenciamento de Casal:** Envie um convite para um(a) parceiro(a) e compartilhe a visualização de transações e dashboards.
- **Autenticação Segura:** Sistema de login e cadastro com confirmação por e-mail, e funcionalidade de redefinição de senha.
- **Tema Claro e Escuro:** Interface adaptável para preferência de tema do usuário.
- **Exportação de Dados:** Exporte suas transações para um arquivo CSV.
- **Relatórios Avançados:** Visualize relatórios detalhados de despesas por categoria, receita vs. despesa ao longo do tempo e orçamento vs. real.
- **Notificações em Tempo Real:** Receba notificações instantâneas sobre novas transações, orçamentos e relacionamentos de casal.
- **Detecção de Anomalias (Hipotética):** Identifique padrões de gastos incomuns ou potenciais fraudes (requer integração com API de terceiros).

## 🚀 Stack de Tecnologias

- **Frontend:**
  - **Framework:** React (com TypeScript)
  - **Build Tool:** Vite
  - **Estilização:** UnoCSS (similar ao Tailwind CSS)
  - **Gerenciamento de Estado de Servidor:** TanStack Query
  - **Formulários:** Formik e Yup para validação
  - **Roteamento:** React Router
  - **Gráficos:** React Chart.js 2
  - **Deploy:** gh-pages

- **Backend (BaaS):**
  - **Supabase:** Utilizado para banco de dados (PostgreSQL), autenticação e APIs de dados.
  - **Segurança:** Políticas de Row-Level Security (RLS) para garantir o isolamento e a privacidade dos dados dos usuários.

- **Backend (Customizado):**
  - **Node.js com Express:** Uma API Gateway que fica entre o frontend e o Supabase para adicionar uma camada extra de segurança e lógica de negócios.
  - **Segurança:** `helmet` para headers de segurança, `cors` para proteção de origem e `zod` para validação de schema em todas as rotas.

## ⚙️ Configuração do Ambiente de Desenvolvimento

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm (ou um gerenciador de pacotes compatível)
- Uma conta no [Supabase](https://supabase.com/) para criar seu projeto de backend.

### 1. Configurar o Supabase

1.  Crie um novo projeto no Supabase.
2.  Vá para a seção **SQL Editor** e execute o conteúdo do arquivo `schema.sql` para criar as tabelas, funções e políticas de segurança (RLS).
3.  Vá para **Settings** > **API** e copie os seguintes valores:
    - **Project URL**
    - **Project API keys** (a chave `anon` e a chave `service_role`)
4.  **Habilitar Realtime:** Vá para **Database** > **Realtime** e habilite o Realtime para as tabelas `transactions`, `budgets` e `couple_relationships`.

### 2. Configurar o Backend

1.  Navegue até a pasta `backend`:
    ```bash
    cd backend
    ```
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Crie um arquivo `.env` na raiz da pasta `backend` e adicione as variáveis de ambiente do seu projeto Supabase:
    ```
    SUPABASE_URL=SUA_PROJECT_URL
    SUPABASE_ANON_KEY=SUA_ANON_KEY
    SUPABASE_SERVICE_KEY=SUA_SERVICE_ROLE_KEY
    PORT=3001
    ```

### 3. Configurar o Frontend

1.  Navegue até a pasta `frontend`:
    ```bash
    cd frontend
    ```
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Crie um arquivo `.env` na raiz da pasta `frontend` e adicione as variáveis de ambiente:
    ```
    VITE_SUPABASE_URL=SUA_PROJECT_URL
    VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY
    VITE_API_BASE_URL=http://localhost:3001
    ```

## ▶️ Como Rodar o Projeto

1.  **Iniciar o Backend:**
    -   Abra um terminal na pasta `backend` e rode:
        ```bash
        npm run dev
        ```
    -   O servidor backend estará rodando em `http://localhost:3001`.

2.  **Iniciar o Frontend:**
    -   Abra outro terminal na pasta `frontend` e rode:
        ```bash
        npm run dev
        ```
    -   A aplicação estará disponível em `http://localhost:5173` (ou outra porta, se a 5173 estiver em uso).

## 🚀 Deploy do Projeto

### Deploy do Backend (Vercel)

1.  Certifique-se de ter o [Vercel CLI](https://vercel.com/docs/cli) instalado e configurado.
2.  Na raiz do projeto, rode:
    ```bash
    vercel --prod
    ```
3.  Siga as instruções do Vercel CLI para vincular seu projeto e configurar as variáveis de ambiente do Supabase no Vercel.

### Deploy do Frontend (GitHub Pages)

1.  Certifique-se de ter o `gh-pages` instalado (`npm install gh-pages --save-dev` na pasta `frontend`).
2.  Na pasta `frontend`, rode:
    ```bash
    npm run build
    ```
3.  Em seguida, rode:
    ```bash
    npm run deploy
    ```
    Isso fará o deploy da sua aplicação para `https://<seu-usuario>.github.io/<nome-do-repositorio>/`.

## 🧪 Testes

### Testes de Backend

1.  Navegue até a pasta `backend`:
    ```bash
    cd backend
    ```
2.  Rode os testes:
    ```bash
    npm test
    ```

### Testes de Frontend

1.  Navegue até a pasta `frontend`:
    ```bash
    cd frontend
    ```
2.  Rode os testes:
    ```bash
    npm test
    ```
    Para rodar os testes com interface de usuário:
    ```bash
    npm run test:ui
    ```

## 💡 Melhorias Futuras

- **Integração com APIs Bancárias:** Conectar diretamente com contas bancárias para importação automática de transações.
- **Categorização Inteligente:** Utilizar Machine Learning para sugerir ou categorizar transações automaticamente.
- **Alertas Personalizados:** Notificações configuráveis para limites de gastos, metas alcançadas, etc.
- **Relatórios Personalizados:** Permitir que os usuários criem seus próprios relatórios com base em critérios específicos.
- **Gamificação:** Adicionar elementos de gamificação para incentivar hábitos financeiros saudáveis.
