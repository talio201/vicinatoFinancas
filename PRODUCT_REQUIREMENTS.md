
# Documento de Requisitos do Produto (PRD): Vicinato Finanças

**Versão:** 1.0
**Autor:** Gemini
**Data:** 31 de julho de 2025

---

## 1. Visão Geral e Objetivo

### 1.1. Problema

Muitos indivíduos e, especialmente, casais, têm dificuldade em gerenciar suas finanças de forma colaborativa e eficiente. Ferramentas existentes podem ser complexas, focadas apenas no indivíduo ou carentes de funcionalidades essenciais como o estabelecimento de metas conjuntas e a visualização clara do fluxo de caixa compartilhado.

### 1.2. Solução Proposta

O **Vicinato Finanças** é uma aplicação web intuitiva e segura que visa simplificar o gerenciamento financeiro para indivíduos e casais. A plataforma oferece ferramentas para rastrear despesas e receitas, definir metas de economia e gastos, e fornecer uma visão unificada das finanças do casal, promovendo a transparência e a colaboração financeira.

### 1.3. Público-Alvo

- **Indivíduos:** Pessoas que buscam uma ferramenta simples para controlar suas finanças pessoais.
- **Casais:** Parceiros que desejam gerenciar suas finanças de forma conjunta, com visibilidade compartilhada, mas mantendo o controle individual sobre suas próprias transações.

## 2. Funcionalidades (Features)

### 2.1. Módulo de Autenticação e Usuário

- **[F-01] Cadastro de Usuário:** Novos usuários podem se cadastrar usando e-mail e senha. Um e-mail de confirmação é enviado para verificar a conta.
- **[F-02] Login de Usuário:** Usuários registrados podem acessar a plataforma com suas credenciais.
- **[F-03] Perfil de Usuário:** Usuários podem visualizar e editar informações básicas do perfil, como nome e avatar.
- **[F-04] Redefinição de Senha:** Usuários podem solicitar a redefinição de senha através de um link enviado por e-mail.

### 2.2. Módulo de Transações

- **[F-05] Adicionar Transação:** Usuários podem adicionar novas transações, especificando:
  - Tipo (Receita ou Despesa)
  - Valor
  - Categoria (selecionada de uma lista padrão ou personalizada)
  - Descrição (opcional)
  - Data
- **[F-06] Editar Transação:** Todas as informações de uma transação podem ser editadas.
- **[F-07] Remover Transação:** Usuários podem remover transações.
- **[F-08] Listar Transações:** As transações são listadas em uma visualização paginada, com filtros por tipo, categoria e período.

### 2.3. Módulo de Dashboard

- **[F-09] Dashboard Individual:** Apresenta um resumo visual das finanças do usuário logado, incluindo:
  - Balanço do mês (Receitas vs. Despesas).
  - Gráfico de despesas por categoria.
  - Lista das últimas transações.
  - Progresso das metas mensais.
- **[F-10] Dashboard de Casal:** (Disponível após aceitar um convite) Apresenta uma visão consolidada das finanças do casal, com os mesmos componentes do dashboard individual, mas com dados agregados.

### 2.4. Módulo de Metas

- **[F-11] Metas de Gastos por Categoria:** Usuários podem definir um limite de gastos mensal para categorias específicas (ex: não gastar mais de R$ 500 com alimentação).
- **[F-12] Metas de Economia Pessoais:** Usuários podem criar metas de economia de longo prazo (ex: "Viagem para a Europa - R$ 5.000") e acompanhar o progresso.

### 2.5. Módulo de Relacionamento (Casal)

- **[F-13] Enviar Convite:** Um usuário pode enviar um convite para outro através do e-mail para conectar as contas.
- **[F-14] Aceitar/Rejeitar Convite:** O usuário convidado recebe uma notificação e pode aceitar ou rejeitar o convite.
- **[F-15] Visão Compartilhada:** Após a aceitação, os usuários podem visualizar as transações um do outro e acessar o Dashboard de Casal. **Importante:** A permissão é apenas de leitura; um usuário não pode editar ou remover a transação do outro.
- **[F-16] Desconectar Contas:** Qualquer um dos usuários pode encerrar o relacionamento a qualquer momento, removendo o compartilhamento de dados.

### 2.6. Módulo de Configurações

- **[F-17] Gerenciar Categorias:** Usuários podem adicionar, editar e remover suas próprias categorias de transação.
- **[F-18] Alternar Tema:** Usuários podem alternar entre o tema claro e escuro.

## 3. Requisitos Não-Funcionais

### 3.1. Segurança (Security)

- **[NF-01] Privacidade de Dados:** Os dados de um usuário não devem ser acessíveis por nenhum outro usuário, exceto por um parceiro conectado e apenas para leitura, conforme definido pelas políticas de RLS.
- **[NF-02] Proteção contra Ataques Comuns:** A aplicação deve ser protegida contra vulnerabilidades web comuns, incluindo XSS (Cross-Site Scripting), CSRF (Cross-Site Request Forgery) e Injeção de SQL.
- **[NF-03] Senhas Seguras:** O sistema deve exigir senhas com um nível de complexidade mínimo (8+ caracteres, incluindo maiúsculas, minúsculas, números e símbolos).
- **[NF-04] Headers de Segurança:** A API backend deve implementar headers de segurança (via `helmet`) para mitigar riscos.
- **[NF-05] CORS Restrito:** A política de CORS deve permitir solicitações apenas de domínios autorizados.

### 3.2. Usabilidade e Design

- **[NF-06] Responsividade:** A interface deve ser totalmente responsiva e funcional em dispositivos móveis, tablets e desktops.
- **[NF-07] Intuitividade:** A navegação e as ações do usuário devem ser claras e intuitivas, exigindo o mínimo de esforço para realizar tarefas comuns.
- **[NF-08] Feedback ao Usuário:** A aplicação deve fornecer feedback claro para as ações do usuário (ex: mensagens de sucesso, erro, estado de carregamento).

### 3.3. Desempenho (Performance)

- **[NF-09] Carregamento Rápido:** A aplicação deve ter um tempo de carregamento inicial rápido.
- **[NF-10] Consultas Otimizadas:** As consultas ao banco de dados devem ser eficientes, utilizando índices para garantir um bom desempenho mesmo com um grande volume de transações.

## 4. Fluxos de Usuário (Exemplos)

### 4.1. Fluxo de Cadastro de Nova Transação

1.  Usuário clica no botão "Nova Transação".
2.  Preenche o formulário com tipo, valor, categoria, etc.
3.  Clica em "Salvar".
4.  O sistema valida os dados.
5.  A transação é salva e o usuário é redirecionado para o Dashboard, que agora reflete a nova transação.

### 4.2. Fluxo de Conexão de Contas de Casal

1.  **Usuário A** navega para a página "Casal".
2.  Insere o e-mail do **Usuário B** e clica em "Convidar".
3.  **Usuário B** recebe uma notificação (in-app ou por e-mail).
4.  **Usuário B** acessa a página "Casal" e vê o convite pendente.
5.  **Usuário B** clica em "Aceitar".
6.  A conexão é estabelecida. Ambos os usuários agora podem ver o Dashboard de Casal e as transações um do outro.

