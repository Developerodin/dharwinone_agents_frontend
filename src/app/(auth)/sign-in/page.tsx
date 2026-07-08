"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthPageLayout } from "@/components/auth/auth-page-layout";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthInput, AuthPasswordInput } from "@/components/auth/auth-input";
import { GoogleAuthButton, AuthDivider } from "@/components/auth/google-auth-button";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { ROUTES } from "@/lib/constants";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registeredMessage =
    searchParams.get("registered") === "1"
      ? "Registration successful. You can sign in to access the dashboard."
      : null;

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    router.push(ROUTES.callAgent);
  };

  return (
    <AuthPageLayout>
      <AuthFormCard>
        <AuthHeader
          eyebrow="Welcome back"
          title="Sign in to your account"
          description="Access your AI calling agents and campaign workspace"
        />

        {registeredMessage && <AuthAlert>{registeredMessage}</AuthAlert>}

        <div className="flex w-full flex-col gap-6">
          <GoogleAuthButton />

          <AuthDivider />

          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
            <div className="flex w-full flex-col gap-4 sm:gap-5">
              <AuthInput
                id="signin-email"
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />

              <AuthPasswordInput
                id="signin-password"
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                showPassword={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
                labelExtra={
                  <Link
                    href="#"
                    className="auth-footer-link text-xs sm:text-sm"
                    onClick={(e) => e.preventDefault()}
                  >
                    Forgot password?
                  </Link>
                }
                required
              />
            </div>

            <AuthSubmitButton disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign in"}
            </AuthSubmitButton>

            <p className="auth-footer-text">
              Don&apos;t have an account?{" "}
              <Link href={ROUTES.register} className="auth-footer-link">
                Create account
              </Link>
            </p>
          </form>
        </div>
      </AuthFormCard>
    </AuthPageLayout>
  );
}

function SignInFallback() {
  return (
    <AuthPageLayout>
      <AuthFormCard>
        <AuthHeader
          eyebrow="Welcome back"
          title="Sign in to your account"
          description="Access your AI calling agents and campaign workspace"
        />
      </AuthFormCard>
    </AuthPageLayout>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInForm />
    </Suspense>
  );
}
