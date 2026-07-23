import { describe, expect, it } from "vitest";
import { inferCategory } from "@/components/web-agent/sites/inferCategory";

const CATEGORIES = [
  {
    categoryId: "local_service",
    name: "Local service",
    subcategoriesJson: [
      {
        id: "electrician",
        name: "Electrician",
        keywords: ["electrician", "wiring", "AC repair", "fan", "inverter", "short circuit"],
      },
      {
        id: "plumbing",
        name: "Plumbing",
        keywords: ["plumber", "pipe", "leak", "tap", "drainage", "bathroom fitting"],
      },
    ],
  },
  {
    categoryId: "hospitality_travel",
    name: "Hospitality & travel",
    subcategoriesJson: [
      {
        id: "cafe_restaurant",
        name: "Cafe & restaurant",
        keywords: ["cafe", "restaurant", "menu", "bakery", "sweets", "dining"],
      },
    ],
  },
  { categoryId: "professional", name: "Professional services", keywordsJson: ["software", "startup", "SaaS"] },
];

describe("inferCategory", () => {
  it("matches electrician/trades from a business description", async () => {
    const result = await inferCategory(
      "I run an electrician business in Pune doing emergency wiring and repairs",
      CATEGORIES,
    );
    expect(result.categoryId).toBe("local_service");
    expect(result.subcategoryId).toBe("electrician");
    expect(result.confidence).toBeGreaterThanOrEqual(3);
  });

  it("matches hospitality for restaurant descriptions", async () => {
    const result = await inferCategory(
      "Restaurant website with menu, reservations, and location map",
      CATEGORIES,
    );
    expect(result.categoryId).toBe("hospitality_travel");
    expect(result.subcategoryId).toBe("cafe_restaurant");
    expect(result.confidence).toBeGreaterThanOrEqual(3);
  });

  it("returns null for gibberish", async () => {
    const result = await inferCategory("asdf qwer zxcv", CATEGORIES);
    expect(result.categoryId).toBeNull();
    expect(result.subcategoryId).toBeNull();
  });
});
