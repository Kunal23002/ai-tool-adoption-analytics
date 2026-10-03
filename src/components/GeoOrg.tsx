import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { UserMetric } from '../data/types'
import { COLORS, PALETTE, axisTick, axisTickDark, tooltipStyle } from './chartTheme'

type Props = {
  users: UserMetric[]
}

export function GeoOrg({ users }: Props) {
  const byRegion = useMemo(() => {
    const map = new Map<string, { users: number; hours: number; cost: number }>()
    for (const u of users) {
      const cur = map.get(u.region) ?? { users: 0, hours: 0, cost: 0 }
      cur.users += 1
      cur.hours += u.total_hours_saved
      cur.cost += u.total_cost_usd
      map.set(u.region, cur)
    }
    return [...map.entries()]
      .map(([region, v]) => ({
        region,
        users: v.users,
        hours: Math.round(v.hours),
        cost: Math.round(v.cost),
      }))
      .sort((a, b) => b.hours - a.hours)
  }, [users])

  const bySize = useMemo(() => {
    const map = new Map<string, number>()
    for (const u of users) {
      map.set(u.company_size, (map.get(u.company_size) ?? 0) + 1)
    }
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [users])

  const byRole = useMemo(() => {
    const map = new Map<string, { hours: number; n: number }>()
    for (const u of users) {
      const cur = map.get(u.role) ?? { hours: 0, n: 0 }
      cur.hours += u.total_hours_saved
      cur.n += 1
      map.set(u.role, cur)
    }
    return [...map.entries()]
      .map(([role, v]) => ({
        role,
        avgHours: Math.round((v.hours / v.n) * 10) / 10,
      }))
      .sort((a, b) => b.avgHours - a.avgHours)
      .slice(0, 8)
  }, [users])

  return (
    <section className="section rise rise-delay-3">
      <div className="section-head">
        <div>
          <h2>Region, org size & roles</h2>
          <p>Where adoption concentrates across geography, company scale, and job function.</p>
        </div>
      </div>

      <div className="grid-3">
        <div className="panel">
          <h3 className="chart-title">Hours saved by region</h3>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byRegion} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,92,99,0.12)" vertical={false} />
                <XAxis dataKey="region" tick={axisTickDark} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="hours" name="Hours saved" radius={[4, 4, 0, 0]}>
                  {byRegion.map((_, i) => (
                    <Cell key={byRegion[i].region} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <h3 className="chart-title">Users by company size</h3>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bySize}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={86}
                  paddingAngle={2}
                >
                  {bySize.map((_, i) => (
                    <Cell key={bySize[i].name} fill={PALETTE[(i + 1) % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <h3 className="chart-title">Avg hours saved by role</h3>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byRole}
                layout="vertical"
                margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,92,99,0.12)" horizontal={false} />
                <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="role"
                  width={100}
                  tick={{ fill: '#3d4f56', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="avgHours" name="Avg hours" fill={COLORS.amber} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  )
}
