<?php
declare(strict_types=1);

$config = require __DIR__ . '/config/app.php';

header('Content-Type: text/html; charset=UTF-8');
header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
header('Referrer-Policy: no-referrer');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
?>
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <title><?= htmlspecialchars($config['name'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></title>
  <link rel="stylesheet" href="assets/css/app.css?v=20260816-copy-metadata">
</head>
<body>
  <header class="masthead">
    <a class="brand" href="#/">UNICODE BABEL <span>LIBRARY</span></a>
    <div class="engine-badge"><?= htmlspecialchars($config['engine_version'], ENT_QUOTES, 'UTF-8') ?></div>
  </header>

  <main>
    <section id="home-view" class="home-view">
      <div class="eyebrow">A deterministic archive of every possible Unicode page</div>
      <h1>巴别图书馆，<br><em>写在数学里。</em></h1>
      <p class="lede">不存书，不存搜索，不存你。一个种子、一串页码，足以定位由 3,200 个 Unicode 标量值组成的任意页面。</p>
      <form id="enter-form" class="seed-form">
        <label for="seed-input">馆藏种子 / SEED</label>
        <div class="input-row">
          <input id="seed-input" name="seed" type="text" value="敦煌" autocomplete="off" spellcheck="false" maxlength="2048">
          <button type="submit">进入馆藏 <span>→</span></button>
        </div>
        <button id="random-seed" class="text-button" type="button">生成随机种子</button>
      </form>
      <div class="principles">
        <article><b>01</b><h2>确定性</h2><p>同一版本、种子和页码，永久对应同一页面。</p></article>
        <article><b>02</b><h2>零存储</h2><p>内容只在浏览器生成，URL 片段不会发给服务器。</p></article>
        <article><b>03</b><h2>可逆搜索</h2><p>目标文本直接编码成页面，再反算它的地址。</p></article>
      </div>
    </section>

    <section id="reader-view" class="reader-view" hidden>
      <div class="reader-head">
        <div><div class="eyebrow">READING ROOM</div><h1>馆藏阅览</h1></div>
        <div class="mode-switch" role="group" aria-label="显示模式">
          <button id="raw-mode" class="active" type="button">RAW</button>
          <button id="inspect-mode" type="button">INSPECT</button>
        </div>
      </div>

      <dl class="metadata">
        <div class="metadata-copy" role="button" tabindex="0" data-copy-target="#meta-seed" data-copy-label="种子" aria-label="复制种子"><dt>SEED</dt><dd id="meta-seed"></dd></div>
        <div class="metadata-copy" role="button" tabindex="0" data-copy-target="#meta-page" data-copy-label="页面 ID" aria-label="复制页面 ID"><dt>PAGE ID · BASE36</dt><dd id="meta-page"></dd></div>
        <div class="metadata-copy" role="button" tabindex="0" data-copy-target="#meta-engine" data-copy-label="算法版本" aria-label="复制算法版本"><dt>ENGINE</dt><dd id="meta-engine"></dd></div>
        <div class="metadata-copy" role="button" tabindex="0" data-copy-target="#meta-hash" data-copy-label="SHA-256 哈希" aria-label="复制 SHA-256 哈希"><dt>SHA-256</dt><dd id="meta-hash">计算中…</dd></div>
      </dl>

      <div id="notice" class="notice" hidden></div>
      <div id="page-content" class="page-content" aria-label="Unicode 页面内容"></div>

      <nav class="pager" aria-label="页面导航">
        <button id="prev-page" type="button">← 上一页</button>
        <form id="page-jump-form" class="page-jump-form">
          <label for="page-jump-input">跳转至</label>
          <input id="page-jump-input" type="text" inputmode="text" autocomplete="off" spellcheck="false" placeholder="base36 pageId" required>
          <button type="submit">页</button>
        </form>
        <button id="random-page" type="button">随机页</button>
        <button id="next-page" type="button">下一页 →</button>
      </nav>

      <div class="reader-actions">
        <button id="favorite-page" type="button">☆ 收藏</button>
        <button id="export-page" type="button">⇩ 导出 TXT</button>
        <button id="back-home" type="button">⌂ 返回入口</button>
      </div>

      <details class="notes-panel">
        <summary>本地页签备注 / PRIVATE NOTE</summary>
        <textarea id="note-input" maxlength="4000" placeholder="备注仅保存在当前浏览器的 IndexedDB"></textarea>
        <button id="save-note" type="button">保存本地备注</button>
      </details>

      <form id="search-form" class="search-panel">
        <div><div class="eyebrow">INVERSE CATALOGUE</div><h2>数学逆向搜索</h2></div>
        <label>目标 Unicode 文本<textarea id="search-input" required maxlength="3200" placeholder="输入任何 Unicode 字符串，例如：藏经洞 🌌"></textarea></label>
        <label class="occurrence">结果序号 <input id="occurrence-input" type="number" min="0" max="4294967295" value="0"></label>
        <button type="submit">构造并定位页面</button>
      </form>
    </section>
  </main>

  <footer><span>NO DATABASE · NO TRACKING · ALL GENERATION RUNS LOCALLY</span><span>© <?= date('Y') ?> UBL</span></footer>
  <script type="module" src="assets/js/app.js?v=20260816-copy-metadata"></script>
</body>
</html>
