/**
 * Client-only LoginForm component
 * Handles ONLY form state (email, password, errors, pending)
 * No auth logic—delegates to server action
 */
"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { signIn } from "next-auth/react";

type LoginFormProps = {
  callbackUrl?: string;
  initialError?: string;
};

export function LoginForm({ callbackUrl = "/dashboard", initialError }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<string[]>(initialError ? [initialError] : []);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    startTransition(async () => {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl,
      } as any);

      if (res && (res as any).error) {
        setErrors([ (res as any).error || "Invalid email or password" ]);
        return;
      }

      // If successful, perform a client-side redirect to the callback URL
      const target = (res && (res as any).url) || callbackUrl;
      window.location.href = target;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>

      {errors.length > 0 && (
        <div className="border border-black/20 bg-white p-3" role="alert" aria-live="polite">
          <ul className="text-sm text-black/80 space-y-1">
            {errors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <Button type="submit" disabled={isPending} variant="primary">
        Sign in
      </Button>
    </form>
  );
}
