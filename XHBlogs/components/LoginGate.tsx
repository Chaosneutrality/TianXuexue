"use client";

import { useState } from 'react';
import { siteConfig } from '../siteConfig';

// 全站访问「暗号」输入页
export default function LoginGate() {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: value }),
      });
      if (res.ok) {
        window.location.reload();
        return;
      }
      setError('暗号不对，再想想～');
    } catch {
      setError('网络出了点问题，稍后再试');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-6">
      {/* 背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b1220] via-[#141b34] to-[#1f1230]" />
      <div className="absolute inset-0 opacity-60" style={{
        backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(129,140,248,0.35), transparent 45%), radial-gradient(circle at 80% 70%, rgba(236,72,153,0.28), transparent 45%)',
      }} />

      {/* 卡片 */}
      <form
        onSubmit={submit}
        className="relative w-full max-w-sm rounded-3xl border border-white/15 bg-white/10 px-7 py-9 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
      >
        <p className="text-center text-[11px] font-black tracking-[0.35em] text-indigo-300/90">PRIVATE SPACE</p>
        <h1 className="mt-3 text-center text-2xl font-black text-white drop-shadow">
          {siteConfig.title || '秘密空间'}
        </h1>
        <p className="mt-2 text-center text-sm text-slate-300/80">请输入暗号</p>

        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          placeholder="暗号"
          className="mt-7 w-full rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-center text-white placeholder:text-slate-500 outline-none transition focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-500/30"
        />

        {error && <p className="mt-3 text-center text-xs font-bold text-rose-300">{error}</p>}

        <button
          type="submit"
          disabled={loading || value.trim().length === 0}
          className="mt-5 w-full rounded-2xl bg-indigo-500 py-3 text-sm font-black text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? '验证中…' : '进 入'}
        </button>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-400/80">
          提示：你的名字 + 生日
        </p>
      </form>
    </div>
  );
}
