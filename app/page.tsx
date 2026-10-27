const routeCode = `import { ImageResponse } from 'next/og'

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: 'white',
          color: 'black',
          display: 'flex',
          fontSize: 40,
          height: '100%',
          justifyContent: 'center',
          padding: '50px 200px',
          textAlign: 'center',
          width: '100%',
        }}
      >
        👋 Hello
      </div>
    ),
    { width: 1200, height: 630 },
  )
}`

export default function Page() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground sm:px-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-10">
        <header className="flex flex-col gap-3">
          <p className="font-mono text-sm text-muted-foreground">next/og</p>
          <h1 className="text-4xl font-semibold tracking-tight">Generate an image from a route</h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            This minimal App Router example returns a 1200 × 630 social image from a GET route.
          </p>
          <a
            className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            href="/api/og"
            target="_blank"
            rel="noreferrer"
          >
            Open generated image
          </a>
        </header>

        <section className="flex flex-col gap-4" aria-labelledby="code-heading">
          <div className="flex flex-col gap-1">
            <h2 id="code-heading" className="text-xl font-semibold">The route</h2>
            <p className="text-muted-foreground">
              Place this file at <code className="font-mono text-sm">app/api/og/route.tsx</code>.
            </p>
          </div>
          <pre className="overflow-x-auto rounded-lg border bg-muted p-5 text-sm leading-6"><code>{routeCode}</code></pre>
        </section>

        <section className="grid gap-4 border-t pt-8 sm:grid-cols-3" aria-label="How it works">
          <div className="flex flex-col gap-2">
            <h2 className="font-semibold">1. Import</h2>
            <p className="text-sm leading-6 text-muted-foreground">Import <code className="font-mono">ImageResponse</code> from <code className="font-mono">next/og</code>.</p>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="font-semibold">2. Render</h2>
            <p className="text-sm leading-6 text-muted-foreground">Return JSX with inline styles describing the image.</p>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="font-semibold">3. Size</h2>
            <p className="text-sm leading-6 text-muted-foreground">Set the output dimensions in the response options.</p>
          </div>
        </section>
      </div>
    </main>
  )
}
