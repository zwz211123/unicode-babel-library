# Unicode Babel Library

一个不保存书、不保存 seed、不保存页码，也不保存搜索记录的确定性 Unicode 巴别图书馆。服务端只提供 PHP 页面壳和静态文件；全部内容生成、搜索、哈希与本地数据均在浏览器中完成。

[在线体验](https://babel.zwztry.com)

## ubabel-v1 当前协议

- 字符空间是 Unicode Scalar Values：`U+0000..U+10FFFF`，排除代理区 `U+D800..U+DFFF`，因此 `N = 1,112,064`。
- 每页固定为 40 行 × 80 个标量值，`L = 3,200`，页面空间大小 `M = N^L`。
- base-N digit `0..U+D7FF` 直接映射到同值 code point；其余 digit 加 `0x800` 跳过代理区。
- A 与 B 使用互相独立的派生域。A 域为 `SHA-256("UnicodeBabel|ubabel-v1|seed|A|" + seed)`，B 域为 `SHA-256("UnicodeBabel|ubabel-v1|seed|B|" + seed)`；两份摘要分别初始化各自的固定 xoshiro256** 流，不共享 PRNG 状态。
- A 流通过无偏拒绝采样生成完整的 3,200 个 base-N digit，并从高位到低位拼成 A 候选。若候选为 0 则设为 1，之后逐一递增，直到同时满足 `1 <= A < M` 与 `gcd(A, M) = 1`。
- B 流同样通过无偏拒绝采样独立生成 3,200 个 base-N digit，并从高位到低位拼成 B。
- 页面映射为 `X = (A × pageId + B) mod M`。X 使用固定 3,200 位 base-N 表示，从最高位到最低位映射到页面字符。
- `A_INV = A⁻¹ mod M`，因此任意完整页面 X 都能反算地址：`pageId = A_INV × (X − B) mod M`。

这些规则构成当前 `ubabel-v1` 的完整兼容性契约，Golden Vector 以本文和测试中的当前值为准。

## 为什么不需要存储所有书

页面不是从磁盘读取的，而是由 engine version、seed 和 pageId 唯一决定。仿射映射中的 A 在模 M 下可逆，因此 pageId 到完整页面整数 X 是一个置换：不重复、不遗漏地覆盖整个 `N^3200` 页面空间。seed 改变 A 和 B，相当于重新排列整个图书馆，所以一个 seed 就定义了一个完整宇宙。

## 数学逆向搜索

搜索不会暴力遍历页码。浏览器用 `SHA-256("UnicodeBabel|ubabel-v1|search|" + seed + "|" + occurrenceIndex + "|" + query)` 初始化固定的 xoshiro256**，构造一个确定性背景页面，把目标 Unicode 标量序列写入确定性位置，编码为 X 后直接用 A 的模逆得到 pageId。打开该页后会重新生成并验证 `text.includes(query)`。不同 occurrenceIndex 得到不同背景和地址。

反向搜索成功后，目标 Unicode 标量区间会在结果页高亮；高亮支持跨行文本，并在 Raw 与 Inspect 模式之间切换时保留。

页面 SHA-256 的输入不是 UTF-8/UTF-16 文本，而是 3,200 个 code point 各自按无符号 32-bit big-endian 编码后的 12,800 字节，从而避免平台文本编码差异。

## 隐私与 Unicode 安全

普通馆藏地址使用 fragment：`#/v1/s/<Base64URL(UTF-8 seed)>/p/<base36 pageId>`。反向搜索结果使用更短的可重建地址：`#/v1/s/<seed>/q/<query>/o/<occurrenceIndex>`，新浏览器会重新执行确定性逆向计算并恢复同一页面与高亮，避免在 URL 中携带通常超过一万位的搜索结果 pageId。fragment 不会发送给服务器。收藏、历史、备注和搜索记录的数据库仅存在于浏览器 IndexedDB。页面用 `textContent` 渲染，CSP 禁止外部脚本，并用 `unicode-bidi: isolate` 限制双向文本影响。Raw 模式展示真实字符；Inspect 模式显示 `U+XXXX`。

## 本地运行与测试

需要 PHP 8.x 和支持 BigInt、WebCrypto、ES Modules 的现代浏览器。

```bash
php -S 127.0.0.1:8080
```

访问 `http://127.0.0.1:8080/`。浏览器测试位于 `http://127.0.0.1:8080/tests/run.html`，覆盖 BigInt 数学、Unicode 边界、Emoji/CJK/Combining Mark/ZWJ/RTL、SHA-256、页面长度、Golden Vector、相邻 PageID 扩散和搜索往返。

Golden Vector：

| Engine | Seed | pageId | SHA-256 |
|---|---|---:|---|
| ubabel-v1 | 敦煌 | 0 | `f4d917e9b04c0b991116c245785bb6ea51d31e6768faed9555f073f3c25a8381` |

## Nginx + PHP-FPM 部署

将仓库内容直接放到站点根目录，确保根目录直接包含 `index.php`、`assets/`、`config/` 和 `README.md`，不要多套一层仓库目录。Nginx 站点根目录指向该目录并把 PHP 请求交给 PHP-FPM 即可；本项目不要求数据库、定时任务、写权限或 Composer 安装。`/health.php` 返回无状态健康信息，`/version.php` 返回冻结版本信息。
