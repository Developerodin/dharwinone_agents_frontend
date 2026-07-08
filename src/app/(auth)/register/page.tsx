"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthPageLayout } from "@/components/auth/auth-page-layout";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthInput, AuthPasswordInput } from "@/components/auth/auth-input";
import { GoogleAuthButton, AuthDivider } from "@/components/auth/google-auth-button";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { ROUTES } from "@/lib/constants";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    router.push(`${ROUTES.signIn}?registered=1`);
  };

  return (
    <AuthPageLayout>
      <AuthFormCard>
        <AuthHeader
          eyebrow="Get started"
          title="Create your account"
          description="Set up your retailer account to deploy AI calling agents"
        />

        <div className="flex w-full flex-col gap-6">
          <GoogleAuthButton label="Sign up with Google" />

          <AuthDivider />

          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
            <div className="flex w-full flex-col gap-4 sm:gap-5">
              <AuthInput
                id="register-name"
                label="Full name"
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />

              <AuthInput
                id="register-email"
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />

              <div className="flex w-full flex-col gap-2">
                <AuthPasswordInput
                  id="register-password"
                  label="Password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  showPassword={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                  required
                />
                <p className="auth-hint">
                  At least 8 characters with one letter and one number.
                </p>
              </div>

              <AuthPasswordInput
                id="register-confirm"
                label="Confirm password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                showPassword={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((v) => !v)}
                required
              />
            </div>

            <AuthSubmitButton disabled={isSubmitting}>
              {isSubmitting ? "Creating account…" : "Create account"}
            </AuthSubmitButton>

            <p className="auth-footer-text">
              Already have an account?{" "}
              <Link href={ROUTES.signIn} className="auth-footer-link">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </AuthFormCard>
    </AuthPageLayout>
  );
}
