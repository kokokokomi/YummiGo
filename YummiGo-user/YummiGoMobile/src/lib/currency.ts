const CURRENCY_SCALE: Record<string, number> = {
  jpy: 0,
  krw: 0,
  vnd: 0,
  xof: 0,
  xaf: 0,
  xpf: 0,
  usd: 2,
  eur: 2,
  gbp: 2,
  cny: 2,
};

export function getCurrencyScale(currency?: string) {
  const key = String(currency || "jpy").toLowerCase();
  return CURRENCY_SCALE[key] ?? 2;
}

export function normalizeMajorAmount(amount: number, currency?: string) {
  const scale = getCurrencyScale(currency);
  const factor = 10 ** scale;
  return Math.round((Number(amount) + Number.EPSILON) * factor) / factor;
}

export function toMinorUnit(amount: number, currency?: string) {
  const scale = getCurrencyScale(currency);
  const factor = 10 ** scale;
  return Math.round((Number(amount) + Number.EPSILON) * factor);
}

