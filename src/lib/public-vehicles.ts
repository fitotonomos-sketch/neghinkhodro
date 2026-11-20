import { createClient } from '@supabase/supabase-js';
import { vehicles as demoVehicles } from '../data/vehicles.js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL?.trim();

const supabaseKey =
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  import.meta.env.PUBLIC_SUPABASE_KEY?.trim() ||
  import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

const db =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
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
    engine: row.engine_cc
      ? `${Number(row.engine_cc).toLocaleString('fa-IR')} سی‌سی`
      : '—',
    power: row.power_hp
      ? `${Number(row.power_hp).toLocaleString('fa-IR')} اسب بخار`
      : '—',
    color: row.exterior_color || '—',
    image: row.main_image || '/images/vehicle-placeholder.jpg',
    image_alt: row.image_alt || `${row.name || ''} ${row.model || ''}`.trim(),
    badge: row.featured ? 'منتخب نگین' : '',
    description:
      row.description ||
      'برای دریافت اطلاعات بیشتر با مشاوران نگین خودرو تماس بگیرید.',
    gallery: Array.isArray(row.gallery_json) ? row.gallery_json : [],
    technical_specs: Array.isArray(row.technical_specs)
      ? row.technical_specs
      : [],
    show_on_home: row.show_on_home === true,
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

function requireDatabase() {
  if (!db) {
    throw new Error(
      '[Negin Khodro] Static production build requires PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env.production and fill in the real Supabase project values before building.'
    );
  }
  return db;
}

/**
 * Loads the public inventory during Astro build.
 * The static hosting version intentionally fails the production build
 * if Supabase is unavailable, rather than publishing a misleading empty catalog.
 */
export async function getPublicVehicles() {
  if (!db) {
    if (import.meta.env.DEV) return demoVehicles.map(mapDemoVehicle);
    requireDatabase();
  }

  const client = requireDatabase();
  const { data, error } = await client
    .from('vehicles')
    .select('*, brand:brands(name,slug), category:categories(name,slug)')
    .eq('status', 'available')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(
      `[Negin Khodro] Failed to load inventory from Supabase during build: ${error.message}`
    );
  }

  return (data || []).map(mapVehicle);
}

/**
 * Retained for compatibility with other project modules.
 */
export async function getPublicVehicleBySlug(slug: string) {
  const vehicles = await getPublicVehicles();
  return vehicles.find((vehicle) => vehicle.slug === slug) || null;
}

export function formatVehiclePrice(price: number, visible = true) {
  if (!visible || !price) return 'استعلام قیمت';
  return new Intl.NumberFormat('fa-IR').format(price);
}
