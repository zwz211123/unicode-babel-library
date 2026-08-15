<?php
declare(strict_types=1);

$config = require __DIR__ . '/config/app.php';
header('Content-Type: application/json; charset=UTF-8');
echo json_encode([
    'name' => $config['name'],
    'engine' => $config['engine_version'],
    'pageLength' => $config['page_length'],
], JSON_UNESCAPED_SLASHES);
