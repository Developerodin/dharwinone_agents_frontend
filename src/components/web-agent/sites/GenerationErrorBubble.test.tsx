import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  GenerationErrorBubble,
  generationErrorMessage,
  TOKEN_EXHAUSTED_MESSAGE,
} from "@/components/web-agent/sites/GenerationErrorBubble";
import { SitesApiError } from "@/lib/sites-api";

describe("GenerationErrorBubble", () => {
  it("shows exhausted message and recharge link for 402", () => {
    const error = new SitesApiError(402, "insufficient tokens", {
      detail: "insufficient tokens",
      balance: 0,
      cost: 50,
    });

    render(<GenerationErrorBubble error={error} />);

    expect(screen.getByText(TOKEN_EXHAUSTED_MESSAGE)).toBeTruthy();
    expect(screen.getByRole("link", { name: /Recharge tokens/i })).toBeTruthy();
  });
});

describe("generationErrorMessage", () => {
  it("maps 402 to the exhausted-tokens chat message", () => {
    const error = new SitesApiError(402, "insufficient tokens", {
      balance: 0,
      cost: 50,
    });
    expect(generationErrorMessage(error)).toBe(TOKEN_EXHAUSTED_MESSAGE);
  });
  it("maps raw cta validation errors to plain language", () => {
    const error = new SitesApiError(422, "validation failed", {
      detail: '[{"code":"invalid_value","values":["whatsapp","phone","form"],"path":["cta_preference"]}]',
    });
    expect(generationErrorMessage(error)).toBe(
      "Please reply with one of: WhatsApp, phone call, or contact form.",
    );
  });
});
