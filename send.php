<?php
/**
 * Right Tech International — contact form handler
 * Receives the enquiry form and emails it to info@rti-sa.com
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

const MAIL_TO   = 'info@rti-sa.com';
const MAIL_FROM = 'info@rti-sa.com';       // must be on this domain so SPF/DMARC pass
const SITE_NAME = 'Right Tech International';

function fail(string $msg, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg]);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    fail('Method not allowed.', 405);
}

// Honeypot — bots fill hidden fields, humans never see them.
if (trim((string)($_POST['website'] ?? '')) !== '') {
    echo json_encode(['ok' => true]);   // silently accept, discard
    exit;
}

$clean = static function (string $v): string {
    // strip CR/LF to prevent mail header injection
    return trim(str_replace(["\r", "\n", "%0a", "%0d"], ' ', $v));
};

$name    = $clean((string)($_POST['name']    ?? ''));
$email   = $clean((string)($_POST['email']   ?? ''));
$phone   = $clean((string)($_POST['phone']   ?? ''));
$scope   = $clean((string)($_POST['scope']   ?? ''));
$message = trim((string)($_POST['message'] ?? ''));   // newlines are fine in the body

if ($name === '' || $email === '' || $message === '') {
    fail('Please complete the required fields.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fail('Please enter a valid email address.');
}
if (mb_strlen($name) > 120 || mb_strlen($message) > 5000) {
    fail('That submission is too long.');
}

$subject = 'Website enquiry — ' . $name . ($scope !== '' ? ' · ' . $scope : '');

$body = "New enquiry from the " . SITE_NAME . " website\n"
      . str_repeat('-', 46) . "\n\n"
      . "Name    : {$name}\n"
      . "Email   : {$email}\n"
      . "Phone   : " . ($phone !== '' ? $phone : '—') . "\n"
      . "Project : " . ($scope !== '' ? $scope : '—') . "\n\n"
      . "Message:\n{$message}\n\n"
      . str_repeat('-', 46) . "\n"
      . 'Sent: ' . date('Y-m-d H:i:s') . "\n"
      . 'IP  : ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n";

$headers = [
    'From: ' . SITE_NAME . ' <' . MAIL_FROM . '>',
    'Reply-To: ' . $name . ' <' . $email . '>',   // replying goes to the enquirer
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . phpversion(),
];

$sent = @mail(MAIL_TO, $subject, $body, implode("\r\n", $headers), '-f' . MAIL_FROM);

if (!$sent) {
    fail('Sorry — the message could not be sent. Please email ' . MAIL_TO . ' directly.', 500);
}

echo json_encode(['ok' => true]);
