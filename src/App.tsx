import dashboard from './data/dashboard.json'
import type { DashboardData } from './data/types'
import { GeoOrg } from './components/GeoOrg'
import { IndustryAdoption } from './components/IndustryAdoption'
import { KpiRow } from './components/KpiRow'
import { TimeCost } from './components/TimeCost'
import { ToolLeaderboard } from './components/ToolLeaderboard'
import { ToolMix } from './components/ToolMix'
import { TrendsDeep } from './components/TrendsDeep'
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
            AI tool adoption dashboard — industry mix, ROI, regions, tool leaders, and user
            segments from a lightweight Excel → MySQL → Spark → Redshift → Tableau-style pipeline.
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

      <nav className="dash-nav rise rise-delay-1" aria-label="Dashboard sections">
        <a href="#adoption">Adoption</a>
        <a href="#tools">Tool mix</a>
        <a href="#roi">Time vs cost</a>
        <a href="#geo">Region & roles</a>
        <a href="#trends">Trends</a>
        <a href="#leaderboard">Leaderboard</a>
        <a href="#segments">Segments</a>
      </nav>

      <KpiRow
        users={data.meta.users}
        tools={data.meta.tools}
        hours={totalHours}
        cost={totalCost}
        events={data.meta.usageEvents}
      />

      <div id="adoption">
        <IndustryAdoption
          industrySummary={data.industrySummary}
          adoption={data.adoptionByIndustryTool}
        />
      </div>

      <div id="tools">
        <ToolMix adoption={data.adoptionByIndustryTool} tools={data.tools} />
      </div>

      <div id="roi">
        <TimeCost industrySummary={data.industrySummary} monthly={data.monthlyIndustry} />
      </div>

      <div id="geo">
        <GeoOrg users={data.userMetrics} />
      </div>

      <div id="trends">
        <TrendsDeep
          monthly={data.monthlyIndustry}
          industrySummary={data.industrySummary}
          users={data.userMetrics}
        />
      </div>

      <div id="leaderboard">
        <ToolLeaderboard adoption={data.adoptionByIndustryTool} tools={data.tools} />
      </div>

      <div id="segments">
        <UserSegmentation users={data.userMetrics} />
      </div>

      <footer className="site-footer">
        <span>Synthetic demo data · {data.meta.usageEvents} usage logs · SQLite warehouse in /data</span>
        <span>Portfolio project · AI Tool Adoption Analytics</span>
      </footer>
    </div>
  )
}
