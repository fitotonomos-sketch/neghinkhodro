<?php
declare(strict_types=1);

$configPath = __DIR__ . '/_private/sitemap-config.php';
$config = is_file($configPath) ? require $configPath : [];
$siteUrl = rtrim((string)($config['site_url'] ?? 'https://neghinkhodro.com'), '/');
$supabaseUrl = rtrim((string)($config['supabase_url'] ?? ''), '/');
$supabaseKey = trim((string)($config['supabase_anon_key'] ?? ''));

function isPrivilegedSupabaseKey(string $key): bool
{
    if (str_starts_with($key, 'sb_secret_')) {
        return true;
    }
    $parts = explode('.', $key);
    if (count($parts) < 2) {
        return false;
    }
    $payload = strtr($parts[1], '-_', '+/');
    $payload = base64_decode(str_pad($payload, (int)(ceil(strlen($payload) / 4) * 4), '='), true);
    if ($payload === false) {
        return false;
    }
    $claims = json_decode($payload, true);
    return is_array($claims) && ($claims['role'] ?? '') === 'service_role';
}
$templatePath = __DIR__ . '/vehicle/index.html';

if (!is_file($templatePath)) {
    http_response_code(500);
    exit('Vehicle page template is missing.');
}

$path = parse_url((string)($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH) ?: '/';
$slug = '';
if (preg_match('~^/vehicle/([^/]+)/?$~', $path, $match)) {
    $slug = rawurldecode($match[1]);
} else {
    $slug = trim((string)($_GET['slug'] ?? ''));
}
if ($slug === '' || $slug === '.' || $slug === '..' || str_contains($slug, '/') || str_contains($slug, "\\") || str_contains($slug, "\0")) {
    http_response_code(404);
    exit('Vehicle not found.');
}

$vehicle = null;
$lookupSucceeded = false;
if (
    filter_var($supabaseUrl, FILTER_VALIDATE_URL) &&
    str_starts_with($supabaseUrl, 'https://') &&
    $supabaseKey !== '' &&
    !isPrivilegedSupabaseKey($supabaseKey)
) {
    $query = http_build_query([
        'select' => 'slug,name,model,seo_title,meta_description,description,main_image,year,mileage,fuel_type,transmission,exterior_color,trim',
        'slug' => 'eq.' . $slug,
        'status' => 'eq.available',
        'limit' => '1',
    ]);
    $endpoint = $supabaseUrl . '/rest/v1/vehicles?' . $query;
    $headers = [
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey,
        'Accept: application/json',
    ];
    $responseBody = false;

    if (function_exists('curl_init')) {
        $curl = curl_init($endpoint);
        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_CONNECTTIMEOUT => 4,
            CURLOPT_TIMEOUT => 8,
            CURLOPT_FOLLOWLOCATION => false,
        ]);
        $candidate = curl_exec($curl);
        $status = (int)curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        curl_close($curl);
        if ($candidate !== false && $status >= 200 && $status < 300) $responseBody = $candidate;
    } elseif (filter_var(ini_get('allow_url_fopen'), FILTER_VALIDATE_BOOLEAN)) {
        $context = stream_context_create(['http' => [
            'method' => 'GET',
            'header' => implode("\r\n", $headers),
            'timeout' => 8,
            'ignore_errors' => true,
        ]]);
        $candidate = @file_get_contents($endpoint, false, $context);
        $status = 0;
        foreach (($http_response_header ?? []) as $responseHeader) {
            if (preg_match('~^HTTP/\S+\s+(\d{3})~', $responseHeader, $statusMatch)) {
                $status = (int)$statusMatch[1];
            }
        }
        if ($candidate !== false && $status >= 200 && $status < 300) $responseBody = $candidate;
    }

    if (is_string($responseBody)) {
        $rows = json_decode($responseBody, true);
        if (is_array($rows) && ($rows === [] || (isset($rows[0]) && is_array($rows[0])))) {
            $lookupSucceeded = true;
            if (isset($rows[0]) && is_array($rows[0])) $vehicle = $rows[0];
        }
    }
}

$html = file_get_contents($templatePath);
if ($html === false) {
    http_response_code(500);
    exit('Unable to read vehicle page template.');
}

if (!$vehicle) {
    header('Content-Type: text/html; charset=utf-8');

    if (!$lookupSucceeded) {
        // Preserve the last build's page if Supabase is temporarily unreachable.
        // Unicode slugs may be written as UTF-8 or percent-encoded depending on the build filesystem.
        $fallbackTemplates = [
            __DIR__ . '/vehicle/' . $slug . '/index.html',
            __DIR__ . '/vehicle/' . rawurlencode($slug) . '/index.html',
        ];
        foreach (array_unique($fallbackTemplates) as $fallbackTemplate) {
            if (is_file($fallbackTemplate)) {
                header('Cache-Control: public, max-age=60, stale-while-revalidate=120');
                readfile($fallbackTemplate);
                exit;
            }
        }
    }

    // A successful empty result means the slug is not public. A failed lookup is temporary.
    $html = preg_replace('~<meta name="robots" content="[^"]*"\s*/?>~i', '<meta name="robots" content="noindex,follow">', $html, 1) ?? $html;
    header('Cache-Control: no-store');
    if ($lookupSucceeded) {
        http_response_code(404);
    } else {
        http_response_code(503);
        header('Retry-After: 60');
    }
    echo $html;
    exit;
}

$escape = static fn($value): string => htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$name = trim((string)($vehicle['name'] ?? 'خودرو'));
$model = trim((string)($vehicle['model'] ?? ''));
$fullName = trim($name . ' ' . $model);
$title = trim((string)($vehicle['seo_title'] ?? '')) ?: ($fullName . ' | نگین خودرو');
$description = trim((string)($vehicle['meta_description'] ?? ''));
if ($description === '') $description = trim((string)($vehicle['description'] ?? 'مشاهده مشخصات و جزئیات خودرو در نگین خودرو.'));
if (function_exists('mb_substr')) {
    $description = mb_substr($description, 0, 300, 'UTF-8');
} elseif (preg_match('/^.{0,300}/us', $description, $matches)) {
    $description = $matches[0];
}
$image = trim((string)($vehicle['main_image'] ?? ''));
if (str_starts_with($image, '/') && !str_starts_with($image, '//')) $image = $siteUrl . $image;
if (!filter_var($image, FILTER_VALIDATE_URL) || !str_starts_with($image, 'https://')) $image = $siteUrl . '/images/showroom-social.jpg';
$canonical = $siteUrl . '/vehicle/' . rawurlencode($slug) . '/';

$html = preg_replace('~<title>.*?</title>~is', '<title>' . $escape($title) . '</title>', $html, 1) ?? $html;
$html = preg_replace('~<meta name="description" content="[^"]*"\s*/?>~i', '<meta name="description" content="' . $escape($description) . '">', $html, 1) ?? $html;
$html = preg_replace('~<link rel="canonical" href="[^"]*"\s*/?>~i', '<link rel="canonical" href="' . $escape($canonical) . '">', $html, 1) ?? $html;
$html = preg_replace('~<meta property="og:type" content="[^"]*"\s*/?>~i', '<meta property="og:type" content="product">', $html, 1) ?? $html;
$html = preg_replace('~<meta property="og:title" content="[^"]*"\s*/?>~i', '<meta property="og:title" content="' . $escape($title) . '">', $html, 1) ?? $html;
$html = preg_replace('~<meta property="og:description" content="[^"]*"\s*/?>~i', '<meta property="og:description" content="' . $escape($description) . '">', $html, 1) ?? $html;
$html = preg_replace('~<meta property="og:url" content="[^"]*"\s*/?>~i', '<meta property="og:url" content="' . $escape($canonical) . '">', $html, 1) ?? $html;
$html = preg_replace('~<meta property="og:image" content="[^"]*"\s*/?>~i', '<meta property="og:image" content="' . $escape($image) . '">', $html, 1) ?? $html;
$html = preg_replace('~<meta name="twitter:title" content="[^"]*"\s*/?>~i', '<meta name="twitter:title" content="' . $escape($title) . '">', $html, 1) ?? $html;
$html = preg_replace('~<meta name="twitter:description" content="[^"]*"\s*/?>~i', '<meta name="twitter:description" content="' . $escape($description) . '">', $html, 1) ?? $html;

$jsonLd = [
    '@context' => 'https://schema.org',
    '@type' => 'Vehicle',
    'name' => $fullName,
    'url' => $canonical,
    'image' => $image,
    'description' => $description,
    'vehicleModelDate' => isset($vehicle['year']) ? (string)$vehicle['year'] : null,
    'mileageFromOdometer' => isset($vehicle['mileage']) ? [
        '@type' => 'QuantitativeValue', 'value' => $vehicle['mileage'], 'unitCode' => 'KMT'
    ] : null,
    'fuelType' => $vehicle['fuel_type'] ?? null,
    'vehicleTransmission' => $vehicle['transmission'] ?? null,
    'color' => $vehicle['exterior_color'] ?? null,
    'vehicleConfiguration' => $vehicle['trim'] ?? null,
];
$json = json_encode($jsonLd, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);
if ($json !== false) $html = preg_replace('~</head>~i', '<script id="vehicle-jsonld" type="application/ld+json">' . $json . '</script></head>', $html, 1) ?? $html;

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: public, max-age=60, stale-while-revalidate=120');
header('X-Content-Type-Options: nosniff');
echo $html;
