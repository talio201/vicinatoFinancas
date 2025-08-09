CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone_number TEXT,
  address TEXT,
  birth_date DATE
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type VARCHAR(7) NOT NULL CHECK (type IN ('income', 'expense')),
  amount REAL NOT NULL,
  category_id UUID REFERENCES categories(id) NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE transactions
ADD COLUMN budget_id UUID REFERENCES budgets(id);

CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    category_id UUID REFERENCES categories(id) NOT NULL,
    amount REAL NOT NULL,
    month DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, category_id, month)
);

CREATE TABLE IF NOT EXISTS personal_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  target_amount REAL NOT NULL,
  current_amount REAL DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scheduled_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type VARCHAR(7) NOT NULL CHECK (type IN ('income', 'expense')),
  amount REAL NOT NULL,
  category_id UUID REFERENCES categories(id) NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  category_id UUID REFERENCES categories(id) NOT NULL,
  budget_amount REAL NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, category_id, start_date, end_date)
);

CREATE TABLE IF NOT EXISTS couple_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID REFERENCES auth.users(id) NOT NULL,
  user2_id UUID REFERENCES auth.users(id) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- First drop the trigger that depends on the function
DROP TRIGGER IF EXISTS update_personal_goals_updated_at ON personal_goals;

-- Now we can safely drop the function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Recreate the function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Recreate the trigger
CREATE TRIGGER update_personal_goals_updated_at
BEFORE UPDATE ON personal_goals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow individual read access" ON profiles;
CREATE POLICY "Allow individual read access"
ON profiles FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow full access to own transactions" ON transactions;
CREATE POLICY "Allow full access to own transactions"
ON transactions FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow full access to own scheduled transactions" ON scheduled_transactions;
CREATE POLICY "Allow full access to own scheduled transactions"
ON scheduled_transactions FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow access to personal and global categories" ON categories;
CREATE POLICY "Allow access to personal and global categories"
ON public.categories FOR ALL
USING (
    (user_id = auth.uid()) OR
    (user_id IS NULL)
)
WITH CHECK (
    (user_id = auth.uid()) OR (user_id IS NULL)
);

DROP POLICY IF EXISTS "Allow full access to own goals" ON goals;
CREATE POLICY "Allow full access to own goals"
ON goals FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow full access to own personal goals" ON personal_goals;
CREATE POLICY "Allow full access to own personal goals"
ON personal_goals FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow full access to own scheduled transactions" ON scheduled_transactions;
CREATE POLICY "Allow full access to own scheduled transactions"
ON scheduled_transactions FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow full access to own budgets" ON budgets;
CREATE POLICY "Allow full access to own budgets"
ON budgets FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow full access to own couple relationships" ON couple_relationships;
CREATE POLICY "Allow full access to own couple relationships"
ON couple_relationships FOR ALL
USING (
    (user1_id = auth.uid()) OR
    (user2_id = auth.uid())
)
WITH CHECK (
    (user1_id = auth.uid()) OR
    (user2_id = auth.uid())
);

INSERT INTO categories (name) VALUES ('Alimentação'), ('Moradia'), ('Transporte'), ('Lazer'),
   ('Saúde'), ('Educação'), ('Salário'), ('Presentes'), ('Outros')
ON CONFLICT (name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id_month ON goals(user_id, month);