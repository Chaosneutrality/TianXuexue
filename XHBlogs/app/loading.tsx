// 路由切换时的即时反馈，避免"点了没反应"的错觉
export default function Loading() {
  return (
    <div className="fixed inset-0 z-[500] pointer-events-none flex items-start justify-center pt-32">
      <div className="flex flex-col items-center gap-3">
        <div className="h-9 w-9 rounded-full border-2 border-indigo-400/25 border-t-indigo-400 animate-spin" />
        <p className="text-[10px] font-black tracking-[0.3em] text-slate-400/80">LOADING</p>
      </div>
    </div>
  );
}
