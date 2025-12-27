import { LoginForm } from "@/components/client/LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string; accountDeleted?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const callbackUrl = resolvedSearchParams?.callbackUrl || "/dashboard";
  const errorParam = resolvedSearchParams?.error;
  const accountDeleted = resolvedSearchParams?.accountDeleted === "1";
  const mappedError = errorParam ? "Unable to sign in with those credentials" : undefined;

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4" aria-labelledby="login-title">
      <div className="max-w-md w-full bg-white border border-black/10 p-8 space-y-6">
        <header className="space-y-2 text-center">
          <h1 id="login-title" className="text-2xl font-bold text-black">Sign in</h1>
          <p className="text-sm text-black/70">
            Enter your credentials to access your account. For clinical questions, consult your healthcare professional.
          </p>
        </header>

        {accountDeleted ? (
          <div className="border border-black/10 rounded-lg p-3 bg-white">
            <p className="text-sm text-black/80">Your account has been deleted.</p>
          </div>
        ) : null}
        <LoginForm callbackUrl={callbackUrl} initialError={mappedError} />
      </div>
    </main>
  );
}
