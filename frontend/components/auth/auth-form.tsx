"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Alert } from "@/components/common/alert";
import { ApiError } from "@/lib/api";

type AuthMode = "login" | "register";

type AuthFormProps = {
  mode: AuthMode;
};

const modeCopy = {
  login: {
    eyebrow: "Sign in",
    title: "Welcome back",
    intro: "Sign in to continue learning.",
    submit: "Sign In",
    alternateHref: "/auth/register",
    alternateLabel: "Create account"
  },
  register: {
    eyebrow: "Sign up",
    title: "Create your account",
    intro: "Start with one account for your courses and progress.",
    submit: "Create Account",
    alternateHref: "/auth/login",
    alternateLabel: "Already have an account?"
  }
} as const;

export const AuthForm = ({ mode }: AuthFormProps) => {
  const router = useRouter();
  const { clearError, error: sessionError, login, register } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = modeCopy[mode];

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setError(null);
    clearError();

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "").trim();

    try {
      if (mode === "register") {
        await register({
          name,
          email,
          password
        });
      } else {
        await login({
          email,
          password
        });
      }

      router.push("/dashboard");
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Unable to complete authentication."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10">
      <div className="pointer-events-none absolute left-[10%] top-24 h-40 w-40 rounded-full bg-[#10a37f]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-20 right-[12%] h-44 w-44 rounded-full bg-white/10 blur-3xl" />

      <div className="surface-panel spotlight-border relative w-full max-w-md rounded-[2rem] p-8 sm:p-10">
        <div className="flex items-center justify-between gap-4">
          <Link className="text-sm font-semibold text-ink" href="/">
            Learning Platform
          </Link>
          <span className="glass-chip eyebrow rounded-full px-4 py-2 text-ink/55">
            {copy.eyebrow}
          </span>
        </div>

        <div className="mt-8 text-center">
          <h1 className="font-display text-balance text-4xl leading-none text-ink sm:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-4 text-base leading-7 text-ink/65">
            {copy.intro}
          </p>
        </div>

        <form
          action={(formData) => {
            void handleSubmit(formData);
          }}
          className="mt-8 space-y-5"
        >
          {mode === "register" && (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-ink/75">
                Full name
              </span>
              <input
                className="glass-input rounded-2xl px-4 py-3 transition"
                name="name"
                placeholder="Name"
                required
                type="text"
              />
            </label>
          )}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink/75">
              Email
            </span>
            <input
              className="glass-input rounded-2xl px-4 py-3 transition"
              name="email"
              placeholder="name@domain.com"
              required
              type="email"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink/75">
              Password
            </span>
            <input
              className="glass-input rounded-2xl px-4 py-3 transition"
              minLength={8}
              name="password"
              placeholder="password"
              required
              type="password"
            />
          </label>

          {(error || sessionError) && (
            <Alert>
              {error ?? sessionError}
            </Alert>
          )}

          <button
            className="action-primary inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Please wait..." : copy.submit}
          </button>
        </form>

        <div className="mt-6 space-y-3 text-center text-sm text-ink/65">
          <Link
            className="block font-medium text-ink transition hover:text-[#10a37f]"
            href={copy.alternateHref}
          >
            {copy.alternateLabel}
          </Link>
          <Link className="block transition hover:text-[#10a37f]" href="/">
            {/* Back to home */}
          </Link>
        </div>
      </div>
    </main>
  );
};
