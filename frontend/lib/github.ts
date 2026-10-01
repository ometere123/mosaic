export type PullPreview = {
  number: number;
  title: string;
  author: string;
  mergedAt: string | null;
  mergeSha: string | null;
  changedFiles: number;
  htmlUrl: string;
};

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
