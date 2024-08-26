export const LOCALES = ["ko"] as const

export type Locales = typeof LOCALES
export type Locale = Locales[number]
