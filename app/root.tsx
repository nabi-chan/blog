import "./root.css"
import "@mantine/core/styles.css"
import "@mantine/code-highlight/styles.css"
import "@mantine/spotlight/styles.css"

import { theme } from "./themes/mantine"
import {
  ColorSchemeScript,
  mantineHtmlProps,
  MantineProvider,
} from "@mantine/core"
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router"
import type { Route } from "./+types/root"

export const meta: Route.MetaDescriptors = [
  {
    title: "나비",
  },
]

export function Layout({ children }: React.PropsWithChildren) {
  return (
    <html lang="ko" {...mantineHtmlProps}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <ColorSchemeScript />
        <Meta />
        <Links />
      </head>
      <body>
        <MantineProvider theme={theme}>{children}</MantineProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}

export function ErrorBoundary({ error: _error }: Route.ErrorBoundaryProps) {
  return <>...</>
}
