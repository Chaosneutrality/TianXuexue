import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { AUTH_COOKIE, AUTH_TOKEN } from '../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FILE = path.join(process.cwd(), 'data', 'guestbook.json');
const MAX_ITEMS = 200;

type StoredEntry = { id: string; name: string; text: string; time: number; tokenHash: string };
type PublicEntry = { id: string; name: string; text: string; time: number };

const lastPost = new Map<string, number>();

function hash(s: string) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

function readAll(): StoredEntry[] {
  try {
    if (!fs.existsSync(FILE)) return [];
    const arr = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeAll(list: StoredEntry[]) {
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(list.slice(-MAX_ITEMS), null, 2), 'utf8');
}

function toPublic(list: StoredEntry[]): PublicEntry[] {
  return list
    .map(({ id, name, text, time }) => ({ id, name, text, time }))
    .reverse();
}

async function isAdmin() {
  try {
    const store = await cookies();
    return store.get(AUTH_COOKIE)?.value === AUTH_TOKEN;
  } catch {
    return false;
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, items: toPublic(readAll()) });
}

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const now = Date.now();
  if (now - (lastPost.get(ip) || 0) < 5000) {
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

  const token = crypto.randomBytes(16).toString('hex');
  const entry: StoredEntry = {
    id: crypto.randomBytes(8).toString('hex'),
    name: (name || '匿名').slice(0, 20),
    text: text.slice(0, 300),
    time: now,
    tokenHash: hash(token),
  };

  try {
    const list = readAll();
    list.push(entry);
    writeAll(list);
    lastPost.set(ip, now);
  } catch {
    return NextResponse.json({ ok: false, message: '服务器无法保存留言' }, { status: 500 });
  }

  // token 只返回给发布者一次，浏览器存起来用于删除
  return NextResponse.json({
    ok: true,
    item: { id: entry.id, name: entry.name, text: entry.text, time: entry.time },
    token,
  });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id') || '';
  const token = url.searchParams.get('token') || '';
  if (!id) return NextResponse.json({ ok: false, message: '缺少 id' }, { status: 400 });

  const list = readAll();
  const idx = list.findIndex((e) => e.id === id);
  if (idx < 0) return NextResponse.json({ ok: false, message: '留言不存在' }, { status: 404 });

  const admin = await isAdmin();
  const own = token && list[idx].tokenHash === hash(token);
  if (!admin && !own) {
    return NextResponse.json({ ok: false, message: '没有权限删除这条留言' }, { status: 403 });
  }

  list.splice(idx, 1);
  try {
    writeAll(list);
  } catch {
    return NextResponse.json({ ok: false, message: '服务器无法保存' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, admin });
}
