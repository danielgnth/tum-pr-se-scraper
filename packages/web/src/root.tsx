import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'
import cssHref from './index.css?url'

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>TUM Courses</title>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function Root() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Outlet />
    </div>
  )
}

export function HydrateFallback() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <p className="text-muted-foreground">Loading…</p>
    </div>
  )
}

export function links() {
  return [{ rel: 'stylesheet', href: cssHref }]
}
