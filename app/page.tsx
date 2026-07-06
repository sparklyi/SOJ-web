export default function HomePage() {
  return (
    <main className="min-h-dvh bg-soj-bg text-soj-text">
      <section className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col justify-center px-6 py-24">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-soj-accent">
          Signal Arena
        </p>
        <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-tight md:text-7xl">
          SOJ v2 foundation is online.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-soj-muted">
          The product shell is ready for the Signal Arena design system,
          contest signals, problem workflows, and mock data integration.
        </p>
      </section>
    </main>
  );
}
