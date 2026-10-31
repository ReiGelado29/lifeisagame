-- 009 - Gerenciador de Veiculos
-- Estrutura independente do inventario existente.

CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  name text,
  vehicle_type text NOT NULL CHECK (vehicle_type IN ('car','motorcycle','van','truck','bus','pickup','other')),
  usage_type text NOT NULL DEFAULT 'personal' CHECK (usage_type IN ('personal','professional','mixed')),
  brand text NOT NULL,
  model text NOT NULL,
  version text,
  manufacture_year integer CHECK (manufacture_year BETWEEN 1900 AND 2100),
  model_year integer CHECK (model_year BETWEEN 1900 AND 2100),
  plate text,
  fipe_code text,
  purchase_date date,
  purchase_price numeric(14,2) CHECK (purchase_price IS NULL OR purchase_price >= 0),
  current_market_value numeric(14,2) CHECK (current_market_value IS NULL OR current_market_value >= 0),
  current_odometer numeric(12,1) NOT NULL DEFAULT 0 CHECK (current_odometer >= 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','sold','inactive')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vehicles_character_id_idx ON public.vehicles(character_id);

CREATE TABLE public.vehicle_valuations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  valuation_source text NOT NULL CHECK (valuation_source IN ('fipe','manual')),
  value numeric(14,2) NOT NULL CHECK (value >= 0),
  reference_month date,
  fipe_code text,
  notes text,
  valuation_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vehicle_valuations_vehicle_date_idx ON public.vehicle_valuations(vehicle_id, valuation_date DESC);

CREATE TABLE public.vehicle_component_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_type text NOT NULL CHECK (vehicle_type IN ('car','motorcycle','van','truck','bus','pickup','other')),
  category text NOT NULL,
  name text NOT NULL,
  default_lifespan_km numeric(12,1) CHECK (default_lifespan_km IS NULL OR default_lifespan_km > 0),
  default_lifespan_months integer CHECK (default_lifespan_months IS NULL OR default_lifespan_months > 0),
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(vehicle_type, category, name)
);
CREATE INDEX vehicle_component_templates_type_idx ON public.vehicle_component_templates(vehicle_type);

CREATE TABLE public.vehicle_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.vehicle_component_templates(id) ON DELETE SET NULL,
  name text NOT NULL,
  category text,
  quantity numeric(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  expected_lifespan_km numeric(12,1) CHECK (expected_lifespan_km IS NULL OR expected_lifespan_km > 0),
  expected_lifespan_months integer CHECK (expected_lifespan_months IS NULL OR expected_lifespan_months > 0),
  estimated_unit_price numeric(14,2) CHECK (estimated_unit_price IS NULL OR estimated_unit_price >= 0),
  current_install_date date,
  current_install_odometer numeric(12,1) CHECK (current_install_odometer IS NULL OR current_install_odometer >= 0),
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vehicle_components_vehicle_idx ON public.vehicle_components(vehicle_id);

CREATE TABLE public.vehicle_component_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id uuid NOT NULL REFERENCES public.vehicle_components(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('initial_installation','replacement','maintenance','inspection','removal')),
  event_date date NOT NULL DEFAULT CURRENT_DATE,
  odometer numeric(12,1) CHECK (odometer IS NULL OR odometer >= 0),
  quantity numeric(10,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric(14,2) CHECK (unit_price IS NULL OR unit_price >= 0),
  parts_total numeric(14,2) CHECK (parts_total IS NULL OR parts_total >= 0),
  labor_cost numeric(14,2) NOT NULL DEFAULT 0 CHECK (labor_cost >= 0),
  description text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vehicle_component_history_component_date_idx ON public.vehicle_component_history(component_id, event_date DESC);

CREATE TABLE public.vehicle_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  name text NOT NULL,
  activity_type text NOT NULL DEFAULT 'custom' CHECK (activity_type IN ('uber','99','delivery','freight','lalamove','private_transport','custom')),
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vehicle_activities_vehicle_idx ON public.vehicle_activities(vehicle_id);

CREATE TABLE public.vehicle_revenues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES public.vehicle_activities(id) ON DELETE SET NULL,
  revenue_date date NOT NULL DEFAULT CURRENT_DATE,
  gross_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (gross_amount >= 0),
  hours_worked numeric(8,2) CHECK (hours_worked IS NULL OR hours_worked >= 0),
  kilometers_driven numeric(12,1) CHECK (kilometers_driven IS NULL OR kilometers_driven >= 0),
  service_count integer CHECK (service_count IS NULL OR service_count >= 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vehicle_revenues_vehicle_date_idx ON public.vehicle_revenues(vehicle_id, revenue_date DESC);

CREATE TABLE public.vehicle_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES public.vehicle_activities(id) ON DELETE SET NULL,
  category text NOT NULL CHECK (category IN ('fuel','toll','washing','maintenance','parts','labor','insurance','ipva','licensing','financing','parking','tracker','fine','tax','other')),
  expense_type text NOT NULL DEFAULT 'variable' CHECK (expense_type IN ('fixed','variable')),
  description text NOT NULL,
  amount numeric(14,2) NOT NULL CHECK (amount >= 0),
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  odometer numeric(12,1) CHECK (odometer IS NULL OR odometer >= 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vehicle_expenses_vehicle_date_idx ON public.vehicle_expenses(vehicle_id, expense_date DESC);

CREATE TABLE public.vehicle_recurring_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('insurance','ipva','licensing','financing','parking','tracker','subscription','other')),
  description text NOT NULL,
  amount numeric(14,2) NOT NULL CHECK (amount >= 0),
  frequency text NOT NULL CHECK (frequency IN ('weekly','monthly','quarterly','semiannual','annual')),
  start_date date NOT NULL,
  end_date date,
  next_due_date date,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date IS NULL OR end_date >= start_date)
);
CREATE INDEX vehicle_recurring_costs_vehicle_idx ON public.vehicle_recurring_costs(vehicle_id);

CREATE TABLE public.vehicle_odometer_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  odometer numeric(12,1) NOT NULL CHECK (odometer >= 0),
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','maintenance','expense','trip','other')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vehicle_odometer_logs_vehicle_date_idx ON public.vehicle_odometer_logs(vehicle_id, recorded_at DESC);

-- Verifica propriedade do veiculo pelo usuario autenticado.
CREATE OR REPLACE FUNCTION public.user_owns_vehicle(target_vehicle_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vehicles v
    JOIN public.characters c ON c.id = v.character_id
    WHERE v.id = target_vehicle_id AND c.user_id = auth.uid()
  );
$$;
REVOKE ALL ON FUNCTION public.user_owns_vehicle(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_owns_vehicle(uuid) TO authenticated;

-- Impede vincular receita/despesa a atividade de outro veiculo.
CREATE OR REPLACE FUNCTION public.validate_vehicle_activity_link()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.activity_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.vehicle_activities a
    WHERE a.id = NEW.activity_id AND a.vehicle_id = NEW.vehicle_id
  ) THEN
    RAISE EXCEPTION 'A atividade informada nao pertence a este veiculo';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_vehicle_revenue_activity
BEFORE INSERT OR UPDATE ON public.vehicle_revenues
FOR EACH ROW EXECUTE FUNCTION public.validate_vehicle_activity_link();
CREATE TRIGGER validate_vehicle_expense_activity
BEFORE INSERT OR UPDATE ON public.vehicle_expenses
FOR EACH ROW EXECUTE FUNCTION public.validate_vehicle_activity_link();

-- Impede selecionar template incompatível com o tipo do veiculo.
CREATE OR REPLACE FUNCTION public.validate_vehicle_component_template()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actual_type text;
  template_type text;
BEGIN
  IF NEW.template_id IS NULL THEN RETURN NEW; END IF;
  SELECT vehicle_type INTO actual_type FROM public.vehicles WHERE id = NEW.vehicle_id;
  SELECT vehicle_type INTO template_type FROM public.vehicle_component_templates WHERE id = NEW.template_id;
  IF template_type IS NULL OR (template_type <> actual_type AND template_type <> 'other') THEN
    RAISE EXCEPTION 'O modelo de componente nao e compativel com este veiculo';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_vehicle_component_template_trigger
BEFORE INSERT OR UPDATE ON public.vehicle_components
FOR EACH ROW EXECUTE FUNCTION public.validate_vehicle_component_template();

-- Recalcula o estado atual a partir da linha do tempo completa.
-- Insercoes retroativas, correcoes e exclusoes nao sobrescrevem o evento mais recente.
CREATE OR REPLACE FUNCTION public.sync_vehicle_component_history()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_component_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    affected_component_id := OLD.component_id;
    PERFORM public.recalculate_vehicle_component_state(affected_component_id);
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.component_id IS DISTINCT FROM NEW.component_id THEN
    PERFORM public.recalculate_vehicle_component_state(OLD.component_id);
  END IF;

  PERFORM public.recalculate_vehicle_component_state(NEW.component_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.recalculate_vehicle_component_state(target_component_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  latest_state_type text;
  latest_install record;
BEGIN
  SELECT event_type INTO latest_state_type
  FROM public.vehicle_component_history
  WHERE component_id = target_component_id
    AND event_type IN ('initial_installation','replacement','removal')
  ORDER BY event_date DESC, created_at DESC, id DESC
  LIMIT 1;

  SELECT event_date, odometer, quantity INTO latest_install
  FROM public.vehicle_component_history
  WHERE component_id = target_component_id
    AND event_type IN ('initial_installation','replacement')
  ORDER BY event_date DESC, created_at DESC, id DESC
  LIMIT 1;

  UPDATE public.vehicle_components
  SET current_install_date = latest_install.event_date,
      current_install_odometer = latest_install.odometer,
      quantity = COALESCE(latest_install.quantity, quantity),
      is_active = CASE WHEN latest_state_type IS NULL THEN is_active ELSE latest_state_type <> 'removal' END,
      updated_at = now()
  WHERE id = target_component_id;
END;
$$;

CREATE TRIGGER sync_vehicle_component_history_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.vehicle_component_history
FOR EACH ROW EXECUTE FUNCTION public.sync_vehicle_component_history();

-- Valor atual sempre reflete a avaliacao mais recente, inclusive apos correcao/exclusao.
CREATE OR REPLACE FUNCTION public.sync_vehicle_valuation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_vehicle_valuation(OLD.vehicle_id);
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.vehicle_id IS DISTINCT FROM NEW.vehicle_id THEN
    PERFORM public.recalculate_vehicle_valuation(OLD.vehicle_id);
  END IF;
  PERFORM public.recalculate_vehicle_valuation(NEW.vehicle_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.recalculate_vehicle_valuation(target_vehicle_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  latest_valuation record;
BEGIN
  SELECT value, fipe_code INTO latest_valuation
  FROM public.vehicle_valuations
  WHERE vehicle_id = target_vehicle_id
  ORDER BY valuation_date DESC, created_at DESC, id DESC
  LIMIT 1;

  UPDATE public.vehicles
  SET current_market_value = latest_valuation.value,
      fipe_code = latest_valuation.fipe_code,
      updated_at = now()
  WHERE id = target_vehicle_id;
END;
$$;

CREATE TRIGGER sync_vehicle_valuation_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.vehicle_valuations
FOR EACH ROW EXECUTE FUNCTION public.sync_vehicle_valuation();

-- Hodometro principal nunca retrocede por leitura historica.
CREATE OR REPLACE FUNCTION public.sync_vehicle_odometer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.vehicles
  SET current_odometer = GREATEST(current_odometer, NEW.odometer),
      updated_at = now()
  WHERE id = NEW.vehicle_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER sync_vehicle_odometer_trigger
AFTER INSERT ON public.vehicle_odometer_logs
FOR EACH ROW EXECUTE FUNCTION public.sync_vehicle_odometer();

CREATE OR REPLACE FUNCTION public.set_vehicle_updated_at()
RETURNS trigger LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER vehicles_updated_at BEFORE UPDATE ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION public.set_vehicle_updated_at();
CREATE TRIGGER vehicle_components_updated_at BEFORE UPDATE ON public.vehicle_components
FOR EACH ROW EXECUTE FUNCTION public.set_vehicle_updated_at();
CREATE TRIGGER vehicle_activities_updated_at BEFORE UPDATE ON public.vehicle_activities
FOR EACH ROW EXECUTE FUNCTION public.set_vehicle_updated_at();
CREATE TRIGGER vehicle_recurring_costs_updated_at BEFORE UPDATE ON public.vehicle_recurring_costs
FOR EACH ROW EXECUTE FUNCTION public.set_vehicle_updated_at();

-- RLS: veiculos vinculados ao personagem do usuario.
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own vehicles" ON public.vehicles
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.characters c WHERE c.id = character_id AND c.user_id = auth.uid())
);
CREATE POLICY "Users insert own vehicles" ON public.vehicles
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.characters c WHERE c.id = character_id AND c.user_id = auth.uid())
);
CREATE POLICY "Users update own vehicles" ON public.vehicles
FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.characters c WHERE c.id = character_id AND c.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.characters c WHERE c.id = character_id AND c.user_id = auth.uid())
);
CREATE POLICY "Users delete own vehicles" ON public.vehicles
FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.characters c WHERE c.id = character_id AND c.user_id = auth.uid())
);

-- RLS: registros dependentes.
ALTER TABLE public.vehicle_valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_component_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_recurring_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_odometer_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own vehicle valuations" ON public.vehicle_valuations
FOR ALL TO authenticated USING (public.user_owns_vehicle(vehicle_id))
WITH CHECK (public.user_owns_vehicle(vehicle_id));
CREATE POLICY "Users manage own vehicle components" ON public.vehicle_components
FOR ALL TO authenticated USING (public.user_owns_vehicle(vehicle_id))
WITH CHECK (public.user_owns_vehicle(vehicle_id));
CREATE POLICY "Users manage own component history" ON public.vehicle_component_history
FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.vehicle_components vc
    WHERE vc.id = component_id AND public.user_owns_vehicle(vc.vehicle_id))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.vehicle_components vc
    WHERE vc.id = component_id AND public.user_owns_vehicle(vc.vehicle_id))
);
CREATE POLICY "Users manage own vehicle activities" ON public.vehicle_activities
FOR ALL TO authenticated USING (public.user_owns_vehicle(vehicle_id))
WITH CHECK (public.user_owns_vehicle(vehicle_id));
CREATE POLICY "Users manage own vehicle revenues" ON public.vehicle_revenues
FOR ALL TO authenticated USING (public.user_owns_vehicle(vehicle_id))
WITH CHECK (public.user_owns_vehicle(vehicle_id));
CREATE POLICY "Users manage own vehicle expenses" ON public.vehicle_expenses
FOR ALL TO authenticated USING (public.user_owns_vehicle(vehicle_id))
WITH CHECK (public.user_owns_vehicle(vehicle_id));
CREATE POLICY "Users manage own recurring costs" ON public.vehicle_recurring_costs
FOR ALL TO authenticated USING (public.user_owns_vehicle(vehicle_id))
WITH CHECK (public.user_owns_vehicle(vehicle_id));
CREATE POLICY "Users manage own odometer logs" ON public.vehicle_odometer_logs
FOR ALL TO authenticated USING (public.user_owns_vehicle(vehicle_id))
WITH CHECK (public.user_owns_vehicle(vehicle_id));

-- Catalogo: leitura autenticada, sem escrita pelo cliente.
ALTER TABLE public.vehicle_component_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users read active component templates"
ON public.vehicle_component_templates FOR SELECT TO authenticated
USING (is_active = true);

-- Templates ilustrativos; os intervalos devem ser confirmados para cada veiculo.
INSERT INTO public.vehicle_component_templates
(vehicle_type, category, name, default_lifespan_km, default_lifespan_months, description)
VALUES
('car','engine','Oleo do motor',10000,12,'Referencia ilustrativa; seguir manual do fabricante'),
('car','engine','Filtro de oleo',10000,12,'Referencia ilustrativa; seguir manual do fabricante'),
('car','engine','Filtro de ar',15000,12,'Verificar conforme condicoes de uso'),
('car','brakes','Pastilhas de freio',30000,NULL,'Durabilidade varia conforme conducao'),
('car','brakes','Discos de freio',60000,NULL,'Inspecionar espessura e estado'),
('car','tires','Pneus',40000,60,'Referencia generica; verificar desgaste e validade'),
('car','suspension','Amortecedores',60000,NULL,'Inspecionar periodicamente'),
('motorcycle','engine','Oleo do motor',3000,6,'Seguir manual do fabricante'),
('motorcycle','engine','Filtro de oleo',3000,6,'Seguir manual do fabricante'),
('motorcycle','brakes','Pastilhas de freio',15000,NULL,'Durabilidade variavel'),
('motorcycle','tires','Pneu dianteiro',20000,60,'Referencia generica'),
('motorcycle','tires','Pneu traseiro',12000,60,'Referencia generica'),
('motorcycle','transmission','Kit relacao',20000,NULL,'Corrente, coroa e pinhao'),
('truck','engine','Oleo do motor',20000,12,'Intervalo depende do motor e aplicacao'),
('truck','engine','Filtro de oleo',20000,12,'Seguir especificacao do fabricante'),
('truck','brakes','Pastilhas ou lonas de freio',40000,NULL,'Depende de carga e operacao'),
('truck','tires','Pneus',80000,60,'Depende de eixo, carga e recapagem'),
('van','engine','Oleo do motor',10000,12,'Seguir manual do fabricante'),
('van','tires','Pneus',40000,60,'Referencia generica'),
('pickup','engine','Oleo do motor',10000,12,'Seguir manual do fabricante'),
('pickup','brakes','Pastilhas de freio',30000,NULL,'Durabilidade variavel'),
('pickup','tires','Pneus',40000,60,'Referencia generica'),
('bus','engine','Oleo do motor',20000,12,'Seguir manual do fabricante'),
('bus','brakes','Pastilhas ou lonas de freio',40000,NULL,'Depende da operacao'),
('bus','tires','Pneus',80000,60,'Depende de eixo, carga e recapagem')
ON CONFLICT (vehicle_type, category, name) DO NOTHING;
