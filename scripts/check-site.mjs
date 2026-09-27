/**
 * 站点自检：引用的资源是否存在、锚点是否可达、有没有残留的第三方品牌词。
 *
 * 为什么要这么一道检查：
 *   纯手写静态站没有构建期报错兜底，写错一个 href 或者改了某个 id，
 *   上线后就是 404 或点不动的锚点，肉眼很难全查一遍。这里一次性全查。
 *
 * 用法：node scripts/check-site.mjs
 * 退出码非 0 表示有问题。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let bad = 0;
const fail = (msg) => { bad++; console.log('  ✗ ' + msg); };
const ok = (msg) => console.log('  ✓ ' + msg);

const htmlFiles = fs.readdirSync(root).filter((f) => f.endsWith('.html'));
console.log('页面：' + htmlFiles.join(', '));

// 每个页面里存在的 id，供跨页锚点检查用
const idsByPage = new Map();
for (const f of htmlFiles) {
  const text = fs.readFileSync(path.join(root, f), 'utf8');
  idsByPage.set(f, new Set([...text.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
}

for (const f of htmlFiles) {
  console.log('\n--- ' + f + ' ---');
  const text = fs.readFileSync(path.join(root, f), 'utf8');

  // 1) 本地资源引用（带 # 的交给下面的锚点检查，这里跳过）
  //    链接可能带缓存戳（如 assets/img/favicon.png?v=2），按真实文件路径查存在性
  const refs = [
    ...[...text.matchAll(/(?:href|src)="(?!https?:|mailto:|#)([^"]+)"/g)]
      .map((m) => m[1])
      .filter((r) => !r.includes('#')),
  ];
  for (const r of refs) {
    const file = r.split('?')[0]; // 去掉 ?v= 缓存戳再判断文件存在性
    if (fs.existsSync(path.join(root, file))) ok('资源 ' + r);
    else fail('资源不存在：' + r);
  }

  // 2) 锚点可达：同一文件的锚点在本文件找，跨文件的去目标文件找
  for (const m of text.matchAll(/href="([^"#]*\.html)?#([^"]+)"/g)) {
    const [, page, anchor] = m;
    const target = page || f;
    const ids = idsByPage.get(target);
    if (!ids) { fail('锚点指向未知页面：' + target); continue; }
    if (ids.has(anchor)) ok('#' + anchor + (page ? ' → ' + page : ''));
    else fail('锚点找不到目标：' + target + '#' + anchor);
  }

  // 3) 第三方品牌词：商店版曾因描述里出现品牌词被挑刺，官网文案同样不能带
  //    apple-touch-icon 是标准 HTML rel 值，不算品牌词，用负向先行断言排除
  const brandWords = text.match(/Apple(?!-touch-icon)|apple(?!-touch-icon)|iPhone|iPad|MacBook|macOS|iOS/g) || [];
  if (brandWords.length) fail('残留第三方品牌词：' + [...new Set(brandWords)].join(', '));
  else ok('无第三方品牌词');

  // 4) 标签配平：粗筛手写时漏闭合的情况
  for (const tag of ['div', 'section', 'main', 'footer', 'header', 'details', 'ul', 'ol']) {
    const open = (text.match(new RegExp('<' + tag + '[\\s>]', 'g')) || []).length;
    const close = (text.match(new RegExp('</' + tag + '>', 'g')) || []).length;
    if (open !== close) fail(`<${tag}> 不配平：开 ${open} / 闭 ${close}`);
  }
  ok('标签配平');

  // 5) 基础 meta
  for (const must of ['<html lang=', 'name="viewport"', 'name="description"']) {
    if (!text.includes(must)) fail('缺少 ' + must);
  }
  ok('基础 meta 齐全');
}

// 6) netlify.toml 的 publish 目录存在
const toml = fs.readFileSync(path.join(root, 'netlify.toml'), 'utf8');
const publish = toml.match(/publish\s*=\s*"([^"]*)"/);
if (!publish) fail('netlify.toml 缺少 publish');
else if (fs.existsSync(path.join(root, publish[1]))) ok('publish = "' + publish[1] + '" 存在');
else fail('publish 目录不存在：' + publish[1]);

console.log('\n' + (bad === 0 ? '✓ 站点自检全部通过' : '✗ 共 ' + bad + ' 处问题'));
process.exit(bad === 0 ? 0 : 1);
