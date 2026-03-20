<?php
// ═══════════════════════════════════════════════
//  RESONANCE — Save Voice Request
//  File: save_request.php
//  Called by: contact.html via fetch() POST
//  Returns:   JSON  { success, id, message }
// ═══════════════════════════════════════════════

// Allow requests from same origin (adjust for your host)
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// ── Read JSON body ──────────────────────────────
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON body']);
    exit;
}

// ── Sanitize & validate ─────────────────────────
function clean(string $val, int $max = 255): string {
    return mb_substr(trim(strip_tags($val)), 0, $max);
}

$producer_name = clean($data['producer_name'] ?? '');
$email         = filter_var(trim($data['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$voice_type    = clean($data['voice_type']    ?? '');
$voice_gender  = clean($data['voice_gender']  ?? 'male', 10);
$language      = clean($data['language']      ?? 'en-US', 20);
$emotion       = clean($data['emotion']       ?? 'neutral', 30);
$speed         = round(floatval($data['speed'] ?? 1.0), 2);
$pitch         = round(floatval($data['pitch'] ?? 1.0), 2);
$text_input    = clean($data['text_input']    ?? '', 1000);
$char_count    = min(intval($data['char_count'] ?? strlen($text_input)), 1000);
$ip_address    = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? null;

// Required fields check
if (empty($voice_type)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'voice_type is required']);
    exit;
}
if (empty($text_input)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'text_input is required']);
    exit;
}

// Clamp speed/pitch to valid ranges
$speed = max(0.1, min(2.0, $speed));
$pitch = max(0.1, min(2.0, $pitch));

// ── Connect & insert ────────────────────────────
require_once __DIR__ . '/db.php';  // gives $pdo

$sql = "
    INSERT INTO voice_requests
        (producer_name, email, voice_type, voice_gender, language, emotion,
         speed, pitch, text_input, char_count, ip_address)
    VALUES
        (:producer_name, :email, :voice_type, :voice_gender, :language, :emotion,
         :speed, :pitch, :text_input, :char_count, :ip_address)
";

$stmt = $pdo->prepare($sql);
$stmt->execute([
    ':producer_name' => $producer_name,
    ':email'         => $email,
    ':voice_type'    => $voice_type,
    ':voice_gender'  => $voice_gender,
    ':language'      => $language,
    ':emotion'       => $emotion,
    ':speed'         => $speed,
    ':pitch'         => $pitch,
    ':text_input'    => $text_input,
    ':char_count'    => $char_count,
    ':ip_address'    => $ip_address,
]);

$newId = $pdo->lastInsertId();

// ── Respond ─────────────────────────────────────
echo json_encode([
    'success' => true,
    'id'      => (int) $newId,
    'message' => 'Voice request saved successfully',
]);