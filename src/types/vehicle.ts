export type VehicleType = 'car' | 'motorcycle' | 'van' | 'truck' | 'bus' | 'pickup' | 'other';
export type VehicleUsageType = 'personal' | 'professional' | 'mixed';
export type VehicleStatus = 'active' | 'sold' | 'inactive';
export type VehicleValuationSource = 'fipe' | 'manual';
export type VehicleActivityType = 'uber' | '99' | 'delivery' | 'freight' | 'lalamove' | 'private_transport' | 'custom';
export type VehicleExpenseType = 'fixed' | 'variable';
export type VehicleExpenseCategory = 'fuel' | 'toll' | 'washing' | 'maintenance' | 'parts' | 'labor' | 'insurance' | 'ipva' | 'licensing' | 'financing' | 'parking' | 'tracker' | 'fine' | 'tax' | 'other';
export type VehicleRecurringCategory = 'insurance' | 'ipva' | 'licensing' | 'financing' | 'parking' | 'tracker' | 'subscription' | 'other';
export type VehicleRecurringFrequency = 'weekly' | 'monthly' | 'quarterly' | 'semiannual' | 'annual';
export type VehicleOdometerSource = 'manual' | 'maintenance' | 'expense' | 'trip' | 'other';
export type VehicleComponentEventType = 'initial_installation' | 'replacement' | 'maintenance' | 'inspection' | 'removal';

export interface Vehicle {
  id: string;
  character_id: string;
  name: string | null;
  vehicle_type: VehicleType;
  usage_type: VehicleUsageType;
  brand: string;
  model: string;
  version: string | null;
  manufacture_year: number | null;
  model_year: number | null;
  plate: string | null;
  fipe_code: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  current_market_value: number | null;
  current_odometer: number;
  status: VehicleStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type VehicleInsert = Pick<Vehicle, 'character_id' | 'vehicle_type' | 'brand' | 'model'> & Partial<Omit<Vehicle, 'id' | 'character_id' | 'vehicle_type' | 'brand' | 'model' | 'created_at' | 'updated_at'>>;
export type VehicleUpdate = Partial<Omit<Vehicle, 'id' | 'character_id' | 'created_at' | 'updated_at'>>;

export interface VehicleValuation {
  id: string;
  vehicle_id: string;
  valuation_source: VehicleValuationSource;
  value: number;
  reference_month: string | null;
  fipe_code: string | null;
  notes: string | null;
  valuation_date: string;
  created_at: string;
}

export interface VehicleComponentTemplate {
  id: string;
  vehicle_type: VehicleType;
  category: string;
  name: string;
  default_lifespan_km: number | null;
  default_lifespan_months: number | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface VehicleComponent {
  id: string;
  vehicle_id: string;
  template_id: string | null;
  name: string;
  category: string | null;
  quantity: number;
  expected_lifespan_km: number | null;
  expected_lifespan_months: number | null;
  estimated_unit_price: number | null;
  current_install_date: string | null;
  current_install_odometer: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VehicleComponentHistory {
  id: string;
  component_id: string;
  event_type: VehicleComponentEventType;
  event_date: string;
  odometer: number | null;
  quantity: number;
  unit_price: number | null;
  parts_total: number | null;
  labor_cost: number;
  description: string | null;
  notes: string | null;
  created_at: string;
}

export interface VehicleActivity {
  id: string;
  vehicle_id: string;
  name: string;
  activity_type: VehicleActivityType;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VehicleRevenue {
  id: string;
  vehicle_id: string;
  activity_id: string | null;
  revenue_date: string;
  gross_amount: number;
  hours_worked: number | null;
  kilometers_driven: number | null;
  service_count: number | null;
  notes: string | null;
  created_at: string;
}

export interface VehicleExpense {
  id: string;
  vehicle_id: string;
  activity_id: string | null;
  category: VehicleExpenseCategory;
  expense_type: VehicleExpenseType;
  description: string;
  amount: number;
  expense_date: string;
  odometer: number | null;
  notes: string | null;
  created_at: string;
}

export interface VehicleRecurringCost {
  id: string;
  vehicle_id: string;
  category: VehicleRecurringCategory;
  description: string;
  amount: number;
  frequency: VehicleRecurringFrequency;
  start_date: string;
  end_date: string | null;
  next_due_date: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleOdometerLog {
  id: string;
  vehicle_id: string;
  recorded_at: string;
  odometer: number;
  source: VehicleOdometerSource;
  notes: string | null;
}
