"use client";

import { useEffect, useState } from "react";
import { fetchCallRecords, type TelephonyCallRecord } from "@/lib/telephony-api";

export function useCallRecords() {
  const [records, setRecords] = useState<TelephonyCallRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchCallRecords()
      .then((data) => {
        if (alive) setRecords(data.results);
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load call records");
      });
    return () => {
      alive = false;
    };
  }, []);

  return { records, error };
}
