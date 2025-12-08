'use server';

import { cookies } from 'next/headers';
import { ThemeKey } from './definitions';

const THEME_COOKIE_NAME = 'theme-preference';

export async function getThemePreference(): Promise<ThemeKey> {
  const cookieStore = await cookies();
  const theme = cookieStore.get(THEME_COOKIE_NAME);
  return (theme?.value as ThemeKey) || 'doom';
}

export async function setThemePreference(theme: ThemeKey) {
  const cookieStore = await cookies();
  cookieStore.set(THEME_COOKIE_NAME, theme, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  });
}
