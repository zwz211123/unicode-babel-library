<?php
declare(strict_types=1);

$config = require __DIR__ . '/config/app.php';
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');
echo json_encode([
    'status' => 'ok',
    'engine' => $config['engine_version'],
    'storage' => false,
], JSON_UNESCAPED_SLASHES);
