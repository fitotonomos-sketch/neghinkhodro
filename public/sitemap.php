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

header('Content-Type: application/xml; charset=utf-8');
header('Cache-Control: public, max-age=300, stale-while-revalidate=600');
header('X-Content-Type-Options: nosniff');

$urls = [
    '/' => null,
    '/vehicles/' => null,
    '/about/' => null,
    '/guide/' => null,
    '/contact/' => null,
    '/privacy/' => null,
    '/terms/' => null,
];

$validSite = filter_var($siteUrl, FILTER_VALIDATE_URL) && str_starts_with($siteUrl, 'https://');
$validSupabase = filter_var($supabaseUrl, FILTER_VALIDATE_URL) && str_starts_with($supabaseUrl, 'https://');

if ($validSite && $validSupabase && $supabaseKey !== '' && !isPrivilegedSupabaseKey($supabaseKey)) {
    $headers = [
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey,
        'Accept: application/json',
    ];

    // Supabase REST commonly caps a response at 1,000 rows; paginate to avoid truncating large inventories.
    for ($offset = 0; $offset < 50000; $offset += 1000) {
        $query = http_build_query([
            'select' => 'slug',
            'status' => 'eq.available',
            'order' => 'slug.asc',
            'limit' => 1000,
            'offset' => $offset,
        ]);
        $endpoint = $supabaseUrl . '/rest/v1/vehicles?' . $query;
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
            if ($candidate !== false && $status >= 200 && $status < 300) {
                $responseBody = $candidate;
            }
        } elseif (filter_var(ini_get('allow_url_fopen'), FILTER_VALIDATE_BOOLEAN)) {
            $context = stream_context_create([
                'http' => [
                    'method' => 'GET',
                    'header' => implode("\r\n", $headers),
                    'timeout' => 8,
                    'ignore_errors' => true,
                ],
            ]);
            $candidate = @file_get_contents($endpoint, false, $context);
            if ($candidate !== false) {
                $responseBody = $candidate;
            }
        }

        if (!is_string($responseBody)) {
            break;
        }

        $vehicles = json_decode($responseBody, true);
        if (!is_array($vehicles)) {
            break;
        }

        foreach ($vehicles as $vehicle) {
            if (!is_array($vehicle)) {
                continue;
            }
            $slug = trim((string)($vehicle['slug'] ?? ''));
            if ($slug === '' || str_contains($slug, '/') || str_contains($slug, "\\")) {
                continue;
            }

            $path = '/vehicle/' . rawurlencode($slug) . '/';
            $urls[$path] = true;
        }

        if (count($vehicles) < 1000) {
            break;
        }
    }
}

$xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
$xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
foreach ($urls as $path => $_unused) {
    $loc = htmlspecialchars($siteUrl . $path, ENT_XML1 | ENT_COMPAT, 'UTF-8');
    $xml .= '<url><loc>' . $loc . '</loc></url>';
}
$xml .= '</urlset>';
echo $xml;
