// Static company config — loaded at build time, zero API call, zero flash
import companiesData from '../companies.json'

export function getCompanyConfig(slug) {
  if (!slug) return null
  return companiesData[slug.toLowerCase()] || null
}

export const DEFAULT_COLORS = {
  primary: '#FF7900',
  secondary: '#FFBF00',
  tertiary: '#fffdf5',
}

export function getColors(config) {
  return {
    primary: config?.primary_color || DEFAULT_COLORS.primary,
    secondary: config?.secondary_color || DEFAULT_COLORS.secondary,
    tertiary: config?.tertiary_color || DEFAULT_COLORS.tertiary,
  }
}
