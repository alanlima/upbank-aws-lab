import { getBuildMeta } from '../config/buildMeta'

const BuildInfo = () => {
  const { commit, buildDateIso } = getBuildMeta()
  const formattedDate = buildDateIso
    ? new Date(buildDateIso).toLocaleString('en-GB', { timeZone: 'UTC', hour12: false })
    : 'n/a'

  return (
    <div className="build-stamp" title="Build metadata">
      <span>Build {commit}</span>
      <span className="dot-separator" aria-hidden="true">
        ·
      </span>
      <span>UTC {formattedDate}</span>
    </div>
  )
}

export default BuildInfo
