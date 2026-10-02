import { afterEach, describe, expect, it, vi } from "vitest";
import { findProofComments } from "@/lib/github";

afterEach(() => vi.restoreAllMocks());

describe("proof-comment discovery", () => {
  it("returns only exact marker matches from public issue comments", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify([{ id: 7, body: "mosaic:1:0xabc", user: { login: "dev" }, html_url: "https://example.test/7" }, { id: 8, body: "mosaic:1:0xabc extra" }]), { status: 200 })));
    await expect(findProofComments("acme/widget", 4, "mosaic:1:0xabc")).resolves.toEqual([{ id: 7, body: "mosaic:1:0xabc", author: "dev", htmlUrl: "https://example.test/7" }]);
  });
  it("fails safely for rate limits and malformed payloads", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 403 })));
    await expect(findProofComments("acme/widget", 4, "m")).rejects.toThrow("HTTP 403");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
    await expect(findProofComments("acme/widget", 4, "m")).rejects.toThrow("malformed");
  });
});
