import { afterEach, describe, expect, it, vi } from "vitest";
import { findProofComments, previewPullRequest } from "@/lib/github";

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
  it.each([
    ["", "mosaic:1:0xabc"], ["wrong", "mosaic:1:0xabc"], ["mosaic:1:0xabc extra", "mosaic:1:0xabc"],
  ])("does not accept a non-exact marker (%s)", async (body, marker) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify([{ id: 9, body }]), { status: 200 })));
    await expect(findProofComments("acme/widget", 4, marker)).resolves.toEqual([]);
  });
  it("filters malformed comment entries without failing the complete response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify([null, {}, { id: "bad", body: "m" }, { id: 4, body: "m", user: null }]), { status: 200 })));
    await expect(findProofComments("acme/widget", 4, "m")).resolves.toEqual([{ id: 4, body: "m", author: "", htmlUrl: "" }]);
  });
  it("ignores unsafe and non-positive comment identifiers", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify([{ id: 0, body: "m" }, { id: -1, body: "m" }, { id: Number.MAX_SAFE_INTEGER + 1, body: "m" }]), { status: 200 })));
    await expect(findProofComments("acme/widget", 4, "m")).resolves.toEqual([]);
  });
  it("preserves multiple exact matches for user choice", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify([{ id: 1, body: "m" }, { id: 2, body: "m" }]), { status: 200 })));
    await expect(findProofComments("acme/widget", 4, "m")).resolves.toHaveLength(2);
  });
  it("uses the bounded public comments endpoint", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("[]", { status: 200 }));
    vi.stubGlobal("fetch", fetcher);
    await findProofComments("acme/widget", 4, "m");
    expect(fetcher).toHaveBeenCalledWith("https://api.github.com/repos/acme/widget/issues/4/comments?per_page=100", { cache: "no-store" });
  });
  it("normalizes a public pull request preview without making it authoritative", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ number: 4, title: "Fix", user: { login: "dev" }, merged_at: "2026-01-01T00:00:00Z", merge_commit_sha: "abc", changed_files: 2, html_url: "https://github.com/acme/widget/pull/4" }), { status: 200 })));
    await expect(previewPullRequest("acme/widget", 4)).resolves.toEqual({ number: 4, title: "Fix", author: "dev", mergedAt: "2026-01-01T00:00:00Z", mergeSha: "abc", changedFiles: 2, htmlUrl: "https://github.com/acme/widget/pull/4" });
  });
  it("returns null preview fields for an unmerged pull request", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ number: 4 }), { status: 200 })));
    await expect(previewPullRequest("acme/widget", 4)).resolves.toMatchObject({ mergedAt: null, mergeSha: null, author: "" });
  });
  it("surfaces preview HTTP failures as non-authoritative errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 429 })));
    await expect(previewPullRequest("acme/widget", 4)).rejects.toThrow("HTTP 429");
  });
});
