import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  GenerationErrorBubble,
  generationErrorMessage,
} from "@/components/web-agent/sites/GenerationErrorBubble";
import { SitesApiError } from "@/lib/sites-api";

describe("GenerationErrorBubble", () => {
  it("shows token balance numbers and packs link for 402", () => {
    const error = new SitesApiError(402, "insufficient tokens", {
      detail: "insufficient tokens",
      balance: 10,
      cost: 50,
    });

    render(<GenerationErrorBubble error={error} />);

    expect(screen.getByText(/You need 50 tokens \(have 10\)/)).toBeTruthy();
    expect(screen.getByRole("link", { name: /View token packs/i })).toBeTruthy();
  });
});

describe("generationErrorMessage", () => {
  it("maps raw cta validation errors to plain language", () => {
    const error = new SitesApiError(422, "validation failed", {
      detail: '[{"code":"invalid_value","values":["whatsapp","phone","form"],"path":["cta_preference"]}]',
    });
    expect(generationErrorMessage(error)).toBe(
      "Please reply with one of: WhatsApp, phone call, or contact form.",
    );
  });
});
