import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FILE = path.join(process.cwd(), 'data', 'guestbook.json');
const MAX_ITEMS = 200;

type Entry = { name: string; text: string; time: number };

// 简单内存限流：同一 IP 5 秒内只能发一次
const lastPost = new Map<string, number>();

function readAll(): Entry[] {
  try {
    if (!fs.existsSync(FILE)) return [];
    const raw = fs.readFileSync(FILE, 'utf8');
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeAll(list: Entry[]) {
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(list.slice(-MAX_ITEMS), null, 2), 'utf8');
}

export async function GET() {
  const list = readAll();
  return NextResponse.json({ ok: true, items: list.slice().reverse() });
}

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const now = Date.now();
  const prev = lastPost.get(ip) || 0;
  if (now - prev < 5000) {
    return NextResponse.json({ ok: false, message: '慢一点，5 秒后再发' }, { status: 429 });
  }

  let name = '';
  let text = '';
  try {
    const body = await request.json();
    name = String(body?.name ?? '').trim();
    text = String(body?.text ?? '').trim();
  } catch {
    return NextResponse.json({ ok: false, message: '格式不对' }, { status: 400 });
  }

  if (!text) return NextResponse.json({ ok: false, message: '写点什么再发吧' }, { status: 400 });
  if (text.length > 300) return NextResponse.json({ ok: false, message: '最多 300 字' }, { status: 400 });

  const entry: Entry = {
    name: (name || '匿名').slice(0, 20),
    text: text.slice(0, 300),
    time: now,
  };

  try {
    const list = readAll();
    list.push(entry);
    writeAll(list);
    lastPost.set(ip, now);
  } catch {
    return NextResponse.json({ ok: false, message: '服务器无法保存留言' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, item: entry });
}
