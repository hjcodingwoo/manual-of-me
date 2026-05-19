import { getCompanyConfig, DEFAULT_COLORS } from './companies'

export function useCompanyColors(slug) {
  const config = slug ? getCompanyConfig(slug.toLowerCase()) : null
  return {
    config,
    primary: config?.primary_color || DEFAULT_COLORS.primary,
    secondary: config?.secondary_color || DEFAULT_COLORS.secondary,
    tertiary: config?.tertiary_color || DEFAULT_COLORS.tertiary,
    logoUrl: config?.logo_url || '',
    companyName: config?.company_name || '',
  }
}
