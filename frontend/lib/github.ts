export type PullPreview = {
  number: number;
  title: string;
  author: string;
  mergedAt: string | null;
  mergeSha: string | null;
  changedFiles: number;
  htmlUrl: string;
};

export type ProofComment = { id: number; author: string; body: string; htmlUrl: string };

export async function findProofComments(repo: string, pr: number, marker: string): Promise<ProofComment[]> {
  const response = await fetch(`https://api.github.com/repos/${repo}/issues/${pr}/comments?per_page=100`, { cache: "no-store" });
  if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status}. You can enter the comment ID manually.`);
  const data: unknown = await response.json();
  if (!Array.isArray(data)) throw new Error("GitHub returned malformed comment data. You can enter the comment ID manually.");
  return data.flatMap((item): ProofComment[] => {
    if (!item || typeof item !== "object") return [];
    const value = item as Record<string, unknown>;
    const id = Number(value.id);
    const body = typeof value.body === "string" ? value.body.trim() : "";
    if (!Number.isSafeInteger(id) || id <= 0 || body !== marker) return [];
    const user = value.user && typeof value.user === "object" ? value.user as Record<string, unknown> : {};
    return [{ id, body, author: typeof user.login === "string" ? user.login : "", htmlUrl: typeof value.html_url === "string" ? value.html_url : "" }];
  });
}

export async function previewPullRequest(repo: string, number: number): Promise<PullPreview> {
  const response = await fetch(`https://api.github.com/repos/${repo}/pulls/${number}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status}. This preview is non-authoritative.`);
  const data = await response.json();
  return {
    number: Number(data.number), title: String(data.title ?? ""), author: String(data.user?.login ?? ""),
    mergedAt: data.merged_at ? String(data.merged_at) : null,
    mergeSha: data.merge_commit_sha ? String(data.merge_commit_sha) : null,
    changedFiles: Number(data.changed_files ?? 0), htmlUrl: String(data.html_url ?? ""),
  };
}
