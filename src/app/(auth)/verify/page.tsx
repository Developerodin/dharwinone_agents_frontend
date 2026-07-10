"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthPageLayout } from "@/components/auth/auth-page-layout";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthAlert } from "@/components/auth/auth-alert";
import { verifyEmail } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";

function VerifyContent() {
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<"pending" | "ok" | "error">(token ? "pending" : "error");

  useEffect(() => {
    if (!token) return;
    verifyEmail(token)
      .then(() => setState("ok"))
      .catch(() => setState("error"));
  }, [token]);

  return (
    <AuthPageLayout>
      <AuthFormCard>
        <AuthHeader
          eyebrow="Email verification"
          title={
            state === "pending"
              ? "Verifying your email…"
              : state === "ok"
                ? "Email verified"
                : "Verification failed"
          }
          description={
            state === "ok"
              ? "Your account is active. You can sign in now."
              : state === "error"
                ? "This link is invalid or has expired. Sign in to request a new one."
                : "Hang tight for a second."
          }
        />
        {state === "ok" && <AuthAlert>Verification successful.</AuthAlert>}
        {state !== "pending" && (
          <p className="auth-footer-text">
            <Link href={ROUTES.signIn} className="auth-footer-link">
              Go to sign in
            </Link>
          </p>
        )}
      </AuthFormCard>
    </AuthPageLayout>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyContent />
    </Suspense>
  );
}
