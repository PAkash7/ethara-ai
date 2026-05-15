/**
 * Shared designation utilities
 * The API returns grouped format: [{group, options:[{value,label}]}]
 */

/** Convert grouped API response into a flat value→label map */
export function buildLabelMap(groups = []) {
  const map = {}
  groups.forEach(g => g.options?.forEach(o => { map[o.value] = o.label }))
  return map
}

/** Nicely format a raw designation key when the label map isn't loaded yet */
export function formatDesignation(value) {
  if (!value) return ''
  // e.g. "fullstack_developer" → "Fullstack Developer"
  return value
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** Get display label: uses map if loaded, otherwise falls back to formatted key */
export function getDesignationLabel(value, groups) {
  if (!value) return ''
  const map = buildLabelMap(groups)
  return map[value] || formatDesignation(value)
}
