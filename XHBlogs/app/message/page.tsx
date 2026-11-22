"use client";

import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';

type Entry = { name: string; text: string; time: number };

function formatTime(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function MessagePage() {
  const [items, setItems] = useState<Entry[]>([]);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');

  const load = async () => {
    try {
      const res = await fetch('/api/message', { cache: 'no-store' });
      const data = await res.json();
      if (data?.ok) setItems(data.items || []);
    } catch {
      /* 忽略 */
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    if (!text.trim()) {
      setNotice('写点什么再发吧');
      return;
    }
    setSending(true);
    setNotice('');
    try {
      const res = await fetch('/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, text }),
      });
      const data = await res.json();
      if (data?.ok) {
        setText('');
        setNotice('已留言 ✨');
        await load();
      } else {
        setNotice(data?.message || '发送失败');
      }
    } catch {
      setNotice('网络出了点问题');
    }
    setSending(false);
  };

  return (
    <div className="min-h-screen relative">
      <Navbar />
      <PageTransition>
        <main className="w-[92%] md:w-[80%] max-w-3xl mx-auto mt-24 md:mt-28 pb-20 relative z-10">
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white mb-3">留 言</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            不需要注册，写个名字就能留言。想说什么都行。
          </p>

          <form
            onSubmit={submit}
            className="rounded-3xl border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl p-5 md:p-7 shadow-xl"
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              placeholder="你的名字（不填就是匿名）"
              className="w-full rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-400"
            />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={300}
              rows={4}
              placeholder="想说的话…"
              className="mt-3 w-full rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-400 resize-none"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-400">{text.length}/300</span>
              <div className="flex items-center gap-3">
                {notice && <span className="text-xs font-bold text-indigo-500">{notice}</span>}
                <button
                  type="submit"
                  disabled={sending}
                  className="rounded-2xl bg-indigo-500 px-6 py-2.5 text-sm font-black text-white shadow-lg shadow-indigo-900/30 transition hover:bg-indigo-400 disabled:opacity-60"
                >
                  {sending ? '发送中…' : '发送'}
                </button>
              </div>
            </div>
          </form>

          <div className="mt-10 space-y-4">
            {items.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-10">还没有留言，第一条留给你。</p>
            )}
            {items.map((it, i) => (
              <div
                key={`${it.time}-${i}`}
                className="rounded-2xl border border-white/40 dark:border-white/10 bg-white/50 dark:bg-slate-800/40 backdrop-blur-md px-5 py-4 shadow"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-black text-indigo-500">{it.name}</span>
                  <span className="text-[11px] text-slate-400">{formatTime(it.time)}</span>
                </div>
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{it.text}</p>
              </div>
            ))}
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
