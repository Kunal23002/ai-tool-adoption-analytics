import { useCountUp } from '../hooks/useCountUp'

type Props = {
  users: number
  tools: number
  hours: number
  cost: number
  events: number
}

function Kpi({
  label,
  value,
  hint,
  decimals = 0,
  prefix = '',
  suffix = '',
  delayClass,
}: {
  label: string
  value: number
  hint: string
  decimals?: number
  prefix?: string
  suffix?: string
  delayClass: string
}) {
  const display = useCountUp(value, 950, decimals)
  return (
    <article className={`kpi rise ${delayClass}`}>
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">
        {prefix}
        {display}
        {suffix}
      </p>
      <p className="kpi-hint">{hint}</p>
    </article>
  )
}

export function KpiRow({ users, tools, hours, cost, events }: Props) {
  return (
    <div className="kpi-row">
      <Kpi label="Active users" value={users} hint={`${events} usage events`} delayClass="rise-delay-1" />
      <Kpi label="Tools tracked" value={tools} hint="Across 5 industries" delayClass="rise-delay-2" />
      <Kpi
        label="Hours saved"
        value={hours}
        hint="Completed sessions"
        decimals={0}
        delayClass="rise-delay-3"
      />
      <Kpi
        label="Spend (USD)"
        value={cost}
        hint="Prorated session cost"
        decimals={0}
        prefix="$"
        delayClass="rise-delay-4"
      />
    </div>
  )
}
