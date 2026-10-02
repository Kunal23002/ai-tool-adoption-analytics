export type IndustrySummary = {
  industry: string
  active_users: number
  tools_adopted: number
  total_sessions: number
  total_hours_saved: number
  total_cost_usd: number
  hours_per_dollar: number
}

export type AdoptionRow = {
  industry: string
  tool_key: string
  tool_name: string
  category: string
  active_users: number
  total_sessions: number
  total_hours_saved: number
  total_cost_usd: number
  hours_per_dollar: number
  completion_rate: number
}

export type UserMetric = {
  user_key: string
  user_name: string
  industry: string
  role: string
  region: string
  company_size: string
  tools_used: number
  total_sessions: number
  total_hours_saved: number
  total_cost_usd: number
  roi_hours_per_dollar: number
  avg_satisfaction: number | null
  segment: string
}

export type MonthlyIndustry = {
  month_key: string
  industry: string
  active_users: number
  total_sessions: number
  total_hours_saved: number
  total_cost_usd: number
}

export type ToolDim = {
  tool_key: string
  tool_name: string
  category: string
  vendor: string
  monthly_cost_usd: number
  license_type: string
}

export type DashboardData = {
  industrySummary: IndustrySummary[]
  adoptionByIndustryTool: AdoptionRow[]
  userMetrics: UserMetric[]
  monthlyIndustry: MonthlyIndustry[]
  tools: ToolDim[]
  meta: {
    users: number
    tools: number
    usageEvents: number
    completedEvents: number
  }
}
