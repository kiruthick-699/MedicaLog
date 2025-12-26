"use client";

export default function RootError({ error }: { error: unknown }) {

  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900">
        <main role="alert" className="max-w-xl p-8 text-center">
          <h1 className="text-2xl font-semibold mb-2">Something went wrong</h1>
          <p className="text-sm text-gray-600 mb-4">
            Sorry — we encountered an unexpected error. The issue has been logged and will be reviewed.
          </p>
          <div className="flex items-center justify-center gap-3">
            <a href="/" className="text-sm text-blue-600 underline">
              Return home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
