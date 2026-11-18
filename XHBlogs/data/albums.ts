// 🛡️ 本文件由 XingHuiSama 控制台自动生成，请勿手动修改
export interface Photo { url: string; caption?: string; }
export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }

export const albums: Album[] = [
  {
    "description": "我们天雪雪世界第一！",
    "title": "美者颜如玉",
    "id": "album_1795008519451",
    "photos": [
      {
        "url": "https://files.seeusercontent.com/2026/11/18/6Cdb/3.png"
      },
      {
        "url": "https://files.seeusercontent.com/2026/11/18/wCz2/2.png"
      },
      {
        "url": "https://files.seeusercontent.com/2026/11/18/8xsH/1.png"
      }
    ],
    "date": "2026-11-18"
  }
];