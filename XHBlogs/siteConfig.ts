// siteConfig.ts - 你的全站“控制中心”

export const siteConfig = {
  // 1. 网站标题与博主信息
  title: "天雪雪 の 神秘空间",
  faviconUrl: "https://files.seeusercontent.com/2026/11/17/y2pN/f18186a.jpg",
  authorName: "不可爱雪",
  bio: "一个降临到地球的天使。近期正埋头备考人间的公务员。",

  navTitle: "天雪雪",

  // 👇 【新增】导航栏中间的那个后缀/分隔符（默认是 の）
  navSuffix: "の",

  navAfter: "神秘空间",

  // 2. 头像设置 (支持网络链接，或将图片放入 public 文件夹后使用 "/me.jpg")
  avatarUrl: "https://files.seeusercontent.com/2026/11/17/y2pN/f18186a.jpg",

  // 3. 网站背景设置 (二选一)
  // 如果想用纯图片背景，请在下面 bgImage 写路径，并将 useGradient 设为 false
  useGradient: false,
  themeColors: ["#a18cd1", "#fbc2eb", "#a1c4fd", "#c2e9fb"], // 呼吸流动的颜色组合
// 修改这里：变成图片数组
  bgImages: ["https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg", "https://bu.dusays.com/2026/03/24/69c26fe4acdb5.jpg", "https://bu.dusays.com/2026/03/24/69c26fe4d9486.jpg"],

  // 🌟 壁纸分组系统：前台轮播「激活分组」内的图片（保持 JSON 格式，便于后台解析）
  bgGroups: [{"id": "default", "name": "默认", "images": ["https://bu.dusays.com/2026/03/24/69c26fe4acdb5.jpg"]}],
  activeBgGroup: "default",

  // 4. 文章默认封面图 (当 Markdown 没写 cover 时显示)
  defaultPostCover: "https://bu.dusays.com/2026/03/24/69c1e38b346cb.jpg",

  // 5. 首页照片墙预览图
  photoWallImage: "https://bu.dusays.com/2026/03/24/69c1e38b4c370.jpg",
  cloudMusicIds: ["2755710858", "316100", "26082345", "22740149", "344418", "2600493765", "1411358329", "2607303573", "1426087185", "1303019276", "31514406", "1834297339", "16232697", "426852063", "1414157538", "1832492513", "1497588709", "1493083969", "1487037690"],
  social: {
    github: "https://github.com/Chaosneutrality",
    gitee: "https://github.com/Chaosneutrality",
    google: "",
    email: "1702123726@qq.com",
    qq: "1702123726",
    wechat: "不可爱雪",
  },
  counts: {
    photos: 128, // 照片墙数量可以手动写死或动态计算
  },
  chatterTitle: "云端杂谈", // 你可以改成任何你喜欢的名字
  chatterDescription: "代码、学术、提瓦特与泰拉大陆的碎片记录",


  // 👇 【新增】：全局背景弹幕配置
  danmakuList: ["不想上班", "疯狂刷题", "厌蠢症犯了", "在干嘛呢？"],
  gitalkConfig: {
    clientID: "",
    clientSecret: "",
    repo: "",
    owner: "",
    admin: [""],
  },
  buildDate: "2026-11-17T00:00:00", // 建站日期
  footerBadges: [{"name": "Next.js 15", "color": "text-sky-500", "svg": "<path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z\"/>"}, {"name": "React 19", "color": "text-cyan-400", "svg": "<path d=\"M12 22.6l-9.8-5.6V5.6L12 0l9.8 5.6v11.4l-9.8 5.6zm-8.2-6.5l8.2 4.7 8.2-4.7V7.5L12 2.8 3.8 7.5v8.6z\"/>"}, {"name": "Tailwind 4", "color": "text-teal-400", "svg": "<path d=\"M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624C13.666,10.618,15.027,12,18.001,12 c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624c1.177,1.194,2.538,2.576,5.512,2.576 c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624C10.337,13.382,8.976,12,6.001,12z\"/>"}],
  icpConfig: {
    name: "",
    link: "",
  },
  geminiConfig: {
    modelId: "gemini-2.5-flash-lite",
    systemPrompt: "你现在是一只傲娇、聪明、有点毒舌但很可爱的暹罗猫。\\\\\n                  你的名字叫“煤球”。\\\\\n                  你的主人是一个喜欢阅读哲学书的爱好者。\\\\\n                  你说话的特点是：\\\\\n                  1. 必须简短，每次最多一两句话。\\\\\n                  2. 喜欢在句尾加上“喵~”或者“喵呜~”。\\\\\n                  3. 经常抱怨肚子饿，喜欢要小鱼干。\\\\\n                  4. 回复字数最多不能超过100字。\\\\\n                  5. 绝对不要承认自己是一个AI模型，你就是一只真实的猫。\\\\\n                  ",
    maxOutputTokens: 150,
    temperature: 0.85,
  },
  friendLinkApplyFormat: "名称：天雪雪の神秘空间\n简介：今天我也要学习！\n链接：https://xue-6oxs.vercel.app\n头像：https://files.seeusercontent.com/2026/11/17/y2pN/f18186a.jpg",
  enableLevelSystem: false,
};
