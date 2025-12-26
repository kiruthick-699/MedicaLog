/**
 * Server-only authentication actions
 * - Input validation using lib/validation
 * - NextAuth sign-in call
 * - Server-side redirect on success/failure
 * 
 * No client auth logic, no UI logic
 */
"use server";

import { redirect } from "next/navigation";
import { signIn } from "next-auth/react";
import { validateEmail, validatePassword } from "@/lib/validation/inputSchemas";

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  ok: boolean;
  errors?: string[];
}

/**
 * Server action: validate credentials and sign in
 * Redirects on success, returns errors on failure
 */
export async function loginAction(input: LoginInput): Promise<LoginResult> {
  // Validate email
  const emailValidation = validateEmail(input.email);
  if (!emailValidation.ok) {
    return { ok: false, errors: emailValidation.errors };
  }

  // Validate password
  const passwordValidation = validatePassword(input.password);
  if (!passwordValidation.ok) {
    return { ok: false, errors: passwordValidation.errors };
  }

  try {
    // Call NextAuth signIn with credentials provider
    const result = await signIn("credentials", {
      email: emailValidation.value,
      password: passwordValidation.value,
      redirect: false,
    });

    if (!result?.ok) {
      return {
        ok: false,
        errors: ["Invalid email or password"],
      };
    }

    // Success: server-side redirect to dashboard
    redirect("/dashboard");
  } catch (error) {
    // Redirect throws are expected and should propagate
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return {
      ok: false,
      errors: ["An error occurred during sign-in"],
    };
  }
}
