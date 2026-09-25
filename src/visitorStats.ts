const localVisitKey = 'linguaflow-local-visits'

export type VisitorStats = {
  count: number
  shared: boolean
}

export async function registerVisit(): Promise<VisitorStats> {
  const localCount = Number(window.localStorage.getItem(localVisitKey) ?? '0') + 1
  window.localStorage.setItem(localVisitKey, String(localCount))

  const endpoint = import.meta.env.VITE_VISITOR_STATS_URL
  if (!endpoint) return { count: localCount, shared: false }

  try {
    const response = await fetch(`${endpoint.replace(/\/$/, '')}/visit`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) throw new Error('Visitor endpoint unavailable')
    const data = await response.json() as { count?: number }
    return { count: typeof data.count === 'number' ? data.count : localCount, shared: true }
  } catch {
    return { count: localCount, shared: false }
  }
}
