"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-2xl font-bold">Critical Application Error</h2>
          <p className="text-sm text-gray-500">{error.message || "An error occurred."}</p>
          <button
            onClick={() => reset()}
            className="rounded bg-blue-600 px-4 py-2 text-white text-sm font-medium"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}

