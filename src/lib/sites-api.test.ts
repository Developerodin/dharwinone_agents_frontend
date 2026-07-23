import { afterEach, describe, expect, it, vi } from "vitest";
import { setSession } from "@/lib/auth";
import { prefillIntake, SitesApiError, SITES_BASE } from "@/lib/sites-api";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("sites-api", () => {
  it("prefillIntake posts to /api/sites/intake/prefill with auth", async () => {
    setSession("test-jwt", { id: "u1", email: "a@b.com", name: "A" });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          businessProfile: { business_name: "Sharma Electricals" },
          source: "llm",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await prefillIntake({
      description: "I run Sharma Electricals in Pune",
      category: "ls_electrician",
    });

    expect(result.businessProfile.business_name).toBe("Sharma Electricals");
    expect(fetchMock).toHaveBeenCalledWith(
      `${SITES_BASE}/api/sites/intake/prefill`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-jwt",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          description: "I run Sharma Electricals in Pune",
          category: "ls_electrician",
        }),
      }),
    );
  });

  it("throws SitesApiError with balance on 402", async () => {
    setSession("test-jwt", { id: "u1", email: "a@b.com", name: "A" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            detail: "insufficient tokens",
            balance: 10,
            cost: 50,
          }),
          { status: 402, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const err = await prefillIntake({
      description: "test",
      category: "generic",
    }).catch((e) => e);

    expect(err).toBeInstanceOf(SitesApiError);
    expect(err.status).toBe(402);
    expect(err.balance).toBe(10);
    expect(err.cost).toBe(50);
  });
});
