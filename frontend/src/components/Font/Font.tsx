import type { PropsWithChildren } from 'react'
import { JetBrains_Mono } from 'next/font/google'
import { ApplyFont } from './Font.styled'

const font = JetBrains_Mono({
  variable: '--jb-mono',
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
})

export function Font({ children }: PropsWithChildren) {
  return <ApplyFont className={font.variable}>{children}</ApplyFont>
}
