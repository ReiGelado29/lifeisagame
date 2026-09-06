```sql
-- ============================================================
-- 007 - Corrigir permissões de leitura dos atributos
-- ============================================================

-- Garante que usuários autenticados tenham acesso à tabela.
GRANT SELECT, INSERT, UPDATE, DELETE
ON public.attributes
TO authenticated;


-- Remove a política de leitura caso exista.
DROP POLICY IF EXISTS "Users can read own attributes"
ON public.attributes;

DROP POLICY IF EXISTS "Authenticated users can read attributes"
ON public.attributes;


-- Recria a política correta:
-- cada usuário só pode enxergar seus próprios atributos.
CREATE POLICY "Users can read own attributes"
ON public.attributes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```
