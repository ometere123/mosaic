const API = "https://api.github.com";
const repo = "ometere123/backfill";
const prNumber = 4;
const expected = {
  merge: "73ad12c5534d713c8fa01efc8c3bdce2f06f2e1c",
  baseline: "987fca62be4eaba1741195910e4d2079402e419d",
  authorId: 45469370,
  proofCommentId: 5970233201,
  proofMarker: "mosaic:0:0xfcef676044658b5402f590dabe9e04a0f640522f",
};
const get = async (path) => {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const headers = { accept: "application/vnd.github+json", "user-agent": "mosaic-public-evidence" };
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(`${API}${path}`, { headers });
  if (!response.ok) throw new Error(`GitHub ${path} returned HTTP ${response.status}`);
  return response.json();
};
const fail = (message) => { throw new Error(`public evidence integration failed: ${message}`); };
const pr = await get(`/repos/${repo}/pulls/${prNumber}`);
if (pr.base?.repo?.full_name !== repo || pr.base?.ref !== "main") fail("base repository/ref mismatch");
if (pr.user?.id !== expected.authorId || pr.merge_commit_sha !== expected.merge || !pr.merged_at) fail("PR identity or merge mismatch");
const baseline = await get(`/repos/${repo}/commits/${expected.baseline}`);
if (baseline.sha !== expected.baseline) fail("baseline commit unavailable");
const merge = await get(`/repos/${repo}/commits/${expected.merge}`);
if (merge.sha !== expected.merge || merge.commit?.tree?.sha === undefined) fail("merge commit unavailable");
const comparison = await get(`/repos/${repo}/compare/${expected.baseline}...${expected.merge}`);
if (!['ahead', 'identical'].includes(String(comparison.status).toLowerCase())) fail("baseline-to-merge comparison is not descended");
if (comparison.merge_base_commit?.sha !== expected.baseline) fail("baseline is not the merge base");
const files = await get(`/repos/${repo}/pulls/${prNumber}/files?per_page=100`);
if (!Array.isArray(files) || files.length === 0) fail("changed-file evidence missing");
const comments = await get(`/repos/${repo}/issues/${prNumber}/comments?per_page=100`);
const proof = comments.find((comment) => comment.id === expected.proofCommentId && comment.body?.trim() === expected.proofMarker);
if (!proof || proof.user?.id !== expected.authorId) fail("proof comment identity or marker mismatch");
const checks = await get(`/repos/${repo}/commits/${expected.merge}/check-runs?per_page=100`);
const verify = checks.check_runs?.filter((run) => run.name === "verify" && run.app?.slug === "github-actions" && run.head_sha === expected.merge);
if (!verify || verify.length !== 1 || verify[0].status !== "completed" || verify[0].conclusion !== "success") fail("merge check evidence mismatch");
console.log(JSON.stringify({ repository: repo, pr: prNumber, baseline: expected.baseline, merge: expected.merge, compare_status: comparison.status, merge_base: comparison.merge_base_commit.sha, author_id: expected.authorId, proof_comment_id: expected.proofCommentId, changed_files: files.length, check: { name: verify[0].name, app_slug: verify[0].app.slug, head_sha: verify[0].head_sha, conclusion: verify[0].conclusion } }));
