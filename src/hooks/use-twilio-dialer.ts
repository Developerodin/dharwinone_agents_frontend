"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Call, Device } from "@twilio/voice-sdk";
import { fetchDialerToken } from "@/lib/telephony-api";

export type DialerStatus = "initializing" | "ready" | "connecting" | "in-call" | "error";

/**
 * Twilio Voice SDK lifecycle, extracted from DHARWIN NEW's Dialpad.tsx
 * (Twilio branch only): token fetch → Device register → connect/disconnect,
 * mute, in-call duration timer, token refresh.
 */
export function useTwilioDialer() {
  const deviceRef = useRef<Device | null>(null);
  const callRef = useRef<Call | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [status, setStatus] = useState<DialerStatus>("initializing");
  const [error, setError] = useState<string | null>(null);
  const [callSid, setCallSid] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetCallState = useCallback(() => {
    callRef.current = null;
    stopTimer();
    setMuted(false);
    setStatus((s) => (s === "error" ? s : "ready"));
  }, [stopTimer]);

  // Never sets state synchronously — initial useState defaults cover the first
  // run, and retry() resets status/error before re-invoking.
  const init = useCallback(async () => {
    if (deviceRef.current) return;
    try {
      const { token } = await fetchDialerToken();
      const { Device } = await import("@twilio/voice-sdk");
      const device = new Device(token, { logLevel: "error" });
      device.on("registered", () => setStatus("ready"));
      device.on("error", (err: { message?: string }) => {
        setStatus("error");
        setError(err?.message ?? "Softphone error");
      });
      device.on("tokenWillExpire", async () => {
        try {
          device.updateToken((await fetchDialerToken()).token);
        } catch {
          // token refresh failed — the next dial attempt will surface the error
        }
      });
      deviceRef.current = device;
      await device.register();
      if (device.state === "registered") setStatus("ready");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Could not start the softphone");
    }
  }, []);

  useEffect(() => {
    // init() is async — every setState inside it runs after an await (token
    // fetch / SDK events), never synchronously in the effect body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    init();
    return () => {
      stopTimer();
      callRef.current?.disconnect();
      deviceRef.current?.destroy();
      deviceRef.current = null;
    };
  }, [init, stopTimer]);

  const dial = useCallback(
    async (e164Number: string) => {
      const device = deviceRef.current;
      if (!device || callRef.current) return;
      setError(null);
      setStatus("connecting");
      setDurationSeconds(0);
      try {
        const call = await device.connect({ params: { To: e164Number } });
        callRef.current = call;
        call.on("accept", () => {
          setCallSid(call.parameters?.CallSid ?? null);
          setStatus("in-call");
          stopTimer();
          timerRef.current = setInterval(() => setDurationSeconds((s) => s + 1), 1000);
        });
        call.on("disconnect", resetCallState);
        call.on("cancel", resetCallState);
        call.on("reject", resetCallState);
        call.on("error", (err: { message?: string }) => {
          setError(err?.message ?? "Call failed");
          resetCallState();
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not start the call");
        resetCallState();
      }
    },
    [resetCallState, stopTimer],
  );

  const hangup = useCallback(() => {
    callRef.current?.disconnect();
    deviceRef.current?.disconnectAll();
  }, []);

  const toggleMute = useCallback(() => {
    const call = callRef.current;
    if (!call) return;
    setMuted((prev) => {
      call.mute(!prev);
      return !prev;
    });
  }, []);

  const retry = useCallback(() => {
    deviceRef.current?.destroy();
    deviceRef.current = null;
    setStatus("initializing");
    setError(null);
    init();
  }, [init]);

  return { status, error, callSid, muted, durationSeconds, dial, hangup, toggleMute, retry };
}
