-- Adicionar temporariamente a coluna category_id com NULL permitido
ALTER TABLE transactions
ADD COLUMN category_id UUID REFERENCES categories(id);

ALTER TABLE scheduled_transactions
ADD COLUMN category_id UUID REFERENCES categories(id);

-- Popular a nova coluna category_id com base nos nomes das categorias existentes
UPDATE transactions
SET category_id = c.id
FROM categories c
WHERE transactions.category = c.name;

UPDATE scheduled_transactions
SET category_id = c.id
FROM categories c
WHERE scheduled_transactions.category = c.name;

-- Definir a coluna category_id como NOT NULL após a migração
ALTER TABLE transactions
ALTER COLUMN category_id SET NOT NULL;

ALTER TABLE scheduled_transactions
ALTER COLUMN category_id SET NOT NULL;

-- Remover a coluna category antiga
ALTER TABLE transactions
DROP COLUMN category;

ALTER TABLE scheduled_transactions
DROP COLUMN category;
