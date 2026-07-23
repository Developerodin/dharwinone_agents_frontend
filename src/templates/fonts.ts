import { Anton, Archivo, Bricolage_Grotesque, Karla, Marcellus, Mulish, Schibsted_Grotesk, Young_Serif } from "next/font/google";

// One face per family voice, deliberately off the training-data default list
// (no Inter / Playfair / Lora / Space Grotesk / Fraunces...). System stacks stay
// as fallbacks so a font-load failure degrades, never breaks.

export const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton", display: "swap" });
export const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", display: "swap" });
export const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
export const karla = Karla({ subsets: ["latin"], variable: "--font-karla", display: "swap" });
export const marcellus = Marcellus({ weight: "400", subsets: ["latin"], variable: "--font-marcellus", display: "swap" });
export const mulish = Mulish({ subsets: ["latin"], variable: "--font-mulish", display: "swap" });
export const schibsted = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-schibsted", display: "swap" });
export const youngSerif = Young_Serif({ weight: "400", subsets: ["latin"], variable: "--font-youngserif", display: "swap" });

export const templateFontClasses = [anton, archivo, bricolage, karla, marcellus, mulish, schibsted, youngSerif]
  .map((f) => f.variable)
  .join(" ");
