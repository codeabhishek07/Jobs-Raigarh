// Design tokens — simple, modern, professional Indian job portal
export const colors = {
  primary: '#1D4ED8',
  primaryDark: '#1E3A8A',
  primaryLight: '#EFF4FF',
  primarySoft: '#DBE7FF',
  accent: '#F97316',
  accentSoft: '#FFF1E6',
  green: '#16A34A',
  greenSoft: '#E7F6EC',
  amber: '#D97706',
  amberSoft: '#FEF3E2',
  purple: '#7C3AED',
  purpleSoft: '#F1EBFE',
  red: '#DC2626',
  redSoft: '#FCE9E9',
  cyan: '#0891B2',
  cyanSoft: '#E0F5FA',

  bg: '#F5F7FB',
  card: '#FFFFFF',
  border: '#E6EAF2',
  text: '#0F172A',
  textMuted: '#64748B',
  textFaint: '#94A3B8',
  white: '#FFFFFF',
  dark: '#0B1220',
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 };

export const spacing = (n: number) => n * 4;

export const shadow = {
  card: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  soft: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
};

export const statusColor: Record<string, { bg: string; fg: string }> = {
  Applied: { bg: colors.primaryLight, fg: colors.primary },
  'Under Review': { bg: colors.amberSoft, fg: colors.amber },
  Shortlisted: { bg: colors.purpleSoft, fg: colors.purple },
  Interview: { bg: colors.cyanSoft, fg: colors.cyan },
  Selected: { bg: colors.greenSoft, fg: colors.green },
  Rejected: { bg: colors.redSoft, fg: colors.red },
};
