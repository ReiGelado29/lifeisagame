```sql
-- ============================================================
-- 006 - Garantir que atributos pertençam ao mesmo usuário
-- que suas categorias e atributos-pai
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_attribute_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  category_user_id uuid;
  parent_user_id uuid;
BEGIN
  -- Verifica se a categoria pertence ao mesmo usuário
  SELECT user_id
  INTO category_user_id
  FROM public.attribute_categories
  WHERE id = NEW.category_id;

  IF category_user_id IS NULL THEN
    RAISE EXCEPTION 'Categoria não encontrada';
  END IF;

  IF category_user_id <> NEW.user_id THEN
    RAISE EXCEPTION 'A categoria não pertence ao usuário do atributo';
  END IF;

  -- Se existir atributo-pai, verifica se ele pertence
  -- ao mesmo usuário
  IF NEW.parent_id IS NOT NULL THEN
    SELECT user_id
    INTO parent_user_id
    FROM public.attributes
    WHERE id = NEW.parent_id;

    IF parent_user_id IS NULL THEN
      RAISE EXCEPTION 'Atributo pai não encontrado';
    END IF;

    IF parent_user_id <> NEW.user_id THEN
      RAISE EXCEPTION 'O atributo pai não pertence ao usuário do atributo';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


DROP TRIGGER IF EXISTS validate_attribute_ownership_trigger
ON public.attributes;


CREATE TRIGGER validate_attribute_ownership_trigger
BEFORE INSERT OR UPDATE
ON public.attributes
FOR EACH ROW
EXECUTE FUNCTION public.validate_attribute_ownership();


-- ============================================================
-- Índices auxiliares
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_attributes_user_category
ON public.attributes(user_id, category_id);

CREATE INDEX IF NOT EXISTS idx_attributes_user_parent
ON public.attributes(user_id, parent_id);
```
