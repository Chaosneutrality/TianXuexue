/**
 * 批量生成/追加相册（本地文件夹版）
 *
 * 双击 批量相册.bat 使用；也可以命令行：
 *   node batch_album.js "相册标题" "照片文件夹名"
 *
 * 规则：
 *   - 照片从  XHBlogs\public\albums\<照片文件夹名>\  读取
 *   - 相册标题已存在 → 追加照片（自动去重，原有照片和描述都保留）
 *   - 相册标题不存在 → 新建相册（描述默认等于标题，之后在控制台改）
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT = __dirname;
const BASE_DIR = path.join(ROOT, 'XHBlogs', 'public', 'albums');
const BLOG_ALBUMS = path.join(ROOT, 'XHBlogs', 'data', 'albums.ts');
const MGR_ALBUMS = path.join(ROOT, 'my-blog-manager', 'data', 'albums.ts');
const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif|bmp)$/i;

let ALBUM_TITLE = (process.argv[2] || '').trim();
let FOLDER = (process.argv[3] || '').trim();

function die(msg) {
  console.error('\n❌ ' + msg + '\n');
  process.exit(1);
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(String(answer).trim());
    })
  );
}

function listFolders() {
  if (!fs.existsSync(BASE_DIR)) return [];
  return fs
    .readdirSync(BASE_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

function countImages(folder) {
  const dir = path.join(BASE_DIR, folder);
  try {
    return fs.readdirSync(dir).filter((f) => IMAGE_EXT.test(f)).length;
  } catch {
    return 0;
  }
}

function readAlbums(file) {
  if (!fs.existsSync(file)) return [];
  const src = fs.readFileSync(file, 'utf8');
  const marker = src.indexOf('export const albums');
  if (marker < 0) return [];
  const eq = src.indexOf('=', marker);
  const start = src.indexOf('[', eq < 0 ? marker : eq);
  const end = src.lastIndexOf(']');
  if (start < 0 || end < 0) return [];
  try {
    return JSON.parse(src.slice(start, end + 1));
  } catch (e) {
    die('albums.ts 解析失败：' + e.message);
  }
}

function existingTitles() {
  return readAlbums(BLOG_ALBUMS).map((a) => a.title);
}

// 找出"文件夹里有、但没有任何相册引用"的图片（通常是控制台删过但文件没删）
function findOrphans(albums) {
  const used = new Set();
  for (const album of albums) {
    for (const photo of album.photos || []) {
      for (const u of [photo.url, photo.thumb]) {
        if (!u) continue;
        const m = String(u).match(/^\/albums\/([^/]+)\/(.+)$/);
        if (!m) continue;
        const folder = decodeURIComponent(m[1]);
        const name = decodeURIComponent(m[2]);
        used.add(folder + '/' + name);
      }
    }
  }

  const orphans = [];
  if (!fs.existsSync(BASE_DIR)) return orphans;

  for (const folder of fs.readdirSync(BASE_DIR)) {
    const dir = path.join(BASE_DIR, folder);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const sub of ['', 'thumbs']) {
      const dirPath = sub ? path.join(dir, sub) : dir;
      if (!fs.existsSync(dirPath)) continue;
      for (const f of fs.readdirSync(dirPath)) {
        const full = path.join(dirPath, f);
        if (!fs.statSync(full).isFile() || !IMAGE_EXT.test(f)) continue;
        const key = sub ? folder + '/' + sub + '/' + f : folder + '/' + f;
        if (used.has(key)) continue;
        orphans.push({ key, full, size: fs.statSync(full).size });
      }
    }
  }
  return orphans;
}

function writeAlbums(file, albums) {
  const head = [
    '// 🛡️ 本文件由 XingHuiSama 控制台自动生成，请勿手动修改',
    'export interface Photo { url: string; caption?: string; }',
    'export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }',
    '',
    'export const albums: Album[] = ' + JSON.stringify(albums, null, 2) + ';',
    '',
  ].join('\n');
  fs.writeFileSync(file, head, 'utf8');
}

function run() {
  const srcDir = path.join(BASE_DIR, FOLDER);

  const files = fs
    .readdirSync(srcDir)
    .filter((f) => IMAGE_EXT.test(f))
    .sort((a, b) => a.localeCompare(b, 'zh-CN', { numeric: true }));

  if (files.length === 0) die('文件夹里还没有图片：\n   ' + srcDir);

  const totalMB =
    files.reduce((sum, f) => sum + fs.statSync(path.join(srcDir, f)).size, 0) / 1024 / 1024;

  const urls = files.map(
    (f) => '/albums/' + encodeURIComponent(FOLDER) + '/' + encodeURIComponent(f)
  );

  const albums = readAlbums(BLOG_ALBUMS);
  const today = new Date();
  const date = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');

  const existing = albums.find((a) => a.title === ALBUM_TITLE);
  let added = urls.length;
  let total = 0;

  if (existing) {
    const have = new Set((existing.photos || []).map((p) => p.url));
    const fresh = urls.filter((u) => !have.has(u));
    added = fresh.length;
    existing.photos = [...(existing.photos || []), ...fresh.map((url) => ({ url }))];
    existing.date = date;
    total = existing.photos.length;
    console.log('\n♻️  写入已有相册《' + ALBUM_TITLE + '》（id ' + existing.id + '）');
  } else {
    albums.push({
      description: ALBUM_TITLE,
      title: ALBUM_TITLE,
      id: 'album_' + Date.now(),
      cover: urls[0],
      photos: urls.map((url) => ({ url })),
      date,
    });
    total = urls.length;
    console.log('\n🆕 新建相册《' + ALBUM_TITLE + '》');
  }

  if (existing && !existing.cover && existing.photos?.length) {
    existing.cover = existing.photos[0].thumb || existing.photos[0].url;
  }

  writeAlbums(BLOG_ALBUMS, albums);
  writeAlbums(MGR_ALBUMS, albums);

  // 同步图片到控制台的 public 目录，让控制台的照片墙也能显示
  const mgrDir = path.join(ROOT, 'my-blog-manager', 'public', 'albums', FOLDER);
  try {
    fs.mkdirSync(path.dirname(mgrDir), { recursive: true });
    fs.cpSync(srcDir, mgrDir, { recursive: true, force: true });
    console.log('   已同步图片到控制台 public：' + mgrDir);
  } catch (e) {
    console.log('   ⚠️ 同步图片到控制台失败（不影响线上）：' + e.message);
  }

  console.log('   照片文件夹：' + FOLDER);
  console.log('   本次新增 ' + added + ' 张（文件夹内 ' + files.length + ' 张，' + totalMB.toFixed(1) + ' MB）');
  console.log('   相册现有 ' + total + ' 张');
  console.log('\n✅ 已写入 XHBlogs/data/albums.ts 和 my-blog-manager/data/albums.ts');
  console.log('   接下来：同步 Blog → 仅同步源码（或让维护者帮你推送）');
}

(async () => {
  const interactive = !ALBUM_TITLE || !FOLDER;

  if (interactive) {
    console.log('');
    console.log('============================================================');
    console.log('  批量相册：把本地文件夹里的照片写进相册');
    console.log('============================================================');
    console.log('');
    console.log('  示例（假设你把照片放在 生活 文件夹）：');
    console.log('    1) 相册标题输入: 123      → 相册名叫《123》');
    console.log('    2) 照片文件夹选: 生活     → 读 XHBlogs\\public\\albums\\生活\\');
    console.log('    结果：生活里的照片全部进《123》；相册不存在会自动新建');
    console.log('');
    console.log('  提示：相册标题可以直接打字；文件夹按序号选，省得打中文');
    console.log('        已存在的相册会自动「追加 + 去重」，不会重复也不会覆盖');
    console.log('');

    const titles = existingTitles();
    console.log('  现在已有的相册：' + (titles.length ? titles.map((t) => '《' + t + '》').join('、') : '（还没有）'));
    console.log('');

    // 🔍 运行前检查：有没有"相册里删了、但文件夹还留着"的图片
    const orphans = findOrphans(readAlbums(BLOG_ALBUMS));
    if (orphans.length > 0) {
      const mb = orphans.reduce((s, o) => s + o.size, 0) / 1024 / 1024;
      console.log('  ⚠️  发现 ' + orphans.length + ' 个已不在相册中的孤立图片（共 ' + mb.toFixed(2) + ' MB）：');
      orphans.slice(0, 12).forEach((o) => console.log('       ' + o.key));
      if (orphans.length > 12) console.log('       …… 还有 ' + (orphans.length - 12) + ' 个');
      console.log('');
      console.log('  这些多半是你在控制台删过、但文件夹里没删的；');
      console.log('  如果不删除，下面生成相册时它们会被重新加回来。');
      const ans = (await ask('  是否先删除这些孤立文件？(y = 删除 / 直接回车 = 保留): ')).toLowerCase();
      if (ans === 'y' || ans === 'yes') {
        for (const o of orphans) fs.unlinkSync(o.full);
        console.log('  🗑️  已删除 ' + orphans.length + ' 个文件，释放 ' + mb.toFixed(2) + ' MB\n');
      } else {
        console.log('  已保留（它们会被重新加进相册）\n');
      }
    }
  }

  if (!ALBUM_TITLE) {
    ALBUM_TITLE = await ask('相册标题（例：123）: ');
  }

  if (!FOLDER) {
    const dirs = listFolders();
    if (dirs.length === 0) {
      die('还没有任何照片文件夹。\n   请先在 XHBlogs\\public\\albums\\ 里建一个文件夹并放入照片。');
    }
    console.log('\n  可用的照片文件夹：');
    dirs.forEach((d, i) => {
      console.log('    ' + (i + 1) + ') ' + d + '   （' + countImages(d) + ' 张）');
    });
    const pick = await ask('\n照片文件夹（输入序号或名字，例：1）: ');
    const idx = Number(pick);
    FOLDER = Number.isInteger(idx) && idx >= 1 && idx <= dirs.length ? dirs[idx - 1] : pick;
  }

  if (!ALBUM_TITLE) die('没有收到相册标题。');
  if (!FOLDER) die('没有收到照片文件夹名。');

  const srcDir = path.join(BASE_DIR, FOLDER);
  if (!fs.existsSync(srcDir)) {
    const dirs = listFolders();
    die(
      '找不到照片文件夹：\n   ' + srcDir +
        '\n\n现有的照片文件夹：' + (dirs.length ? '\n   ' + dirs.join('\n   ') : '（还没有）')
    );
  }

  run();
})();
