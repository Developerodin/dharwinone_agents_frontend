"use client";

import { useCallback, useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import { getTokenBalance } from "@/lib/site-api";

export function useTokenBalance(refreshKey = 0) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setBalance(null);
      return;
    }
    setLoading(true);
    try {
      const result = await getTokenBalance();
      setBalance(result.balance);
    } catch {
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, refreshKey]);

  return { balance, loading, refresh };
}
