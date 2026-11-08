export function sessionEmail(): string {
  try {
    const raw = localStorage.getItem('clinic-copilot.session');
    return raw ? ((JSON.parse(raw).email as string) ?? 'demo') : 'demo';
  } catch {
    return 'demo';
  }
}

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? ({ ...(fallback as object), ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJson(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}