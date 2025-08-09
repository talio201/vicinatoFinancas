
-- 1. Helper function to check for an accepted partnership
CREATE OR REPLACE FUNCTION public.is_partner(user_id_1 uuid, user_id_2 uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.couple_relationships
    WHERE
      status = '''accepted''' AND
      (
        (user1_id = user_id_1 AND user2_id = user_id_2) OR
        (user1_id = user_id_2 AND user2_id = user_id_1)
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the old, restrictive policy on transactions
DROP POLICY IF EXISTS "Allow full access to own transactions" ON transactions;

-- 3. Create a new policy for SELECT (reading) transactions
CREATE POLICY "Allow read access to own and partner'''s transactions"
ON public.transactions FOR SELECT
USING (
  (user_id = auth.uid()) OR
  (public.is_partner(auth.uid(), user_id))
);

-- 4. Create a new policy for INSERT/UPDATE/DELETE to protect data integrity
CREATE POLICY "Allow modification of own transactions"
ON public.transactions FOR (INSERT, UPDATE, DELETE)
USING (
  (user_id = auth.uid())
)
WITH CHECK (
  (user_id = auth.uid())
);
