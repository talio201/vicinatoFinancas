
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// --- Configuração de Ambiente e Clientes Supabase ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error("Variáveis de ambiente Supabase não estão definidas.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const app = express();
const port = process.env.PORT || 3001;

// --- Configuração de Segurança ---
const allowedOrigins = [
  'https://talio201.github.io'
  // Adicione aqui a URL do seu frontend em produção
  // Ex: 'https://meu-app-financeiro.com'
];

app.use(helmet());
app.use(cors());
app.use(express.json());

// --- Middleware de Validação ---
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    res.status(400).json({ error: 'Dados de entrada inválidos.', details: err.errors });
  }
};

// --- Middleware de Autenticação ---
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autorização ausente ou mal formatado.' });
  }

  const token = authHeader.split(' ')[1];
  const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error } = await userSupabase.auth.getUser();

  if (error || !user) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }

  req.user = user;
  req.supabase = userSupabase;
  next();
};

// --- Schemas de Validação Zod ---
const transactionSchema = z.object({
  body: z.object({
    type: z.enum(['income', 'expense']),
    amount: z.number().positive(),
    category_id: z.string().uuid(),
    description: z.string().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
});

const goalSchema = z.object({
  body: z.object({
    category_id: z.string().uuid(),
    amount: z.number().positive(),
    month: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  }),
});

const personalGoalSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    target_amount: z.number().positive(),
    current_amount: z.number().min(0).optional(),
  }),
});

const personalGoalUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    target_amount: z.number().positive(),
    current_amount: z.number().min(0),
  }),
});

const scheduledTransactionUpdateSchema = z.object({
  body: z.object({
    type: z.enum(['income', 'expense']),
    amount: z.number().positive(),
    category_id: z.string().uuid(),
    description: z.string().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    status: z.enum(['scheduled', 'completed', 'cancelled']),
  }),
});

const profileUpdateSchema = z.object({
  body: z.object({
    full_name: z.string().min(1).optional(),
    avatar_url: z.string().url().optional(),
  }),
});

const coupleRequestSchema = z.object({
  body: z.object({
    partner_email: z.string().email(),
  }),
});

const passwordResetSchema = z.object({
  body: z.object({
    new_password: z.string().min(8), // Exigir senha forte
  }),
});

const budgetSchema = z.object({
  body: z.object({
    category_id: z.string().uuid(),
    budget_amount: z.number().positive(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
});

const reportQuerySchema = z.object({
  query: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    category: z.string().optional(),
  }),
});

// --- Rotas da API ---

// Rota de Teste
app.get('/', (req, res) => {
  res.send('API Vicinato Finanças está no ar!');
});

// Rotas de Transações
app.post('/api/transactions', authenticate, validate(transactionSchema), async (req, res) => {
  const { type, amount, category_id, description, date } = req.body;
  const { id: userId } = req.user;

  console.log('Received transaction data:', req.body);

  const transactionDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const table = transactionDate > today ? 'scheduled_transactions' : 'transactions';
  
  const { data, error } = await req.supabase
    .from(table)
    .insert({ user_id: userId, type, amount, category_id, description, date })
    .select()
    .single();

  if (error) {
    console.error('Erro ao adicionar transação:', error.message);
    return res.status(500).json({ error: 'Não foi possível adicionar a transação.' });
  }
  res.status(201).json(data);
});

app.get('/api/transactions', authenticate, async (req, res) => {
  // A validação de query params pode ser adicionada aqui se necessário
  const { id: userId } = req.user;
  const { type, category_id, startDate, endDate, scope } = req.query;

  let query = req.supabase.from('transactions').select(`
    *,
    categories(name)
  `);

  // Se o escopo não for de casal, filtramos apenas para o usuário logado.
  // Se for de casal, a RLS cuidará de retornar as transações do parceiro.
  if (scope !== 'couple') {
    query = query.eq('user_id', userId);
  }

  if (type) query = query.eq('type', type);
  if (category_id) query = query.eq('category_id', category_id);
  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);

  const { data, error } = await query.order('date', { ascending: false });

  if (error) {
    console.error('Erro ao buscar transações:', error);
    return res.status(500).json({ error: 'Não foi possível buscar as transações.', details: error });
  }
  res.status(200).json(data);
});

app.delete('/api/transactions/:id', authenticate, async (req, res) => {
  const { id: transactionId } = req.params;

  const { error } = await req.supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId); // RLS já garante que o usuário só pode deletar o que é seu

  if (error) {
    console.error('Erro ao deletar transação:', error.message);
    return res.status(500).json({ error: 'Não foi possível deletar a transação.' });
  }
  res.status(204).send();
});

app.put('/api/transactions/:id', authenticate, validate(transactionSchema), async (req, res) => {
  const { id: transactionId } = req.params;
  
  const { data, error } = await req.supabase
    .from('transactions')
    .update(req.body)
    .eq('id', transactionId) // RLS garante a segurança
    .select(`
      *,
      categories(name)
    `)
    .single();

  if (error) {
    console.error('Erro ao atualizar transação:', error.message);
    return res.status(500).json({ error: 'Não foi possível atualizar a transação.' });
  }
  res.status(200).json({ message: 'Transação atualizada com sucesso!', transaction: data });
});

// Rotas de Categorias
app.get('/api/categories', authenticate, async (req, res) => {
  const { id: userId } = req.user;

  const { data, error } = await req.supabase
    .from('categories')
    .select('*')
    .or(`user_id.eq.${userId},user_id.is.null`);

  if (error) {
    console.error('Erro ao buscar categorias:', error.message);
    return res.status(500).json({ error: 'Não foi possível buscar as categorias.' });
  }
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(200).json(data);
});

// Rotas de Metas (Goals)
app.get('/api/goals', authenticate, async (req, res) => {
    const { id: userId } = req.user;
    const { month } = req.query;

    if (!month) {
        return res.status(400).json({ error: 'O parâmetro "month" é obrigatório.' });
    }

    console.log('Supabase query for goals:', `from('goals').select('id, user_id, category_id, amount, month, created_at').eq('user_id', ${userId}).eq('month', ${month})`);
    const { data, error } = await req.supabase
        .from('goals')
        .select('id, user_id, category_id, amount, month, created_at')
        .eq('user_id', userId)
        .eq('month', month);

    if (error) {
        console.error('Erro ao buscar metas:', error.message);
        return res.status(500).json({ error: 'Não foi possível buscar as metas.' });
    }
    res.status(200).json(data);
});

app.post('/api/goals', authenticate, validate(goalSchema), async (req, res) => {
    const { id: userId } = req.user;
    const { category, amount, month } = req.body;

    const { data, error } = await req.supabase
        .from('goals')
        .upsert({ user_id: userId, category, amount, month }, { onConflict: 'user_id,category,month' })
        .select('id, user_id, category_id, amount, month, created_at')
        .single();

    if (error) {
        console.error('Erro ao salvar meta:', error.message);
        return res.status(500).json({ error: 'Não foi possível salvar a meta.' });
    }
    res.status(201).json({ message: 'Meta salva com sucesso!', goal: data });
});

app.delete('/api/goals/:id', authenticate, async (req, res) => {
    const { id: goalId } = req.params;

    const { error } = await req.supabase
        .from('goals')
        .delete()
        .eq('id', goalId); // RLS garante a segurança

    if (error) {
        console.error('Erro ao deletar meta:', error.message);
        return res.status(500).json({ error: 'Não foi possível deletar a meta.' });
    }
    res.status(204).send();
});

// Rotas de Metas Pessoais (Personal Goals)
app.get('/api/personal-goals', authenticate, async (req, res) => {
    const { data, error } = await req.supabase.from('personal_goals').select('id, user_id, name, target_amount, current_amount, created_at, updated_at'); // RLS cuida do filtro

    if (error) {
        console.error('Erro ao buscar metas pessoais:', error.message);
        return res.status(500).json({ error: 'Não foi possível buscar as metas pessoais.' });
    }
    res.status(200).json(data);
});

app.post('/api/personal-goals', authenticate, validate(personalGoalSchema), async (req, res) => {
    const { id: userId } = req.user;
    const { name, target_amount, current_amount } = req.body;

    const { data, error } = await req.supabase
        .from('personal_goals')
        .insert({ user_id: userId, name, target_amount, current_amount })
        .select()
        .single();

    if (error) {
        console.error('Erro ao criar meta pessoal:', error.message);
        return res.status(500).json({ error: 'Não foi possível criar a meta pessoal.' });
    }
    res.status(201).json({ message: 'Meta pessoal criada com sucesso!', goal: data });
});

app.put('/api/personal-goals/:id', authenticate, validate(personalGoalUpdateSchema), async (req, res) => {
    const { id: goalId } = req.params;

    const { data, error } = await req.supabase
        .from('personal_goals')
        .update(req.body)
        .eq('id', goalId) // RLS garante a segurança
        .select()
        .single();

    if (error) {
        console.error('Erro ao atualizar meta pessoal:', error.message);
        return res.status(500).json({ error: 'Não foi possível atualizar a meta pessoal.' });
    }
    res.status(200).json({ message: 'Meta pessoal atualizada com sucesso!', goal: data });
});

app.delete('/api/personal-goals/:id', authenticate, async (req, res) => {
    const { id: goalId } = req.params;

    const { error } = await req.supabase
        .from('personal_goals')
        .delete()
        .eq('id', goalId); // RLS garante a segurança

    if (error) {
        console.error('Erro ao deletar meta pessoal:', error.message);
        return res.status(500).json({ error: 'Não foi possível deletar a meta pessoal.' });
    }
    res.status(204).send();
});

// Rotas de Transações Agendadas
app.get('/api/scheduled-transactions', authenticate, async (req, res) => {
  // Validação de query params pode ser adicionada aqui
  const { data, error } = await req.supabase.from('scheduled_transactions').select(`
    *,
    categories(name)
  `);

  if (error) {
    console.error('Erro ao buscar transações agendadas:', error.message);
    return res.status(500).json({ error: 'Não foi possível buscar as transações agendadas.' });
  }
  res.status(200).json(data);
});

app.put('/api/scheduled-transactions/:id', authenticate, validate(scheduledTransactionUpdateSchema), async (req, res) => {
  const { id: transactionId } = req.params;

  const { data, error } = await req.supabase
    .from('scheduled_transactions')
    .update(req.body)
    .eq('id', transactionId) // RLS garante a segurança
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar transação agendada:', error.message);
    return res.status(500).json({ error: 'Não foi possível atualizar a transação agendada.' });
  }
  res.status(200).json({ message: 'Transação agendada atualizada com sucesso!', transaction: data });
});

app.delete('/api/scheduled-transactions/:id', authenticate, async (req, res) => {
  const { id: transactionId } = req.params;

  const { error } = await req.supabase
    .from('scheduled_transactions')
    .delete()
    .eq('id', transactionId); // RLS garante a segurança

  if (error) {
    console.error('Erro ao deletar transação agendada:', error.message);
    return res.status(500).json({ error: 'Não foi possível deletar a transação agendada.' });
  }
  res.status(204).send();
});

// Rotas de Perfil
app.get('/api/profile', authenticate, async (req, res) => {
  const { data, error } = await req.supabase.from('profiles').select('full_name, avatar_url').single();

  if (error && error.code !== 'PGRST116') { // Ignora erro de "0 rows"
    console.error('Erro ao buscar perfil:', error.message);
    return res.status(500).json({ error: 'Não foi possível buscar o perfil.' });
  }
  res.status(200).json(data);
});

app.put('/api/profile', authenticate, validate(profileUpdateSchema), async (req, res) => {
  const { data, error } = await req.supabase
    .from('profiles')
    .update(req.body)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar perfil:', error.message);
    return res.status(500).json({ error: 'Não foi possível atualizar o perfil.' });
  }
  res.status(200).json({ message: 'Perfil atualizado com sucesso!', profile: data });
});

// Rotas de Relacionamento de Casal
app.post('/api/couple-relationships/request', authenticate, validate(coupleRequestSchema), async (req, res) => {
  const { id: userId } = req.user;
  const { partner_email } = req.body;

  const { data: partnerId, error: rpcError } = await req.supabase
    .rpc('get_user_id_by_email', { user_email: partner_email });

  if (rpcError || !partnerId) {
    return res.status(404).json({ error: 'Parceiro não encontrado.' });
  }
  
  if (userId === partnerId) {
    return res.status(400).json({ error: 'Você não pode enviar um pedido para si mesmo.' });
  }

  // Usar supabaseAdmin para verificar/criar perfil do parceiro
  const { error: profileError } = await supabaseAdmin.from('profiles').select('id').eq('id', partnerId).single();
  if (profileError && profileError.code === 'PGRST116') {
      const { error: insertError } = await supabaseAdmin.from('profiles').insert({ id: partnerId, full_name: partner_email.split('@')[0] });
      if (insertError) {
          console.error('Erro ao criar perfil para parceiro:', insertError.message);
          return res.status(500).json({ error: 'Não foi possível configurar o parceiro.' });
      }
  }

  const { data, error } = await req.supabase
    .from('couple_relationships')
    .insert({ user1_id: userId, user2_id: partnerId, status: 'pending' })
    .select()
    .single();

  if (error) {
    // Código '23505' é violação de constraint unique, significa que já existe
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Um relacionamento ou pedido já existe com este usuário.' });
    }
    console.error('Erro ao enviar pedido de conexão:', error.message);
    return res.status(500).json({ error: 'Não foi possível enviar o pedido de conexão.' });
  }
  res.status(201).json({ message: 'Pedido de conexão enviado com sucesso!', relationship: data });
});

app.put('/api/couple-relationships/:id/accept', authenticate, async (req, res) => {
  const { id: relationshipId } = req.params;
  const { id: userId } = req.user;

  const { data, error } = await req.supabase
    .from('couple_relationships')
    .update({ status: 'accepted' })
    .eq('id', relationshipId)
    .eq('user2_id', userId) // Apenas o destinatário pode aceitar
    .select()
    .single();

  if (error || !data) {
    console.error('Erro ao aceitar pedido:', error ? error.message : 'Pedido não encontrado');
    return res.status(404).json({ error: 'Pedido não encontrado ou permissão negada.' });
  }
  res.status(200).json({ message: 'Pedido aceito com sucesso!', relationship: data });
});

// Rotas de Relacionamento de Casal
app.get('/api/couple-relationships', authenticate, async (req, res) => {
  const { id: userId } = req.user;

  const { data, error } = await req.supabase
    .from('couple_relationships')
    .select(`
      *,
      user1_profile:user1_id(full_name),
      user2_profile:user2_id(full_name)
    `)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

  if (error) {
    console.error('Erro ao buscar relacionamentos de casal:', error.message);
    return res.status(500).json({ error: 'Não foi possível buscar os relacionamentos de casal.' });
  }
  res.status(200).json(data);
});

// Rotas de Orçamentos
app.post('/api/budgets', authenticate, validate(budgetSchema), async (req, res) => {
  const { id: userId } = req.user;
  const { category_id, budget_amount, start_date, end_date } = req.body;

  const { data, error } = await req.supabase
    .from('budgets')
    .insert({ user_id: userId, category_id, budget_amount, start_date, end_date })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar orçamento:', error.message);
    return res.status(500).json({ error: 'Não foi possível criar o orçamento.' });
  }
  res.status(201).json({ message: 'Orçamento criado com sucesso!', budget: data });
});

app.get('/api/budgets', authenticate, async (req, res) => {
  const { id: userId } = req.user;
  const { category_id, start_date, end_date } = req.query;

  let query = req.supabase.from('budgets').select('*');

  if (category_id) query = query.eq('category_id', category_id);
  if (start_date) query = query.gte('start_date', start_date);
  if (end_date) query = query.lte('end_date', end_date);

  const { data, error } = await query.order('start_date', { ascending: false });

  if (error) {
    console.error('Erro ao buscar orçamentos:', error.message);
    return res.status(500).json({ error: 'Não foi possível buscar os orçamentos.' });
  }
  res.status(200).json(data);
});

app.put('/api/budgets/:id', authenticate, validate(budgetSchema), async (req, res) => {
  const { id: budgetId } = req.params;

  const { data, error } = await req.supabase
    .from('budgets')
    .update(req.body)
    .eq('id', budgetId)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar orçamento:', error.message);
    return res.status(500).json({ error: 'Não foi possível atualizar o orçamento.' });
  }
  res.status(200).json({ message: 'Orçamento atualizado com sucesso!', budget: data });
});

app.delete('/api/budgets/:id', authenticate, async (req, res) => {
  const { id: budgetId } = req.params;

  const { error } = await req.supabase
    .from('budgets')
    .delete()
    .eq('id', budgetId);

  if (error) {
    console.error('Erro ao deletar orçamento:', error.message);
    return res.status(500).json({ error: 'Não foi possível deletar o orçamento.' });
  }
  res.status(204).send();
});

// ... (outras rotas de relacionamento de casal podem ser adicionadas aqui) ...

// Rota de Auth
app.post('/api/auth/reset-password', authenticate, validate(passwordResetSchema), async (req, res) => {
  const { new_password } = req.body;
  const { error } = await req.supabase.auth.updateUser({ password: new_password });

  if (error) {
    console.error('Erro ao redefinir senha:', error.message);
    return res.status(500).json({ error: 'Não foi possível redefinir a senha.' });
  }
  res.status(200).json({ message: 'Senha redefinida com sucesso!' });
});

// Rotas de Relatórios e Análises
app.get('/api/reports/expenses-by-category', authenticate, validate(reportQuerySchema), async (req, res) => {
  const { id: userId } = req.user;
  const { startDate, endDate } = req.query;

  let query = req.supabase
    .from('transactions')
    .select('category_id, amount, categories(name)')
    .eq('user_id', userId)
    .eq('type', 'expense');

  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar despesas por categoria:', error.message);
    return res.status(500).json({ error: 'Não foi possível buscar despesas por categoria.' });
  }

  const expensesByCategory = data.reduce((acc, transaction) => {
    const categoryName = transaction.categories?.name || 'Desconhecida';
    acc[categoryName] = (acc[categoryName] || 0) + transaction.amount;
    return acc;
  }, {});

  res.status(200).json(expensesByCategory);
});

// Rotas de Relatórios e Análises
app.get('/api/reports/expenses-by-category', authenticate, validate(reportQuerySchema), async (req, res) => {
  const { id: userId } = req.user;
  const { startDate, endDate } = req.query;

  let query = req.supabase
    .from('transactions')
    .select('category_id, amount, categories(name)')
    .eq('user_id', userId)
    .eq('type', 'expense');

  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar despesas por categoria:', error.message);
    return res.status(500).json({ error: 'Não foi possível buscar despesas por categoria.' });
  }

  const expensesByCategory = data.reduce((acc, transaction) => {
    const categoryName = transaction.categories?.name || 'Desconhecida';
    acc[categoryName] = (acc[categoryName] || 0) + transaction.amount;
    return acc;
  }, {});

  res.status(200).json(expensesByCategory);
});

// Rota para o Dashboard de Casal
app.get('/api/couple-dashboard', authenticate, async (req, res) => {
  const { id: userId } = req.user;

  try {
    // 1. Encontrar o relacionamento de casal
    const { data: relationshipData, error: relationshipError } = await req.supabase
      .from('couple_relationships')
      .select('user1_id, user2_id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('status', 'accepted')
      .single();

    if (relationshipError && relationshipError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Erro ao buscar relacionamento de casal:', relationshipError.message);
      return res.status(500).json({ error: 'Não foi possível buscar o relacionamento de casal.' });
    }

    let partnerId = null;
    if (relationshipData) {
      partnerId = relationshipData.user1_id === userId ? relationshipData.user2_id : relationshipData.user1_id;
    }

    const userIdsToFetch = [userId];
    if (partnerId) {
      userIdsToFetch.push(partnerId);
    }

    // 2. Buscar transações para os IDs de usuário
    const { data: transactionsData, error: transactionsError } = await req.supabase
      .from('transactions')
      .select('*, categories(name)')
      .in('user_id', userIdsToFetch);

    if (transactionsError) {
      console.error('Erro ao buscar transações para o casal:', transactionsError.message);
      return res.status(500).json({ error: 'Não foi possível buscar as transações do casal.' });
    }

    // 3. Buscar metas para os IDs de usuário
    const { data: goalsData, error: goalsError } = await req.supabase
      .from('goals')
      .select('*')
      .in('user_id', userIdsToFetch);

    if (goalsError) {
      console.error('Erro ao buscar metas para o casal:', goalsError.message);
      return res.status(500).json({ error: 'Não foi possível buscar as metas do casal.' });
    }

    res.status(200).json({
      transactions: transactionsData || [],
      goals: goalsData || [],
    });

  } catch (err) {
    console.error('Erro inesperado no couple-dashboard:', err.message);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// --- Inicialização do Servidor ---
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

export default app;
