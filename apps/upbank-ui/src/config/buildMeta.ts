const rawCommit = (import.meta.env.VITE_COMMIT_SHA as string | undefined) ?? 'dev'
const rawBuildDate = (import.meta.env.VITE_BUILD_DATE as string | undefined) ?? ''

const normalizeCommit = (value: string) => value.trim().slice(0, 8) || 'dev'
const normalizeDate = (value: string) => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

export const getBuildMeta = () => {
  return {
    commit: normalizeCommit(rawCommit),
    buildDateIso: normalizeDate(rawBuildDate),
  }
}
