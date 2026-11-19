/**
 * 相册清理工具：找出文件夹里"没有被任何相册引用"的图片
 *
 * 用法：
 *   node clean_albums.js            只列出（安全，不删）
 *   node clean_albums.js --delete   真正删除（含对应缩略图）
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const ALBUMS_TS = path.join(ROOT, 'XHBlogs', 'data', 'albums.ts');
const BASE_DIR = path.join(ROOT, 'XHBlogs', 'public', 'albums');
const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif|bmp)$/i;

const DO_DELETE = process.argv.includes('--delete');

function readAlbums(file) {
  const src = fs.readFileSync(file, 'utf8');
  const marker = src.indexOf('export const albums');
  const eq = src.indexOf('=', marker);
  return JSON.parse(src.slice(src.indexOf('[', eq), src.lastIndexOf(']') + 1));
}

const albums = readAlbums(ALBUMS_TS);

// 收集被引用的文件：{ "文件夹/文件名": true }
const used = new Set();
for (const album of albums) {
  for (const photo of album.photos || []) {
    for (const u of [photo.url, photo.thumb]) {
      if (!u) continue;
      const m = String(u).match(/^\/albums\/([^/]+)\/(.+)$/);
      if (!m) continue;
      const folder = decodeURIComponent(m[1]);
      let name = decodeURIComponent(m[2]);
      // 缩略图路径 thumbs/xxx.jpg → 还原成原图名只在 thumbs 目录里比较
      used.add(`${folder}/${name}`);
      if (name.startsWith('thumbs/')) {
        used.add(`${folder}/thumbs/${name.slice('thumbs/'.length)}`);
      }
    }
  }
}

let orphanCount = 0;
let orphanBytes = 0;
const report = [];

for (const folder of fs.readdirSync(BASE_DIR)) {
  const dir = path.join(BASE_DIR, folder);
  if (!fs.statSync(dir).isDirectory()) continue;

  const scan = (sub) => {
    const dirPath = sub ? path.join(dir, sub) : dir;
    if (!fs.existsSync(dirPath)) return;
    for (const f of fs.readdirSync(dirPath)) {
      const full = path.join(dirPath, f);
      if (!fs.statSync(full).isFile()) continue;
      if (!IMAGE_EXT.test(f)) continue;
      const key = sub ? `${folder}/${sub}/${f}` : `${folder}/${f}`;
      if (used.has(key)) continue;
      const size = fs.statSync(full).size;
      orphanCount++;
      orphanBytes += size;
      report.push({ key, full, size });
    }
  };

  scan('');
  scan('thumbs');
}

if (report.length === 0) {
  console.log('✅ 没有多余的图片，文件夹和相册数据完全对应。');
  process.exit(0);
}

console.log(`发现 ${report.length} 个未被相册引用的图片，共 ${(orphanBytes / 1024 / 1024).toFixed(2)} MB：\n`);
for (const r of report) {
  console.log(`  ${r.key}   (${Math.round(r.size / 1024)} KB)`);
}

if (!DO_DELETE) {
  console.log('\n以上只是列出。要真正删除，运行：node clean_albums.js --delete');
} else {
  for (const r of report) fs.unlinkSync(r.full);
  console.log(`\n🗑️  已删除 ${report.length} 个文件，释放 ${(orphanBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log('   记得再提交推送一次，线上才会同步删除。');
}
