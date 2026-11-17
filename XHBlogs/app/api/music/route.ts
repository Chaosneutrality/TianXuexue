import { NextRequest, NextResponse } from 'next/server'

const NET_EASE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  Referer: 'https://music.163.com/',
}

// 服务端把 meting 的 302 解析成网易云 CDN 直链再返回给浏览器。
// 原因：手机（尤其蜂窝网络）经常连不上第三方域名 meting.liveling.top，
// 而 m801/m8.music.126.net 是网易云自家国内 CDN，手机直连没问题。
// 解析失败会退回接口地址，行为与改动前一致。
async function resolvePlayUrl(songId: string): Promise<string> {
  const fallback = `https://meting.liveling.top/api?server=netease&type=url&id=${songId}`
  try {
    const res = await fetch(fallback, {
      headers: NET_EASE_HEADERS,
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    })
    const location = res.headers.get('location')
    if (location && /^https?:\/\//i.test(location)) return location
  } catch {
    /* 解析失败就用接口地址，让浏览器自己跟随 302 */
  }
  return fallback
}

type SongResult = {
  id: string
  name?: string
  artist?: string
  author?: string
  cover?: string
  pic?: string
  url?: string
  lrc?: string
  error?: string
}

export async function GET(request: NextRequest) {
  const ids = request.nextUrl.searchParams.get('ids')
  if (!ids) {
    return NextResponse.json({ error: 'Missing ids parameter' }, { status: 400 })
  }

  const songIds = ids.split(',').map((id) => id.trim()).filter(Boolean)

  const results: SongResult[] = await Promise.all(
    songIds.map(async (songId): Promise<SongResult> => {
      try {
        const [detailRes, lrcRes] = await Promise.all([
          fetch(
            `https://music.163.com/api/song/detail/?id=${songId}&ids=[${songId}]`,
            { headers: NET_EASE_HEADERS, signal: AbortSignal.timeout(6000) },
          ),
          fetch(
            `https://music.163.com/api/song/lyric?id=${songId}&lv=-1&kv=-1&tv=-1`,
            { headers: NET_EASE_HEADERS, signal: AbortSignal.timeout(6000) },
          ).catch(() => null),
        ])

        const detail = await detailRes.json()
        const song = detail.songs?.[0]

        if (!song) {
          return { id: songId, error: 'not_found' }
        }

        let lrcText = ''
        if (lrcRes && lrcRes.ok) {
          try {
            const lrcData = await lrcRes.json()
            lrcText = lrcData.lrc?.lyric || ''
          } catch {
            /* 歌词可选，失败不影响主流程 */
          }
        }

        const artistName = song.artists?.[0]?.name || '未知歌手'

        return {
          id: songId,
          name: song.name,
          artist: artistName,
          author: artistName,
          cover: song.album?.picUrl || '',
          pic: song.album?.picUrl || '',
          // 音源：服务端已把 meting 的 302 解析成网易云 CDN 直链，
          // 手机端不必再访问第三方域名，直连 m801/m8.music.126.net
          url: await resolvePlayUrl(songId),
          lrc: lrcText,
        }
      } catch (error) {
        console.error(`[api/music] 获取歌曲 ${songId} 失败:`, error)
        return { id: songId, error: String(error) }
      }
    }),
  )

  return NextResponse.json(results)
}
