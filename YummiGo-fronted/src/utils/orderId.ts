/** Snowflake 订单 ID：全程用字符串，禁止 Number(id) */
export function normalizeOrderId(id: unknown): string | null {
  if (id === null || id === undefined) return null
  const s = String(id).trim()
  if (!/^\d+$/.test(s)) return null
  return s
}

export function normalizeOrderRecord<T extends Record<string, unknown>>(row: T): T {
  const id = normalizeOrderId(row.id)
  if (!id) return row
  return { ...row, id }
}

/** 详情弹窗内优先用详情接口返回的 id（最准确） */
export function resolveActiveOrderId(
  sources: { detailId?: unknown; cachedId?: unknown; rowId?: unknown } = {}
): string | null {
  return normalizeOrderId(sources.detailId ?? sources.cachedId ?? sources.rowId)
}
