import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SiteContent, SiteTheme } from "../../system/types";
import {
  BandStrip,
  FaqAccordion,
  GalleryGrid,
  HeroCentered,
  MenuBoard,
  PricingCards,
  QuoteSection,
  StorySection,
  VisitSection,
} from "./sections";

const theme = { sectionOverrides: {}, elementOverrides: {} } as unknown as SiteTheme;

describe("MenuBoard", () => {
  const content: SiteContent["services"] = {
    section_title: "What We Do",
    items: [
      { title: "Espresso, after dark", desc: "bitter chocolate, black fig" },
      { title: "Slow bar", desc: "blackcurrant and long amber sugar" },
    ],
  };

  it("renders every item with an editor key under a services section", () => {
    const { container } = render(<MenuBoard content={content} theme={theme} />);
    expect(container.querySelector('[data-section="services"]')).not.toBeNull();
    expect(
      container.querySelector('[data-element-key="services.items[0].title"]')?.textContent,
    ).toBe("Espresso, after dark");
    expect(container.querySelectorAll('[data-element-key^="services.items"]').length).toBe(4);
  });
});

describe("StorySection", () => {
  const content: SiteContent["about"] = {
    section_title: "About Amber Oven Cafe",
    body: "Built on quality work and word of mouth.",
    image: "https://example.com/cafe.jpg",
  };

  it("renders the story body with editor keys under an about section", () => {
    const { container } = render(<StorySection content={content} theme={theme} />);
    expect(container.querySelector('[data-section="about"]')).not.toBeNull();
    expect(container.querySelector('[data-element-key="about.body"]')?.textContent).toBe(
      "Built on quality work and word of mouth.",
    );
    expect(container.querySelector('[data-image-slot="about.image"]')).not.toBeNull();
  });
});

describe("BandStrip", () => {
  const content: SiteContent["why_us"] = {
    section_title: "Why Choose Us",
    points: ["Verified team", "Transparent pricing", "On time"],
  };

  it("renders each point with an editor key under a why_us section", () => {
    const { container } = render(<BandStrip content={content} theme={theme} />);
    expect(container.querySelector('[data-section="why_us"]')).not.toBeNull();
    expect(container.querySelectorAll('[data-element-key^="why_us.points"]').length).toBe(3);
    expect(container.querySelector('[data-element-key="why_us.points[1]"]')?.textContent).toBe(
      "Transparent pricing",
    );
  });
});

describe("QuoteSection", () => {
  const content: SiteContent["testimonials"] = {
    section_title: "What Customers Say",
    items: [{ name: "R. Sharma", quote: "Exactly what was promised." }],
  };

  it("renders the first quote and name with editor keys", () => {
    const { container } = render(<QuoteSection content={content} theme={theme} />);
    expect(container.querySelector('[data-section="testimonials"]')).not.toBeNull();
    expect(
      container.querySelector('[data-element-key="testimonials.items[0].quote"]')?.textContent,
    ).toContain("Exactly what was promised.");
    expect(
      container.querySelector('[data-element-key="testimonials.items[0].name"]')?.textContent,
    ).toContain("R. Sharma");
  });

  it("renders nothing when there are no testimonials", () => {
    const { container } = render(
      <QuoteSection content={{ section_title: "x", items: [] }} theme={theme} />,
    );
    expect(container.querySelector('[data-section="testimonials"]')).toBeNull();
  });
});

describe("VisitSection", () => {
  const content: SiteContent["contact"] = {
    section_title: "Visit Us",
    address: "Main Road, Your City",
    phone: "+91 00000 00000",
    email: "hello@amberovencafe.example",
    hours: "Daily, 8:00–22:00",
  };

  it("renders address, hours, phone and email with editor keys under a contact section", () => {
    const { container } = render(<VisitSection content={content} theme={theme} />);
    expect(container.querySelector('[data-section="contact"]')).not.toBeNull();
    expect(container.querySelector('[data-element-key="contact.address"]')?.textContent).toBe(
      "Main Road, Your City",
    );
    expect(container.querySelector('[data-element-key="contact.hours"]')?.textContent).toBe(
      "Daily, 8:00–22:00",
    );
    expect(container.querySelector('[data-element-key="contact.phone"]')).not.toBeNull();
    expect(container.querySelector('[data-element-key="contact.email"]')).not.toBeNull();
  });
});

describe("GalleryGrid", () => {
  const content: SiteContent["gallery"] = {
    section_title: "Our Work",
    items: [{ caption: "Recent", image: "x.jpg" }, { caption: "Job", image: "y.jpg" }],
  };
  it("renders every tile with image slot + caption key", () => {
    const { container } = render(<GalleryGrid content={content} theme={theme} />);
    expect(container.querySelector('[data-section="gallery"]')).not.toBeNull();
    expect(container.querySelectorAll('[data-image-slot^="gallery.items"]').length).toBe(2);
    expect(container.querySelector('[data-element-key="gallery.items[0].caption"]')?.textContent).toBe("Recent");
  });
});

describe("PricingCards", () => {
  const content: SiteContent["pricing"] = {
    section_title: "Plans",
    items: [{ name: "Basic", price: "₹999", features: ["A", "B"] }],
  };
  it("renders name, price and features with keys", () => {
    const { container } = render(<PricingCards content={content} theme={theme} />);
    expect(container.querySelector('[data-section="pricing"]')).not.toBeNull();
    expect(container.querySelector('[data-element-key="pricing.items[0].price"]')?.textContent).toBe("₹999");
    expect(container.querySelectorAll('[data-element-key^="pricing.items[0].features"]').length).toBe(2);
  });

  it("renders an item that omits the features array without crashing", () => {
    const partial = {
      section_title: "Plans",
      items: [{ name: "Basic", price: "₹999" }],
    } as unknown as SiteContent["pricing"];
    const { container } = render(<PricingCards content={partial} theme={theme} />);
    expect(container.querySelector('[data-element-key="pricing.items[0].name"]')?.textContent).toBe("Basic");
    expect(container.querySelectorAll('[data-element-key^="pricing.items[0].features"]').length).toBe(0);
  });
});

describe("FaqAccordion", () => {
  const content: SiteContent["faq"] = {
    section_title: "FAQ",
    items: [{ q: "Open?", a: "Daily." }],
  };
  it("renders a details/summary per item with keys", () => {
    const { container } = render(<FaqAccordion content={content} theme={theme} />);
    expect(container.querySelector('[data-section="faq"]')).not.toBeNull();
    expect(container.querySelector("details")).not.toBeNull();
    expect(container.querySelector('[data-element-key="faq.items[0].q"]')?.textContent).toBe("Open?");
    expect(container.querySelector('[data-element-key="faq.items[0].a"]')?.textContent).toBe("Daily.");
  });
});

describe("HeroCentered", () => {
  const content: SiteContent["hero"] = {
    headline: "Big headline",
    subtext: "sub",
    cta_text: "Go",
    image: "hero.jpg",
  };
  it("renders headline, subtext, eyebrow and cta", () => {
    const { container } = render(<HeroCentered content={content} theme={theme} eyebrow="Studio" />);
    expect(container.querySelector('[data-section="hero"]')).not.toBeNull();
    expect(container.querySelector('[data-element-key="hero.headline"]')?.textContent).toBe("Big headline");
    expect(container.textContent).toContain("Studio");
  });
});
