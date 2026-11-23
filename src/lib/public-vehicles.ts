
import { createClient } from '@supabase/supabase-js';
import { vehicles as demoVehicles } from '../data/vehicles.js';

type Relation =
  | { name?: string | null; slug?: string | null }
  | Array<{ name?: string | null; slug?: string | null }>
  | null;

type VehicleRow = Record<string, any> & {
  brand?: Relation;
  category?: Relation;
  price_visible?: boolean | null;
  gallery_json?: unknown;
  technical_specs?: unknown;
};

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL?.trim();

const supabaseKey =
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  import.meta.env.PUBLIC_SUPABASE_KEY?.trim();

function isValidSupabaseUrl(value: string | undefined): value is string {
  if (!value) return false;

  try {
    const parsed = new URL(value);
    const isLocalHost = ['localhost', '127.0.0.1', '[::1]'].includes(
      parsed.hostname
    );

    return (
      (parsed.protocol === 'https:' ||
        (parsed.protocol === 'http:' && isLocalHost)) &&
      parsed.pathname === '/' &&
      !parsed.username &&
      !parsed.password &&
      !parsed.search &&
      !parsed.hash
    );
  } catch {
    return false;
  }
}

// Never allow privileged Supabase keys in public environment variables.
function isPrivilegedKey(value: string | undefined): boolean {
  if (!value) return false;
  if (value.startsWith('sb_secret_')) return true;

  const payload = value.split('.')[1];
  if (!payload) return false;

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(
      atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))
    );

    return decoded?.role === 'service_role';
  } catch {
    return false;
  }
}

const validUrl = isValidSupabaseUrl(supabaseUrl);
const safePublicKey = !!supabaseKey && !isPrivilegedKey(supabaseKey);

if (supabaseKey && !safePublicKey) {
  console.error(
    '[Negin Khodro] A privileged Supabase key was supplied to a PUBLIC_ variable and has been rejected.'
  );
}

const db =
  validUrl && supabaseUrl && safePublicKey && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          fetch: (input, init = {}) =>
            fetch(input, {
              ...init,
              signal: init.signal || AbortSignal.timeout(8_000),
            }),
        },
      })
    : null;

const INVENTORY_CACHE_TTL_MS = 15_000;

let cachedInventory: ReturnType<typeof mapVehicle>[] | null = null;
let inventoryCacheUntil = 0;
let inventoryRequest: Promise<ReturnType<typeof mapVehicle>[]> | null = null;

const PUBLIC_VEHICLE_SELECT = [
  'id',
  'slug',
  'brand_id',
  'category_id',
  'name',
  'model',
  'trim',
  'year',
  'price',
  'price_visible',
  'mileage',
  'fuel_type',
  'transmission',
  'drivetrain',
  'condition',
  'status',
  'description',
  'main_image',
  'gallery_json',
  'featured',
  'show_on_home',
  'sort_order',
  'engine_cc',
  'power_hp',
  'exterior_color',
  'technical_specs',
  'seo_title',
  'meta_description',
  'image_alt',
  'created_at',
  'updated_at',
  'brand:brands(name,slug)',
  'category:categories(name,slug)',
].join(',');

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

function firstRelation(value: Relation | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function safeMediaUrl(
  value: unknown,
  fallback = '/images/vehicle-placeholder.jpg'
): string {
  if (typeof value !== 'string' || !value.trim()) return fallback;

  const candidate = value.trim();

  if (
    candidate.startsWith('/') &&
    !candidate.startsWith('//') &&
    !candidate.includes('\\')
  ) {
    return candidate;
  }

  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' ? url.href : fallback;
  } catch {
    return fallback;
  }
}

function mapVehicle(row: VehicleRow) {
  const brand = firstRelation(row.brand);
  const category = firstRelation(row.category);
  const priceVisible = row.price_visible !== false;

  const gallery = Array.isArray(row.gallery_json)
    ? row.gallery_json
        .map((item) => safeMediaUrl(item, ''))
        .filter(Boolean)
    : [];

  return {
    ...row,

    // Hidden prices must never reach public UI or browser filters.
    price: priceVisible ? Number(row.price || 0) : null,
    price_visible: priceVisible,

    brand: brand?.name || 'بدون برند',
    category: category?.name || 'سایر',
    brandSlug: brand?.slug || '',
    categorySlug: category?.slug || '',

    year: Number(row.year || 0),
    mileage: Number(row.mileage || 0),

    fuel: row.fuel_type || '—',
    transmission: row.transmission || '—',
    drivetrain: row.drivetrain || '—',

    condition:
      conditionLabels[String(row.condition)] || row.condition || '—',

    status: statusLabels[String(row.status)] || row.status || '—',

    engine: row.engine_cc
      ? `${Number(row.engine_cc).toLocaleString('fa-IR')} سی‌سی`
      : '—',

    power: row.power_hp
      ? `${Number(row.power_hp).toLocaleString('fa-IR')} اسب بخار`
      : '—',

    color: row.exterior_color || '—',

    image: safeMediaUrl(row.main_image),
    image_alt:
      row.image_alt || `${row.name || ''} ${row.model || ''}`.trim(),

    badge: row.featured ? 'منتخب نگین' : '',

    description:
      row.description ||
      'برای دریافت اطلاعات بیشتر با مشاوران نگین خودرو تماس بگیرید.',

    gallery,
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
    created_at: null,
    year: Number(vehicle.year || 0),
    mileage: Number(vehicle.mileage || 0),
  };
}

function reportInventoryError(context: string, error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`[Negin Khodro] ${context}: ${detail}`);
}

async function fetchPublicInventory() {
  if (!db) {
    if (import.meta.env.DEV) {
      return demoVehicles.map(mapDemoVehicle);
    }

    reportInventoryError(
      'Supabase is not configured',
      'Set PUBLIC_SUPABASE_URL and a public Supabase key in the hosting environment.'
    );

    inventoryCacheUntil = Date.now() + 5_000;
    return cachedInventory || [];
  }

  try {
    const { data, error } = await db
      .from('vehicles')
      .select(PUBLIC_VEHICLE_SELECT)
      .eq('status', 'available')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;

    const vehicles = (data || []).map((row) =>
      mapVehicle(row as VehicleRow)
    );

    cachedInventory = vehicles;
    inventoryCacheUntil = Date.now() + INVENTORY_CACHE_TTL_MS;

    return vehicles;
  } catch (error) {
    reportInventoryError('Could not load public inventory', error);

    // Keep the last successful public catalogue during temporary outages.
    inventoryCacheUntil = Date.now() + 5_000;

    if (import.meta.env.DEV && !cachedInventory) {
      return demoVehicles.map(mapDemoVehicle);
    }

    return cachedInventory || [];
  }
}

export async function getPublicVehicles() {
  if (cachedInventory && Date.now() < inventoryCacheUntil) {
    return cachedInventory;
  }

  // Reuse an in-flight request instead of sending duplicate queries.
  if (inventoryRequest) {
    return inventoryRequest;
  }

  inventoryRequest = fetchPublicInventory().finally(() => {
    inventoryRequest = null;
  });

  return inventoryRequest;
}

export async function getPublicVehicleBySlug(slug: string) {
  const normalizedSlug = slug.trim();

  if (!normalizedSlug) return null;

  const vehicles = await getPublicVehicles();

  return vehicles.find((vehicle) => vehicle.slug === normalizedSlug) || null;
}

export function formatVehiclePrice(
  price: number | null | undefined,
  visible = true
) {
  if (!visible || !price) {
    return 'استعلام قیمت';
  }

  return new Intl.NumberFormat('fa-IR').format(price);
}
