"use client";

import { useEffect, useState } from 'react';

// 正文图片点击放大（事件委托版）。
// 不依赖"挂载时图片已存在"，也不受图片后来才渲染的影响；
// 挂载成功后会在 <html> 上打 data-image-zoom="on"，便于自检。
export default function ArticleImageZoom() {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.dataset.imageZoom = 'on';

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const img = target.closest('.prose img') as HTMLImageElement | null;
      if (!img) return;
      if (img.closest('a')) return; // 图片外面有链接时，交给链接处理
      const big = img.currentSrc || img.src;
      if (big) {
        event.preventDefault();
        setSrc(big);
      }
    };

    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('click', onClick);
      delete document.documentElement.dataset.imageZoom;
    };
  }, []);

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
      className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
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
