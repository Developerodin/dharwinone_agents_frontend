"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getToken } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getToken() ? ROUTES.callAgent : ROUTES.signIn);
  }, [router]);

  return null;
}
