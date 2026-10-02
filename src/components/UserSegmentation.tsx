import { useMemo, useState } from 'react'
import type { UserMetric } from '../data/types'

const ORDER = ['Power User', 'Regular', 'Explorer', 'Light'] as const

const FILL: Record<string, string> = {
  'Power User': 'power',
  Regular: 'regular',
  Explorer: 'explorer',
  Light: 'light',
}

type Props = {
  users: UserMetric[]
}

export function UserSegmentation({ users }: Props) {
  const [segment, setSegment] = useState<string>('All')

  const counts = useMemo(() => {
    const map = Object.fromEntries(ORDER.map((s) => [s, 0])) as Record<string, number>
    for (const u of users) map[u.segment] = (map[u.segment] ?? 0) + 1
    return map
  }, [users])

  const max = Math.max(...Object.values(counts), 1)

  const filtered = useMemo(() => {
    const rows = segment === 'All' ? users : users.filter((u) => u.segment === segment)
    return [...rows].sort((a, b) => b.total_hours_saved - a.total_hours_saved)
  }, [users, segment])

  return (
    <section className="section rise rise-delay-4">
      <div className="section-head">
        <div>
          <h2>User segmentation</h2>
          <p>Power / Regular / Explorer / Light — from sessions, hours saved, and tool breadth.</p>
        </div>
        <div className="filters" role="group" aria-label="Filter by segment">
          <button
            type="button"
            className={`filter-btn ${segment === 'All' ? 'active' : ''}`}
            onClick={() => setSegment('All')}
          >
            All
          </button>
          {ORDER.map((s) => (
            <button
              key={s}
              type="button"
              className={`filter-btn ${segment === s ? 'active' : ''}`}
              onClick={() => setSegment(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="segment-list">
            {ORDER.map((s, i) => (
              <div className="segment-row" key={s}>
                <span className="segment-name">{s}</span>
                <div className="segment-track">
                  <div
                    className={`segment-fill ${FILL[s]}`}
                    style={{
                      width: `${(counts[s] / max) * 100}%`,
                      animationDelay: `${0.1 + i * 0.08}s`,
                    }}
                  />
                </div>
                <span className="segment-count">
                  {counts[s]} user{counts[s] === 1 ? '' : 's'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel table-wrap">
          <table className="users">
            <thead>
              <tr>
                <th>User</th>
                <th>Industry</th>
                <th>Segment</th>
                <th>Hours</th>
                <th>Cost</th>
                <th>ROI</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.user_key}>
                  <td>{u.user_name}</td>
                  <td>{u.industry}</td>
                  <td>
                    <span className={`badge ${FILL[u.segment] ?? 'light'}`}>{u.segment}</span>
                  </td>
                  <td>{u.total_hours_saved.toFixed(1)}</td>
                  <td>${u.total_cost_usd.toFixed(0)}</td>
                  <td>{u.roi_hours_per_dollar.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
