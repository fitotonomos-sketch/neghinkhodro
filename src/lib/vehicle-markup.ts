import type { PublicVehicle } from './public-vehicles';

export function escapeHtml(value: unknown): string {
  const replacements: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return String(value ?? '').replace(/[&<>"']/g, (character) => replacements[character]);
}
function safeHref(value: unknown, fallback = '/images/vehicle-placeholder.jpg') {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  const candidate = value.trim();
  if (candidate.startsWith('/') && !candidate.startsWith('//') && !candidate.includes('\\')) {
    return candidate;
  }
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' ? url.href : fallback;
  } catch {
    return fallback;
  }
}

export function formatPublicPrice(price: unknown, visible = true): string {
  const amount = Number(price);
  if (!visible || !Number.isFinite(amount) || amount <= 0) return 'استعلام قیمت';
  return new Intl.NumberFormat('fa-IR').format(amount);
}

export function renderVehicleCardMarkup(vehicle: PublicVehicle, featured = false): string {
  const name = [vehicle.name, vehicle.model].filter(Boolean).join(' ');
  const slug = encodeURIComponent(String(vehicle.slug || ''));
  const href = `/vehicle/${slug}/`;
  const image = safeHref(vehicle.image);
  const imageAlt = vehicle.image_alt || `${name}، نمای بیرونی ${vehicle.color || ''}`;
  const mileage = Number(vehicle.mileage || 0);
  const shortSpecs = [
    mileage ? `${new Intl.NumberFormat('fa-IR').format(mileage)} کیلومتر` : 'کارکرد نامشخص',
    vehicle.transmission || 'گیربکس نامشخص',
    vehicle.fuel || 'سوخت نامشخص',
  ];
  const showPrice = vehicle.price_visible !== false && Number(vehicle.price) > 0;

  return `<article class="vehicle-card${featured ? ' vehicle-card-featured' : ''}"
      data-vehicle-card
      data-name="${escapeHtml(`${vehicle.name || ''} ${vehicle.model || ''} ${vehicle.trim || ''}`)}"
      data-brand="${escapeHtml(vehicle.brand || '')}"
      data-category="${escapeHtml(vehicle.category || '')}"
      data-year="${escapeHtml(vehicle.year || '')}"
      data-price="${showPrice ? escapeHtml(vehicle.price) : ''}"
      data-created-at="${escapeHtml(vehicle.created_at || '')}"
      data-status="${escapeHtml(vehicle.status || '')}"
      data-fuel="${escapeHtml(vehicle.fuel || '')}"
      data-transmission="${escapeHtml(vehicle.transmission || '')}"
      data-drivetrain="${escapeHtml(vehicle.drivetrain || '')}"
      data-condition="${escapeHtml(vehicle.condition || '')}"
      data-mileage="${escapeHtml(vehicle.mileage || 0)}">
    <a class="vehicle-card-image" href="${href}" aria-label="مشاهده مشخصات ${escapeHtml(name)}">
      <img src="${escapeHtml(image)}" alt="${escapeHtml(imageAlt)}" loading="lazy" decoding="async" width="1264" height="848" />
      <span class="card-image-shade" aria-hidden="true"></span>
      ${(featured || vehicle.badge) ? `<span class="card-badge">${escapeHtml(vehicle.badge || 'انتخاب ویژه نگین')}</span>` : ''}
      ${vehicle.status ? `<span class="card-status">${escapeHtml(vehicle.status)}</span>` : ''}
      <span class="card-image-action" aria-hidden="true">مشاهده خودرو <span>←</span></span>
    </a>
    <div class="card-body">
      <div class="card-title-row">
        <div class="card-title-group">
          <h3><a href="${href}">${escapeHtml(vehicle.name)}</a></h3>
          ${vehicle.model ? `<span class="card-model">${escapeHtml(vehicle.model)}</span>` : ''}
        </div>
        ${vehicle.year ? `<span class="card-year">${new Intl.NumberFormat('fa-IR').format(Number(vehicle.year))}</span>` : ''}
      </div>
      ${vehicle.trim ? `<p class="card-trim">${escapeHtml(vehicle.trim)}</p>` : ''}
      <div class="card-specs" aria-label="مشخصات کوتاه خودرو">${shortSpecs.map((item) => `<span>${escapeHtml(item)}</span>`).join('')}</div>
      <div class="card-footer">
        <div class="card-price-wrap"><span class="card-price-label">قیمت خودرو</span>
          <div class="card-price">${formatPublicPrice(vehicle.price, vehicle.price_visible)}${showPrice ? '<small>تومان</small>' : ''}</div>
        </div>
        <a class="card-arrow" href="${href}" aria-label="جزئیات ${escapeHtml(name)}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M19 12H5m7 7-7-7 7-7" /></svg>
        </a>
      </div>
    </div>
  </article>`;
}

function display(value: unknown): string {
  return value === null || value === undefined || String(value).trim() === '' ? '—' : String(value);
}

function faNumber(value: unknown): string {
  return value === null || value === undefined || value === ''
    ? '—'
    : new Intl.NumberFormat('fa-IR').format(Number(value));
}

function makeSpecs(items: Array<[string, unknown]>) {
  return items
    .map(([label, value]) => ({ label, value: display(value) }))
    .filter((item) => item.value !== '—');
}

function specGroup(title: string, english: string, items: Array<[string, unknown]>) {
  const rows = makeSpecs(items);
  if (!rows.length) return '';
  return `<section class="spec-group" aria-label="${escapeHtml(title)}">
    <header class="spec-group-heading"><h3>${escapeHtml(title)}</h3><span>${escapeHtml(english)}</span></header>
    <div class="spec-group-grid">${rows.map((item) => `<div class="spec-item"><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong></div>`).join('')}</div>
  </section>`;
}

export function renderVehicleDetailMarkup(vehicle: PublicVehicle, related: PublicVehicle[] = []): string {
  const vehicleTitle = [vehicle.name, vehicle.model].filter(Boolean).join(' ');
  const image = safeHref(vehicle.image);
  const priceText = formatPublicPrice(vehicle.price, vehicle.price_visible);
  const priceVisible = vehicle.price_visible !== false && Number(vehicle.price) > 0;
  const gallery = Array.isArray(vehicle.gallery) ? vehicle.gallery : [];
  const technicalSpecs = Array.isArray(vehicle.technical_specs) ? vehicle.technical_specs : [];
  const year = vehicle.year ? faNumber(vehicle.year) : '—';
  const relatedMarkup = related.length
    ? `<section class="section related-vehicles-section" id="related-vehicles" aria-labelledby="related-title">
        <div class="container"><div class="section-heading"><div><div class="eyebrow">YOU MAY ALSO LIKE</div><h2 id="related-title">خودروهای مشابه</h2><p>گزینه‌های دیگری از همین برند برای بررسی بیشتر</p></div>
        <a class="text-link" href="/vehicles/">مشاهده همه خودروها <span aria-hidden="true">←</span></a></div>
        <div class="vehicle-grid">${related.map((item) => renderVehicleCardMarkup(item)).join('')}</div></div>
      </section>`
    : '';

  const galleryMarkup = gallery.length
    ? `<div class="vehicle-gallery" aria-label="گالری تصاویر خودرو">${gallery.map((item, index) => {
        const url = safeHref(item);
        return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" aria-label="نمایش تصویر ${index + 1} از ${escapeHtml(vehicleTitle)}"><img src="${escapeHtml(url)}" alt="${escapeHtml(vehicleTitle)}، تصویر ${index + 1}" loading="lazy" decoding="async" /></a>`;
      }).join('')}</div>`
    : '';

  const additionalSpecs = technicalSpecs.length
    ? `<section class="section-tight technical-spec-section" aria-labelledby="technical-title">
        <div class="section-heading"><div><div class="eyebrow">TECHNICAL DETAILS</div><h2 id="technical-title">جزئیات فنی تکمیلی</h2></div></div>
        <div class="spec-groups"><section class="spec-group"><header class="spec-group-heading"><h3>اطلاعات فنی ثبت‌شده</h3><span>ADDITIONAL FEATURES</span></header>
        <div class="spec-group-grid">${technicalSpecs.map((item: any) => `<div class="spec-item"><span>${escapeHtml(display(item.key))}</span><strong>${escapeHtml(display(item.value))}</strong></div>`).join('')}</div></section></div>
      </section>`
    : '';

  return `<section class="page-hero vehicle-page-hero" id="vehicle-overview" aria-labelledby="vehicle-title">
    <div class="container">
      <nav class="breadcrumbs" aria-label="مسیر صفحه"><a href="/">خانه</a><span>/</span><a href="/vehicles/">خودروها</a><span>/</span><span aria-current="page">${escapeHtml(vehicle.name)}</span></nav>
      <div class="vehicle-heading-layout"><div class="page-heading"><div class="eyebrow">NEGIN KHODRO · VEHICLE COLLECTION</div>
        <h1 id="vehicle-title">${escapeHtml(vehicleTitle)}</h1>${vehicle.trim ? `<p>${escapeHtml(vehicle.trim)}</p>` : ''}</div>
        ${vehicle.year ? `<div class="vehicle-year-mark"><span>MODEL YEAR</span><strong>${escapeHtml(year)}</strong></div>` : ''}
      </div>
    </div>
  </section>
  <section class="section vehicle-detail-section" id="vehicle-details" aria-labelledby="vehicle-title">
    <div class="container detail-grid"><main class="detail-main">
      <div class="detail-media-shell"><div class="detail-photo"><img src="${escapeHtml(image)}" alt="${escapeHtml(vehicle.image_alt || `${vehicleTitle}، نمای بیرونی ${vehicle.color || ''}`)}" width="1264" height="848" fetchpriority="high" decoding="async" />
        <span class="detail-photo-caption">NEGIN KHODRO / VEHICLE SHOWCASE</span></div>${galleryMarkup}</div>
      <section class="section-tight vehicle-spec-section" id="vehicle-specifications" aria-labelledby="specifications-title">
        <div class="section-heading"><div><div class="eyebrow">VEHICLE SPECIFICATIONS</div><h2 id="specifications-title">مشخصات خودرو</h2><p>اطلاعات شناسایی، پیشرانه، عملکرد و جزئیات بدنه خودرو</p></div></div>
        <div class="spec-groups">
          ${specGroup('مشخصات شناسایی', 'VEHICLE IDENTITY', [ ['برند', vehicle.brand], ['مدل', vehicle.model], ['تیپ', vehicle.trim], ['سال ساخت', vehicle.year ? faNumber(vehicle.year) : null], ['دسته‌بندی', vehicle.category], ['وضعیت', vehicle.status], ['شرایط خودرو', vehicle.condition] ])}
          ${specGroup('پیشرانه و عملکرد', 'POWERTRAIN', [ ['حجم موتور', vehicle.engine], ['قدرت موتور', vehicle.power], ['نوع سوخت', vehicle.fuel], ['گیربکس', vehicle.transmission], ['محور محرک', vehicle.drivetrain] ])}
          ${specGroup('بدنه و کابین', 'EXTERIOR & INTERIOR', [ ['رنگ بدنه', vehicle.color], ['رنگ کابین', vehicle.interior_color], ['کارکرد', vehicle.mileage !== null && vehicle.mileage !== undefined && vehicle.mileage !== '' ? `${faNumber(vehicle.mileage)} کیلومتر` : null] ])}
        </div>
      </section>
      <section class="content-block vehicle-description-block" id="vehicle-description" aria-labelledby="description-title">
        <div class="eyebrow">ABOUT THIS VEHICLE</div><h2 id="description-title">درباره این خودرو</h2>
        <p>${escapeHtml(vehicle.description || 'برای دریافت توضیحات تکمیلی این خودرو با کارشناسان نگین خودرو تماس بگیرید.')}</p>
        <p>برای دریافت گزارش کارشناسی، هماهنگی بازدید یا آگاهی از جزئیات بیشتر، مشاوران نگین خودرو آماده پاسخ‌گویی هستند.</p>
      </section>${additionalSpecs}
    </main>
    <aside class="detail-summary" aria-label="خلاصه و درخواست مشاوره خودرو">
      <div class="summary-topline"><span class="summary-kicker">NEGIN SELECTED</span>${vehicle.status ? `<span class="summary-status">${escapeHtml(vehicle.status)}</span>` : ''}</div>
      <h2>${escapeHtml(vehicleTitle)}</h2>${vehicle.trim ? `<p class="detail-trim">${escapeHtml(vehicle.trim)}</p>` : ''}
      <div class="detail-price-block"><span>قیمت اعلامی</span><div class="detail-price">${escapeHtml(priceText)}${priceVisible ? '<small>تومان</small>' : ''}</div></div>
      <div class="summary-stat"><span>کارکرد</span><strong>${vehicle.mileage !== null && vehicle.mileage !== undefined && vehicle.mileage !== '' ? `${escapeHtml(faNumber(vehicle.mileage))} کیلومتر` : 'اعلام نشده'}</strong></div>
      <div class="summary-stat"><span>سال ساخت</span><strong>${escapeHtml(year)}</strong></div>
      <div class="summary-stat"><span>گیربکس</span><strong>${escapeHtml(display(vehicle.transmission))}</strong></div>
      <div class="summary-stat"><span>سوخت</span><strong>${escapeHtml(display(vehicle.fuel))}</strong></div>
      <a class="button summary-primary-action" href="/#contact-inquiry">درخواست مشاوره و بازدید <span aria-hidden="true">←</span></a>
      <a class="button button-outline summary-secondary-action" href="/contact/" data-setting-href="contact.whatsapp" target="_blank" rel="noopener noreferrer">گفت‌وگو در واتس‌اپ</a>
      <p class="form-help">قیمت نهایی و شرایط معامله پس از هماهنگی با مشاور فروش اعلام می‌شود.</p>
      <div class="summary-trust-note"><span aria-hidden="true">✦</span> همراهی تخصصی در انتخاب و خرید خودرو</div>
    </aside></div>
  </section>${relatedMarkup}`;
}

export function renderVehicleJsonLd(vehicle: PublicVehicle, canonicalUrl: string): string {
  const vehicleTitle = [vehicle.name, vehicle.model].filter(Boolean).join(' ');
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Vehicle',
    name: vehicleTitle,
    url: canonicalUrl,
    brand: vehicle.brand ? { '@type': 'Brand', name: vehicle.brand } : undefined,
    vehicleModelDate: vehicle.year ? String(vehicle.year) : undefined,
    image: vehicle.image || undefined,
    description: vehicle.description || undefined,
    mileageFromOdometer: vehicle.mileage !== null && vehicle.mileage !== undefined && vehicle.mileage !== ''
      ? { '@type': 'QuantitativeValue', value: vehicle.mileage, unitCode: 'KMT' }
      : undefined,
    fuelType: vehicle.fuel || undefined,
    vehicleTransmission: vehicle.transmission || undefined,
    color: vehicle.color || undefined,
    vehicleConfiguration: vehicle.trim || undefined,
    category: vehicle.category || undefined,
  }).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}
