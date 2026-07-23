import { vi } from "vitest";

vi.mock("next/font/google", () => {
  const font = () => ({ variable: "--font-stub", className: "font-stub" });
  return {
    Anton: font,
    Archivo: font,
    Bricolage_Grotesque: font,
    Karla: font,
    Marcellus: font,
    Mulish: font,
    Schibsted_Grotesk: font,
    Young_Serif: font,
  };
});
