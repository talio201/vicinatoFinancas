DROP POLICY IF EXISTS "Allow read access to partner's transactions" ON transactions;
CREATE POLICY "Allow read access to partner's transactions"
ON transactions FOR SELECT
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1
    FROM couple_relationships
    WHERE
      status = 'accepted' AND
      (
        (user1_id = auth.uid() AND user2_id = transactions.user_id) OR
        (user2_id = auth.uid() AND user1_id = transactions.user_id)
      )
  )
);