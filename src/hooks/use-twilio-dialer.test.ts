import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => {
  class MockEmitter {
    handlers: Record<string, ((...args: unknown[]) => void)[]> = {};
    on(event: string, cb: (...args: unknown[]) => void) {
      (this.handlers[event] ??= []).push(cb);
      return this;
    }
    emit(event: string, ...args: unknown[]) {
      (this.handlers[event] ?? []).forEach((cb) => cb(...args));
    }
  }

  class MockCall extends MockEmitter {
    parameters: Record<string, string> = { CallSid: "CA123" };
    disconnect = () => this.emit("disconnect");
    mute = () => {};
  }

  class MockDevice extends MockEmitter {
    static lastInstance: MockDevice | null = null;
    state = "unregistered";
    lastCall: MockCall | null = null;
    constructor(public token: string) {
      super();
      MockDevice.lastInstance = this;
    }
    async register() {
      this.state = "registered";
      this.emit("registered");
    }
    async connect() {
      this.lastCall = new MockCall();
      return this.lastCall;
    }
    disconnectAll() {
      this.lastCall?.disconnect();
    }
    destroy() {}
    updateToken() {}
  }

  return { MockDevice, MockCall };
});

vi.mock("@twilio/voice-sdk", () => ({ Device: mocks.MockDevice }));
vi.mock("@/lib/telephony-api", () => ({
  fetchDialerToken: vi.fn(async () => ({ token: "tok", identity: "dharwin_agent", ttl: 3600 })),
}));

import { useTwilioDialer } from "./use-twilio-dialer";

describe("useTwilioDialer", () => {
  it("initializes to ready, dials, and returns to ready on disconnect", async () => {
    const { result } = renderHook(() => useTwilioDialer());

    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(async () => {
      await result.current.dial("+919876543210");
    });
    const device = mocks.MockDevice.lastInstance!;
    expect(device.lastCall).not.toBeNull();

    act(() => device.lastCall!.emit("accept"));
    expect(result.current.status).toBe("in-call");
    expect(result.current.callSid).toBe("CA123");

    act(() => device.lastCall!.emit("disconnect"));
    expect(result.current.status).toBe("ready");
    expect(result.current.callSid).toBe("CA123");
  });
});
