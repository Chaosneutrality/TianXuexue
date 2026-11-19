// 站点访问控制的常量与校验（改密码就改这里）
export const AUTH_COOKIE = 'site_auth';
export const AUTH_TOKEN = 'xuexue-private-2026';
export const SITE_PASSWORD = 'xuexue1120';

export function passwordOk(input: string): boolean {
  return String(input || '').trim() === SITE_PASSWORD;
}
