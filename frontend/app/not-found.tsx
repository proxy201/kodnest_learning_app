export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10 text-ink">
      <div className="surface-panel w-full max-w-xl rounded-[2rem] p-10 text-center">
        <p className="eyebrow text-ink/45">
          Page Not Found
        </p>
        <h1 className="mt-4 text-4xl font-semibold">This route does not exist.</h1>
        <p className="mt-4 text-base leading-7 text-ink/70">
          Head back to the homepage and continue learning.
        </p>
        <a
          className="action-primary mt-8 inline-flex rounded-full px-5 py-3 text-sm font-medium transition"
          href="/"
        >
          Return home
        </a>
      </div>
    </main>
  );
}
