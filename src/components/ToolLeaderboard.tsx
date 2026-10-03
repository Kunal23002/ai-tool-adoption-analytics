import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import type { AdoptionRow, ToolDim } from '../data/types'
import { COLORS, PALETTE, axisTick, tooltipStyle } from './chartTheme'

type Props = {
  adoption: AdoptionRow[]
  tools: ToolDim[]
}

export function ToolLeaderboard({ adoption, tools }: Props) {
  const topTools = useMemo(() => {
    const map = new Map<
      string,
      { name: string; hours: number; cost: number; sessions: number; completion: number; n: number }
    >()
    for (const r of adoption) {
      const cur = map.get(r.tool_key) ?? {
        name: r.tool_name,
        hours: 0,
        cost: 0,
        sessions: 0,
        completion: 0,
        n: 0,
      }
      cur.hours += r.total_hours_saved
      cur.cost += r.total_cost_usd
      cur.sessions += r.total_sessions
      cur.completion += r.completion_rate
      cur.n += 1
      map.set(r.tool_key, cur)
    }
    return [...map.values()]
      .map((t) => ({
        tool: t.name.length > 18 ? `${t.name.slice(0, 16)}…` : t.name,
        full: t.name,
        hours: Math.round(t.hours),
        cost: Math.round(t.cost),
        sessions: t.sessions,
        completion: Math.round((t.completion / t.n) * 100),
        roi: t.cost > 0 ? Number((t.hours / t.cost).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.hours - a.hours)
  }, [adoption])

  const bubble = useMemo(() => {
    const usage = new Map<string, number>()
    for (const r of adoption) {
      usage.set(r.tool_key, (usage.get(r.tool_key) ?? 0) + r.total_sessions)
    }
    return tools.map((t) => ({
      name: t.tool_name,
      cost: t.monthly_cost_usd,
      sessions: usage.get(t.tool_key) ?? 0,
      category: t.category,
    }))
  }, [adoption, tools])

  return (
    <section className="section rise rise-delay-3">
      <div className="section-head">
        <div>
          <h2>Tool leaderboard</h2>
          <p>Hours saved leaders and license cost vs real session demand.</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <h3 className="chart-title">Top tools by hours saved</h3>
          <div className="chart-wrap tall">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topTools.slice(0, 8)}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 4, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,92,99,0.12)" horizontal={false} />
                <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="tool"
                  width={120}
                  tick={{ fill: '#3d4f56', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => [value, String(name)]}
                  labelFormatter={(_, payload) => {
                    const p = payload?.[0]?.payload as { full?: string } | undefined
                    return p?.full ?? ''
                  }}
                />
                <Bar dataKey="hours" name="Hours saved" radius={[0, 4, 4, 0]}>
                  {topTools.slice(0, 8).map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <h3 className="chart-title">License cost vs sessions</h3>
          <div className="chart-wrap tall">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,92,99,0.12)" />
                <XAxis
                  type="number"
                  dataKey="cost"
                  name="Monthly cost"
                  unit="$"
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: 'Monthly license ($)',
                    position: 'insideBottom',
                    offset: -2,
                    fill: '#6b7c84',
                    fontSize: 12,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="sessions"
                  name="Sessions"
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: 'Sessions',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#6b7c84',
                    fontSize: 12,
                  }}
                />
                <ZAxis type="number" dataKey="sessions" range={[60, 260]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload as (typeof bubble)[0]
                    return (
                      <div style={{ ...tooltipStyle, padding: '0.6rem 0.75rem' }}>
                        <strong>{d.name}</strong>
                        <div>
                          ${d.cost}/mo · {d.sessions} sessions · {d.category}
                        </div>
                      </div>
                    )
                  }}
                />
                <Scatter name="Tools" data={bubble} fill={COLORS.teal} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  )
}
