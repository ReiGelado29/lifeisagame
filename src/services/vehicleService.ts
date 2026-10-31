import { supabase } from '../lib/supabase';
import type {
  Vehicle, VehicleInsert, VehicleUpdate, VehicleType,
  VehicleValuation, VehicleComponentTemplate, VehicleComponent,
  VehicleComponentHistory, VehicleActivity, VehicleRevenue,
  VehicleExpense, VehicleRecurringCost, VehicleOdometerLog,
} from '../types/vehicle';

async function requireData<T>(result: { data: T | null; error: { message: string } | null }): Promise<T> {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null) throw new Error('O Supabase não retornou os dados esperados.');
  return result.data;
}

export const vehicleService = {
  async getVehicles(characterId: string): Promise<Vehicle[]> {
    const result = await supabase.from('vehicles').select('*')
      .eq('character_id', characterId).order('created_at', { ascending: false });
    if (result.error) throw new Error(result.error.message);
    return (result.data || []) as Vehicle[];
  },

  async getVehicle(id: string): Promise<Vehicle | null> {
    const result = await supabase.from('vehicles').select('*').eq('id', id).maybeSingle();
    if (result.error) throw new Error(result.error.message);
    return result.data as Vehicle | null;
  },

  async createVehicle(data: VehicleInsert): Promise<Vehicle> {
    const result = await supabase.from('vehicles').insert(data).select('*').single();
    return requireData(result) as Promise<Vehicle>;
  },

  async updateVehicle(id: string, updates: VehicleUpdate): Promise<Vehicle> {
    const result = await supabase.from('vehicles').update(updates).eq('id', id).select('*').single();
    return requireData(result) as Promise<Vehicle>;
  },

  async deleteVehicle(id: string): Promise<void> {
    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async getComponentTemplates(vehicleType?: VehicleType): Promise<VehicleComponentTemplate[]> {
    let query = supabase.from('vehicle_component_templates').select('*').eq('is_active', true);
    if (vehicleType) query = query.eq('vehicle_type', vehicleType);
    const result = await query.order('category').order('name');
    if (result.error) throw new Error(result.error.message);
    return (result.data || []) as VehicleComponentTemplate[];
  },

  async getValuations(vehicleId: string): Promise<VehicleValuation[]> {
    const result = await supabase.from('vehicle_valuations').select('*')
      .eq('vehicle_id', vehicleId).order('valuation_date', { ascending: false });
    if (result.error) throw new Error(result.error.message);
    return (result.data || []) as VehicleValuation[];
  },

  async addValuation(data: Pick<VehicleValuation, 'vehicle_id' | 'valuation_source' | 'value'> & Partial<Pick<VehicleValuation, 'reference_month' | 'fipe_code' | 'notes' | 'valuation_date'>>): Promise<VehicleValuation> {
    const result = await supabase.from('vehicle_valuations').insert(data).select('*').single();
    return requireData(result) as Promise<VehicleValuation>;
  },

  async getComponents(vehicleId: string): Promise<VehicleComponent[]> {
    const result = await supabase.from('vehicle_components').select('*')
      .eq('vehicle_id', vehicleId).order('name');
    if (result.error) throw new Error(result.error.message);
    return (result.data || []) as VehicleComponent[];
  },

  async getComponentHistory(componentId: string): Promise<VehicleComponentHistory[]> {
    const result = await supabase.from('vehicle_component_history').select('*')
      .eq('component_id', componentId).order('event_date', { ascending: false });
    if (result.error) throw new Error(result.error.message);
    return (result.data || []) as VehicleComponentHistory[];
  },

  async getActivities(vehicleId: string): Promise<VehicleActivity[]> {
    const result = await supabase.from('vehicle_activities').select('*')
      .eq('vehicle_id', vehicleId).order('name');
    if (result.error) throw new Error(result.error.message);
    return (result.data || []) as VehicleActivity[];
  },

  async getRevenues(vehicleId: string): Promise<VehicleRevenue[]> {
    const result = await supabase.from('vehicle_revenues').select('*')
      .eq('vehicle_id', vehicleId).order('revenue_date', { ascending: false });
    if (result.error) throw new Error(result.error.message);
    return (result.data || []) as VehicleRevenue[];
  },

  async getExpenses(vehicleId: string): Promise<VehicleExpense[]> {
    const result = await supabase.from('vehicle_expenses').select('*')
      .eq('vehicle_id', vehicleId).order('expense_date', { ascending: false });
    if (result.error) throw new Error(result.error.message);
    return (result.data || []) as VehicleExpense[];
  },

  async getRecurringCosts(vehicleId: string): Promise<VehicleRecurringCost[]> {
    const result = await supabase.from('vehicle_recurring_costs').select('*')
      .eq('vehicle_id', vehicleId).order('start_date', { ascending: false });
    if (result.error) throw new Error(result.error.message);
    return (result.data || []) as VehicleRecurringCost[];
  },

  async getOdometerLogs(vehicleId: string): Promise<VehicleOdometerLog[]> {
    const result = await supabase.from('vehicle_odometer_logs').select('*')
      .eq('vehicle_id', vehicleId).order('recorded_at', { ascending: false });
    if (result.error) throw new Error(result.error.message);
    return (result.data || []) as VehicleOdometerLog[];
  },
};
