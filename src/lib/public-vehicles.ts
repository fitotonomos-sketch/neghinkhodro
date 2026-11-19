import { createClient } from '@supabase/supabase-js';
import { vehicles as demoVehicles } from '../data/vehicles.js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL?.trim();
const supabaseKey =
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  import.meta.env.PUBLIC_SUPABASE_KEY?.trim() ||
  import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

const db = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
  : null;

const statusLabels: Record<string, string> = {
  available: 'موجود',
  reserved: 'رزرو شده',
  sold: 'فروخته شده',
  unavailable: 'ناموجود',
};

const conditionLabels: Record<string, string> = {
  new: 'نو',
  used: 'کارکرده',
};

function mapVehicle(row: any) {
  const brand = Array.isArray(row.brand) ? row.brand[0] : row.brand;
  const category = Array.isArray(row.category) ? row.category[0] : row.category;
  return {
    ...row,
    brand: brand?.name || 'بدون برند',
    category: category?.name || 'سایر',
    brandSlug: brand?.slug || '',
    categorySlug: category?.slug || '',
    year: Number(row.year || 0),
    price: Number(row.price || 0),
    price_visible: row.price_visible !== false,
    mileage: Number(row.mileage || 0),
    fuel: row.fuel_type || '—',
    transmission: row.transmission || '—',
    drivetrain: row.drivetrain || '—',
    condition: conditionLabels[row.condition] || row.condition || '—',
    status: statusLabels[row.status] || row.status || '—',
    engine: row.engine_cc ? `${Number(row.engine_cc).toLocaleString('fa-IR')} سی‌سی` : '—',
    power: row.power_hp ? `${Number(row.power_hp).toLocaleString('fa-IR')} اسب بخار` : '—',
    color: row.exterior_color || '—',
    image: row.main_image || '/images/vehicle-placeholder.jpg',
    badge: row.featured ? 'منتخب نگین' : '',
    description: row.description || 'برای دریافت اطلاعات بیشتر با مشاوران نگین خودرو تماس بگیرید.',
    gallery: Array.isArray(row.gallery_json) ? row.gallery_json : [],
    technical_specs: Array.isArray(row.technical_specs) ? row.technical_specs : [],
  };
}

function mapDemoVehicle(vehicle: any) {
  return {
    ...vehicle,
    price_visible: true,
    image_alt: `${vehicle.name} ${vehicle.model}`,
    technical_specs: [],
    gallery: [],
    show_on_home: true,
    year: Number(vehicle.year || 0),
    mileage: Number(vehicle.mileage || 0),
  };
}

export async function getPublicVehicles() {
  if (!db) {
    return import.meta.env.DEV ? demoVehicles.map(mapDemoVehicle) : [];
  }

  const { data, error } = await db
    .from('vehicles')
    .select('*, brand:brands(name,slug), category:categories(name,slug)')
    .eq('status', 'available')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Negin Khodro] Could not load public inventory:', error.message);
    return [];
  }

  return (data || []).map(mapVehicle);
}

export async function getPublicVehicleBySlug(slug: string) {
  if (!db) {
    return import.meta.env.DEV
      ? demoVehicles.map(mapDemoVehicle).find((vehicle) => vehicle.slug === slug) || null
      : null;
  }

  const { data, error } = await db
    .from('vehicles')
    .select('*, brand:brands(name,slug), category:categories(name,slug)')
    .eq('slug', slug)
    .eq('status', 'available')
    .maybeSingle();

  if (error) {
    console.error('[Negin Khodro] Could not load vehicle:', error.message);
    return null;
  }

  return data ? mapVehicle(data) : null;
}

export function formatVehiclePrice(price: number, visible = true) {
  if (!visible || !price) return 'استعلام قیمت';
  return new Intl.NumberFormat('fa-IR').format(price);
}
