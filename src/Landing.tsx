import { Button } from '@pikoloo/darwin-ui'

type LandingProps = {
  onGetStarted: () => void
}

function Landing({ onGetStarted }: LandingProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-6">
      <section className="flex flex-col items-center gap-6 text-center">
        <div className="flex flex-col gap-3">
          <h1 className="text-6xl font-bold leading-none text-white sm:text-7xl">
            Certora
          </h1>
          <p className="text-base text-white/60 sm:text-lg">
            Generate certificates in seconds, not hours
          </p>
        </div>

        <Button variant="primary" size="lg" onClick={onGetStarted}>
          Get Started
        </Button>
      </section>

      <footer className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-center text-xs text-white/45">
        <p>Made by saiusesgithub</p>
        <nav className="flex items-center gap-4" aria-label="Social links">
          <a
            className="transition-colors hover:text-white/75"
            href="https://github.com/saiusesgithub"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <a
            className="transition-colors hover:text-white/75"
            href="https://www.linkedin.com/in/saiusesgithub"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>
          <a
            className="transition-colors hover:text-white/75"
            href="https://saiusesgithub.github.io"
            target="_blank"
            rel="noreferrer"
          >
            Portfolio
          </a>
        </nav>
      </footer>
    </main>
  )
}

export default Landing
