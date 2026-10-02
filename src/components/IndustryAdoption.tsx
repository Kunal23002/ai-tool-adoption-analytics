import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { IndustrySummary, AdoptionRow } from '../data/types'

const TEAL = '#0a5c63'
const AMBER = '#d4922a'
const SAGE = '#6f9b7f'

type Props = {
  industrySummary: IndustrySummary[]
  adoption: AdoptionRow[]
}

export function IndustryAdoption({ industrySummary, adoption }: Props) {
  const industries = useMemo(
    () => industrySummary.map((r) => r.industry),
    [industrySummary],
  )
  const [selected, setSelected] = useState<string>('All')

  const barData = useMemo(() => {
    return industrySummary.map((r) => ({
      industry: r.industry,
      users: r.active_users,
      sessions: r.total_sessions,
      tools: r.tools_adopted,
    }))
  }, [industrySummary])

  const topTools = useMemo(() => {
    const rows =
      selected === 'All' ? adoption : adoption.filter((a) => a.industry === selected)
    const byTool = new Map<string, { name: string; sessions: number; hours: number }>()
    for (const r of rows) {
      const cur = byTool.get(r.tool_key) ?? { name: r.tool_name, sessions: 0, hours: 0 }
      cur.sessions += r.total_sessions
      cur.hours += r.total_hours_saved
      byTool.set(r.tool_key, cur)
    }
    return [...byTool.values()]
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 6)
      .map((t) => ({ tool: t.name, sessions: t.sessions, hours: Math.round(t.hours) }))
  }, [adoption, selected])

  return (
    <section className="section rise rise-delay-2">
      <div className="section-head">
        <div>
          <h2>AI tool adoption by industry</h2>
          <p>Active users, sessions, and tool breadth from the star-schema fact tables.</p>
        </div>
        <div className="filters" role="group" aria-label="Filter by industry">
          <button
            type="button"
            className={`filter-btn ${selected === 'All' ? 'active' : ''}`}
            onClick={() => setSelected('All')}
          >
            All
          </button>
          {industries.map((ind) => (
            <button
              key={ind}
              type="button"
              className={`filter-btn ${selected === ind ? 'active' : ''}`}
              onClick={() => setSelected(ind)}
            >
              {ind}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="chart-wrap tall">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,92,99,0.12)" vertical={false} />
                <XAxis dataKey="industry" tick={{ fill: '#3d4f56', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7c84', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid rgba(10,92,99,0.14)',
                    background: 'rgba(255,255,255,0.95)',
                  }}
                />
                <Legend />
                <Bar dataKey="users" name="Active users" fill={TEAL} radius={[4, 4, 0, 0]} />
                <Bar dataKey="tools" name="Tools adopted" fill={AMBER} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="chart-wrap tall">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topTools}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,92,99,0.12)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#6b7c84', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="tool"
                  width={110}
                  tick={{ fill: '#3d4f56', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid rgba(10,92,99,0.14)',
                    background: 'rgba(255,255,255,0.95)',
                  }}
                />
                <Bar dataKey="sessions" name="Sessions" fill={SAGE} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  )
}
