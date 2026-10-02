import { useMemo } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import type { IndustrySummary, MonthlyIndustry } from '../data/types'

const TEAL = '#0a5c63'
const AMBER = '#d4922a'

type Props = {
  industrySummary: IndustrySummary[]
  monthly: MonthlyIndustry[]
}

export function TimeCost({ industrySummary, monthly }: Props) {
  const scatter = useMemo(
    () =>
      industrySummary.map((r) => ({
        industry: r.industry,
        cost: Math.round(r.total_cost_usd),
        hours: Math.round(r.total_hours_saved),
        users: r.active_users,
        roi: r.hours_per_dollar,
      })),
    [industrySummary],
  )

  const trend = useMemo(() => {
    const months = [...new Set(monthly.map((m) => m.month_key))].sort()
    return months.map((month) => {
      const rows = monthly.filter((m) => m.month_key === month)
      return {
        month: month.slice(2), // YY-MM → shorter: actually 2024-10 → keep MM label
        label: month.slice(5),
        hours: Math.round(rows.reduce((s, r) => s + r.total_hours_saved, 0)),
        cost: Math.round(rows.reduce((s, r) => s + r.total_cost_usd, 0)),
      }
    })
  }, [monthly])

  return (
    <section className="section rise rise-delay-3">
      <div className="section-head">
        <div>
          <h2>Time saved vs cost</h2>
          <p>ROI signal: hours returned per dollar spent, by industry and over time.</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="chart-wrap tall">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,92,99,0.12)" />
                <XAxis
                  type="number"
                  dataKey="cost"
                  name="Cost"
                  unit="$"
                  tick={{ fill: '#6b7c84', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: 'Cost (USD)', position: 'insideBottom', offset: -2, fill: '#6b7c84', fontSize: 12 }}
                />
                <YAxis
                  type="number"
                  dataKey="hours"
                  name="Hours"
                  tick={{ fill: '#6b7c84', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: 'Hours saved', angle: -90, position: 'insideLeft', fill: '#6b7c84', fontSize: 12 }}
                />
                <ZAxis type="number" dataKey="users" range={[80, 280]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload as (typeof scatter)[0]
                    return (
                      <div
                        style={{
                          background: 'rgba(255,255,255,0.96)',
                          border: '1px solid rgba(10,92,99,0.14)',
                          borderRadius: 10,
                          padding: '0.6rem 0.75rem',
                          fontSize: 13,
                        }}
                      >
                        <strong>{d.industry}</strong>
                        <div>
                          {d.hours}h saved · ${d.cost} · ROI {d.roi.toFixed(2)} h/$
                        </div>
                      </div>
                    )
                  }}
                />
                <Scatter name="Industry" data={scatter} fill={TEAL} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="chart-wrap tall">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,92,99,0.12)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#3d4f56', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7c84', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid rgba(10,92,99,0.14)',
                    background: 'rgba(255,255,255,0.95)',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="hours"
                  name="Hours saved"
                  stroke={TEAL}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: TEAL }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="cost"
                  name="Cost (USD)"
                  stroke={AMBER}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: AMBER }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  )
}
