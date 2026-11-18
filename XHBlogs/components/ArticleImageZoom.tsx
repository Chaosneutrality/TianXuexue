"use client";

import { useEffect, useState } from 'react';

// 正文图片点击放大：点图弹全屏，点背景 / 右上角 × / Esc 关闭
export default function ArticleImageZoom({ selector = '.prose img' }: { selector?: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const imgs = Array.from(document.querySelectorAll<HTMLImageElement>(selector));
    const onClick = (event: Event) => {
      const img = event.currentTarget as HTMLImageElement;
      if (img.closest('a')) return; // 被链接包住的图片不拦截点击
      const big = img.currentSrc || img.src;
      if (big) setSrc(big);
    };
    imgs.forEach((img) => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', onClick);
    });
    return () => imgs.forEach((img) => img.removeEventListener('click', onClick));
  }, [selector]);

  useEffect(() => {
    if (!src) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSrc(null);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [src]);

  if (!src) return null;

  return (
    <div
      onClick={() => setSrc(null)}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
    >
      <img
        src={src}
        alt="预览"
        className="max-w-full max-h-[92vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
      />
      <button
        type="button"
        aria-label="关闭"
        onClick={(event) => {
          event.stopPropagation();
          setSrc(null);
        }}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 text-white text-2xl leading-none hover:bg-white/30 transition-colors"
      >
        ×
      </button>
    </div>
  );
}
