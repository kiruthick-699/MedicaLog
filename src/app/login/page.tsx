import { LoginForm } from "@/components/client/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4" aria-labelledby="login-title">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
        <header className="space-y-2 text-center">
          <h1 id="login-title" className="text-2xl font-bold text-gray-900">Sign in</h1>
          <p className="text-sm text-gray-700">
            Enter your credentials to access your account. For clinical questions, consult your healthcare professional.
          </p>
        </header>

        <LoginForm />
      </div>
    </main>
  );
}
