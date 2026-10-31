import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Car, Bike, Truck, Bus, Search, Trash2 } from 'lucide-react';
import { vehicleService } from '../services';
import type { Vehicle, VehicleType, VehicleUsageType } from '../types/vehicle';

interface VehiclesSectionProps {
  characterId: string;
  onBack: () => void;
}

const vehicleTypes: { value: VehicleType; label: string }[] = [
  { value: 'car', label: 'Carro' },
  { value: 'motorcycle', label: 'Motocicleta' },
  { value: 'van', label: 'Van' },
  { value: 'truck', label: 'Caminhão' },
  { value: 'bus', label: 'Ônibus' },
  { value: 'pickup', label: 'Picape' },
  { value: 'other', label: 'Outro' },
];

const usageTypes: { value: VehicleUsageType; label: string }[] = [
  { value: 'personal', label: 'Pessoal' },
  { value: 'professional', label: 'Profissional' },
  { value: 'mixed', label: 'Misto' },
];

const typeIcons = { car: Car, motorcycle: Bike, van: Truck, truck: Truck, bus: Bus, pickup: Truck, other: Car };
const currency = (value: number | null) => value == null ? '—' : value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function VehiclesSection({ characterId, onBack }: VehiclesSectionProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    vehicle_type: 'car' as VehicleType,
    usage_type: 'personal' as VehicleUsageType,
    brand: '',
    model: '',
    version: '',
    manufacture_year: '',
    model_year: '',
    plate: '',
    purchase_date: '',
    purchase_price: '',
    current_odometer: '0',
    name: '',
  });

  const loadVehicles = async () => {
    setLoading(true);
    try {
      setVehicles(await vehicleService.getVehicles(characterId));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar os veículos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadVehicles(); }, [characterId]);

  const updateForm = (field: keyof typeof form, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.brand.trim() || !form.model.trim()) {
      setError('Informe a marca e o modelo.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await vehicleService.createVehicle({
        character_id: characterId,
        vehicle_type: form.vehicle_type,
        usage_type: form.usage_type,
        brand: form.brand.trim(),
        model: form.model.trim(),
        name: form.name.trim() || null,
        version: form.version.trim() || null,
        manufacture_year: form.manufacture_year ? Number(form.manufacture_year) : null,
        model_year: form.model_year ? Number(form.model_year) : null,
        plate: form.plate.trim() || null,
        purchase_date: form.purchase_date || null,
        purchase_price: form.purchase_price ? Number(form.purchase_price) : null,
        current_odometer: Number(form.current_odometer) || 0,
      });
      setForm({ vehicle_type: 'car', usage_type: 'personal', brand: '', model: '', version: '', manufacture_year: '', model_year: '', plate: '', purchase_date: '', purchase_price: '', current_odometer: '0', name: '' });
      setShowForm(false);
      await loadVehicles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível cadastrar o veículo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (vehicle: Vehicle) => {
    if (!window.confirm(`Excluir ${vehicle.brand} ${vehicle.model}? Os registros vinculados também serão excluídos.`)) return;
    try {
      await vehicleService.deleteVehicle(vehicle.id);
      await loadVehicles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível excluir o veículo.');
    }
  };

  const filtered = vehicles.filter(vehicle =>
    `${vehicle.name || ''} ${vehicle.brand} ${vehicle.model} ${vehicle.plate || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6">
          <ArrowLeft className="w-5 h-5" /> Voltar
        </button>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Meus veículos</h1>
            <p className="text-slate-400 mt-1">Cadastro, custos, componentes e histórico</p>
          </div>
          <button onClick={() => { setShowForm(!showForm); setError(''); }} className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold">
            <Plus className="w-5 h-5" /> Novo veículo
          </button>
        </div>

        {error && <div role="alert" className="mb-4 p-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-300">{error}</div>}

        {showForm && (
          <form onSubmit={handleCreate} className="mb-6 p-5 rounded-2xl bg-slate-800 border border-slate-700 space-y-4">
            <h2 className="text-xl font-semibold text-white">Cadastrar veículo</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="text-sm text-slate-300">Tipo
                <select value={form.vehicle_type} onChange={e => updateForm('vehicle_type', e.target.value)} className="mt-1 w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white">
                  {vehicleTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </label>
              <label className="text-sm text-slate-300">Uso
                <select value={form.usage_type} onChange={e => updateForm('usage_type', e.target.value)} className="mt-1 w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white">
                  {usageTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </label>
              <label className="text-sm text-slate-300">Marca *
                <input required value={form.brand} onChange={e => updateForm('brand', e.target.value)} placeholder="Ex.: Honda" className="mt-1 w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white" />
              </label>
              <label className="text-sm text-slate-300">Modelo *
                <input required value={form.model} onChange={e => updateForm('model', e.target.value)} placeholder="Ex.: Civic" className="mt-1 w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white" />
              </label>
              <label className="text-sm text-slate-300">Versão
                <input value={form.version} onChange={e => updateForm('version', e.target.value)} className="mt-1 w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white" />
              </label>
              <label className="text-sm text-slate-300">Nome/apelido
                <input value={form.name} onChange={e => updateForm('name', e.target.value)} placeholder="Opcional" className="mt-1 w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white" />
              </label>
              <label className="text-sm text-slate-300">Ano de fabricação
                <input type="number" min="1900" max="2100" value={form.manufacture_year} onChange={e => updateForm('manufacture_year', e.target.value)} className="mt-1 w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white" />
              </label>
              <label className="text-sm text-slate-300">Ano do modelo
                <input type="number" min="1900" max="2100" value={form.model_year} onChange={e => updateForm('model_year', e.target.value)} className="mt-1 w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white" />
              </label>
              <label className="text-sm text-slate-300">Placa
                <input value={form.plate} onChange={e => updateForm('plate', e.target.value.toUpperCase())} className="mt-1 w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white" />
              </label>
              <label className="text-sm text-slate-300">Quilometragem atual
                <input type="number" min="0" step="0.1" value={form.current_odometer} onChange={e => updateForm('current_odometer', e.target.value)} className="mt-1 w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white" />
              </label>
              <label className="text-sm text-slate-300">Data de aquisição
                <input type="date" value={form.purchase_date} onChange={e => updateForm('purchase_date', e.target.value)} className="mt-1 w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white" />
              </label>
              <label className="text-sm text-slate-300">Preço de aquisição (R$)
                <input type="number" min="0" step="0.01" value={form.purchase_price} onChange={e => updateForm('purchase_price', e.target.value)} className="mt-1 w-full p-3 rounded-lg bg-slate-700 border border-slate-600 text-white" />
              </label>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-slate-600 text-white">Cancelar</button>
              <button disabled={saving} className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar veículo'}</button>
            </div>
          </form>
        )}

        <div className="relative mb-4">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por marca, modelo, nome ou placa..." className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white" />
        </div>

        {loading ? <p className="text-slate-400 py-10 text-center">Carregando veículos...</p> :
          filtered.length === 0 ? (
            <div className="text-center py-14 rounded-2xl border border-dashed border-slate-700">
              <Car className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-white font-semibold">{vehicles.length ? 'Nenhum resultado encontrado' : 'Nenhum veículo cadastrado'}</p>
              <p className="text-slate-400 text-sm mt-1">{vehicles.length ? 'Tente outra busca.' : 'Cadastre seu primeiro veículo para começar.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(vehicle => {
                const Icon = typeIcons[vehicle.vehicle_type];
                return <article key={vehicle.id} className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-3 rounded-xl bg-slate-700 text-emerald-400"><Icon className="w-6 h-6" /></div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-white truncate">{vehicle.name || `${vehicle.brand} ${vehicle.model}`}</h3>
                        <p className="text-sm text-slate-400">{vehicle.brand} {vehicle.model} {vehicle.version || ''}</p>
                      </div>
                    </div>
                    <button onClick={() => void handleDelete(vehicle)} title="Excluir veículo" className="p-2 text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
                    <div><p className="text-slate-500">Quilometragem</p><p className="text-white font-semibold">{vehicle.current_odometer.toLocaleString('pt-BR')} km</p></div>
                    <div><p className="text-slate-500">Valor atual</p><p className="text-white font-semibold">{currency(vehicle.current_market_value)}</p></div>
                    <div><p className="text-slate-500">Ano/modelo</p><p className="text-white">{vehicle.manufacture_year || '—'} / {vehicle.model_year || '—'}</p></div>
                    <div><p className="text-slate-500">Placa</p><p className="text-white">{vehicle.plate || '—'}</p></div>
                  </div>
                  <div className="mt-4 flex justify-between text-xs text-slate-400"><span>{usageTypes.find(item => item.value === vehicle.usage_type)?.label}</span><span className={vehicle.status === 'active' ? 'text-emerald-400' : 'text-slate-500'}>{vehicle.status === 'active' ? 'Ativo' : vehicle.status === 'sold' ? 'Vendido' : 'Inativo'}</span></div>
                </article>;
              })}
            </div>
          )
        }
      </div>
    </div>
  );
}
