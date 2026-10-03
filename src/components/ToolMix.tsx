import { useMemo } from 'react'
import {
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { AdoptionRow, ToolDim } from '../data/types'
import { PALETTE, tooltipStyle } from './chartTheme'

type Props = {
  adoption: AdoptionRow[]
  tools: ToolDim[]
}

export function ToolMix({ adoption, tools }: Props) {
  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of adoption) {
      map.set(r.category, (map.get(r.category) ?? 0) + r.total_sessions)
    }
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [adoption])

  const completionRadar = useMemo(() => {
    const map = new Map<string, { sum: number; n: number }>()
    for (const r of adoption) {
      const cur = map.get(r.category) ?? { sum: 0, n: 0 }
      cur.sum += r.completion_rate
      cur.n += 1
      map.set(r.category, cur)
    }
    return [...map.entries()].map(([category, { sum, n }]) => ({
      category,
      completion: Math.round((sum / n) * 100),
    }))
  }, [adoption])

  const licenseMix = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of tools) {
      map.set(t.license_type, (map.get(t.license_type) ?? 0) + 1)
    }
    return [...map.entries()].map(([name, value]) => ({ name, value }))
  }, [tools])

  return (
    <section className="section rise rise-delay-2">
      <div className="section-head">
        <div>
          <h2>Tool mix & completion</h2>
          <p>Category share of sessions, completion rates, and license footprint.</p>
        </div>
      </div>

      <div className="grid-3">
        <div className="panel">
          <h3 className="chart-title">Sessions by category</h3>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={88}
                  paddingAngle={3}
                >
                  {byCategory.map((_, i) => (
                    <Cell key={byCategory[i].name} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <h3 className="chart-title">Avg completion % by category</h3>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={completionRadar}>
                <PolarGrid stroke="rgba(10,92,99,0.18)" />
                <PolarAngleAxis dataKey="category" tick={{ fill: '#3d4f56', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#6b7c84', fontSize: 10 }} />
                <Radar
                  name="Completion %"
                  dataKey="completion"
                  stroke="#0a5c63"
                  fill="#147a82"
                  fillOpacity={0.35}
                />
                <Tooltip contentStyle={tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <h3 className="chart-title">Tools by license type</h3>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={licenseMix}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={88}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {licenseMix.map((_, i) => (
                    <Cell key={licenseMix[i].name} fill={PALETTE[(i + 2) % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  )
}
