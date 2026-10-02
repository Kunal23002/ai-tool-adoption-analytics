import dashboard from './data/dashboard.json'
import type { DashboardData } from './data/types'
import { IndustryAdoption } from './components/IndustryAdoption'
import { KpiRow } from './components/KpiRow'
import { TimeCost } from './components/TimeCost'
import { UserSegmentation } from './components/UserSegmentation'

const data = dashboard as DashboardData

export default function App() {
  const totalHours = data.industrySummary.reduce((s, r) => s + r.total_hours_saved, 0)
  const totalCost = data.industrySummary.reduce((s, r) => s + r.total_cost_usd, 0)

  return (
    <div className="app-shell">
      <header className="site-header rise">
        <div className="brand-block">
          <h1 className="brand">
            AdoptLens <span>Analytics</span>
          </h1>
          <p className="lede">
            AI tool adoption across industries — time saved, spend, and user segments from a
            lightweight Excel → MySQL → Spark → Redshift → Tableau-style pipeline.
          </p>
        </div>
        <div className="pipeline-strip" aria-label="Pipeline stages">
          <span className="step">Excel / CSV</span>
          <span className="arrow">→</span>
          <span className="step">MySQL</span>
          <span className="arrow">→</span>
          <span className="step">Spark agg</span>
          <span className="arrow">→</span>
          <span className="step">Star schema</span>
          <span className="arrow">→</span>
          <span className="step">Dashboard</span>
        </div>
      </header>

      <KpiRow
        users={data.meta.users}
        tools={data.meta.tools}
        hours={totalHours}
        cost={totalCost}
        events={data.meta.usageEvents}
      />

      <IndustryAdoption
        industrySummary={data.industrySummary}
        adoption={data.adoptionByIndustryTool}
      />

      <TimeCost industrySummary={data.industrySummary} monthly={data.monthlyIndustry} />

      <UserSegmentation users={data.userMetrics} />

      <footer className="site-footer">
        <span>Synthetic demo data · {data.meta.usageEvents} usage logs · SQLite warehouse in /data</span>
        <span>Portfolio project · AI Tool Adoption Analytics</span>
      </footer>
    </div>
  )
}
