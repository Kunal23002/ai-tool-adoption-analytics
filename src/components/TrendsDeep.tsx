import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { IndustrySummary, MonthlyIndustry, UserMetric } from '../data/types'
import { COLORS, PALETTE, axisTick, axisTickDark, tooltipStyle } from './chartTheme'

type Props = {
  monthly: MonthlyIndustry[]
  industrySummary: IndustrySummary[]
  users: UserMetric[]
}

export function TrendsDeep({ monthly, industrySummary, users }: Props) {
  const industries = useMemo(
    () => [...new Set(monthly.map((m) => m.industry))].sort(),
    [monthly],
  )

  const stacked = useMemo(() => {
    const months = [...new Set(monthly.map((m) => m.month_key))].sort()
    return months.map((month) => {
      const row: Record<string, string | number> = { month: month.slice(5) }
      for (const ind of industries) {
        const hit = monthly.find((m) => m.month_key === month && m.industry === ind)
        row[ind] = hit ? Math.round(hit.total_sessions) : 0
      }
      return row
    })
  }, [monthly, industries])

  const roiBars = useMemo(
    () =>
      [...industrySummary]
        .sort((a, b) => b.hours_per_dollar - a.hours_per_dollar)
        .map((r) => ({
          industry: r.industry,
          roi: Number(r.hours_per_dollar.toFixed(2)),
          sessions: r.total_sessions,
        })),
    [industrySummary],
  )

  const satisfaction = useMemo(() => {
    const map = new Map<string, { sum: number; n: number }>()
    for (const u of users) {
      if (u.avg_satisfaction == null) continue
      const cur = map.get(u.segment) ?? { sum: 0, n: 0 }
      cur.sum += u.avg_satisfaction
      cur.n += 1
      map.set(u.segment, cur)
    }
    return ['Power User', 'Regular', 'Explorer', 'Light']
      .filter((s) => map.has(s))
      .map((segment) => {
        const v = map.get(segment)!
        return {
          segment,
          satisfaction: Math.round((v.sum / v.n) * 10) / 10,
        }
      })
  }, [users])

  return (
    <section className="section rise rise-delay-4">
      <div className="section-head">
        <div>
          <h2>Trends, ROI & satisfaction</h2>
          <p>Session volume over time, industry ROI ranking, and segment satisfaction.</p>
        </div>
      </div>

      <div className="grid-3">
        <div className="panel span-2">
          <h3 className="chart-title">Monthly sessions by industry</h3>
          <div className="chart-wrap tall">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stacked} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,92,99,0.12)" vertical={false} />
                <XAxis dataKey="month" tick={axisTickDark} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                {industries.map((ind, i) => (
                  <Area
                    key={ind}
                    type="monotone"
                    dataKey={ind}
                    stackId="1"
                    stroke={PALETTE[i % PALETTE.length]}
                    fill={PALETTE[i % PALETTE.length]}
                    fillOpacity={0.55}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <h3 className="chart-title">ROI hours / $</h3>
          <div className="chart-wrap tall">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={roiBars}
                layout="vertical"
                margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,92,99,0.12)" horizontal={false} />
                <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="industry"
                  width={88}
                  tick={{ fill: '#3d4f56', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="roi" name="Hours / $" fill={COLORS.teal} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: '1rem' }}>
        <div className="panel">
          <h3 className="chart-title">Satisfaction by segment</h3>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={satisfaction} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,92,99,0.12)" vertical={false} />
                <XAxis dataKey="segment" tick={axisTickDark} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 5]} tick={axisTick} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="satisfaction" name="Avg score" fill={COLORS.sage} radius={[4, 4, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="satisfaction"
                  stroke={COLORS.coral}
                  strokeWidth={2}
                  dot={{ r: 4, fill: COLORS.coral }}
                  legendType="none"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <h3 className="chart-title">Sessions vs cost by industry</h3>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={industrySummary.map((r) => ({
                  industry: r.industry.slice(0, 4),
                  sessions: r.total_sessions,
                  cost: Math.round(r.total_cost_usd),
                }))}
                margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,92,99,0.12)" vertical={false} />
                <XAxis dataKey="industry" tick={axisTickDark} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={axisTick} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar yAxisId="left" dataKey="sessions" name="Sessions" fill={COLORS.tealMid} radius={[4, 4, 0, 0]} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cost"
                  name="Cost $"
                  stroke={COLORS.amber}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: COLORS.amber }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  )
}
