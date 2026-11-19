import { NextResponse } from 'next/server';
import { AUTH_COOKIE, AUTH_TOKEN, passwordOk } from '../../../lib/auth';

export async function POST(request: Request) {
  let password = '';
  try {
    const body = await request.json();
    password = String(body?.password ?? '');
  } catch {
    password = '';
  }

  if (!passwordOk(password)) {
    return NextResponse.json({ ok: false, message: '暗号不对哦' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE, AUTH_TOKEN, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
