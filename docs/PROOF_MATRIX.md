# Release proof matrix

| Boundary | Authority | Proof |
| --- | --- | --- |
| Mission terms and funding | Contract | Direct Mode state and conservation tests |
| GitHub identity/provenance | Consensus + contract | Stable account IDs, marker, repo/ref, ancestry and commitments |
| Terminal product state | Consensus + bounded GitHub reads | Branch/compare snapshot and terminal digest |
| Causal claimant result | Validator consensus | Exact terminal status, claimant outcome and wallet-role map |
| Payout | Deterministic contract code | Fixed 5/3/1 roles, 100/40/0 policy, conservation tests |
| Recovery | Contract | Retry on source failure; expiry after grace |
| Browser transaction status | SDK receipt + contract reread | Accepted is provisional; finalized without execution success is not success |
| Release contract/source | Studionet receipt + source retrieval | `0x8966Da098d86D0E6D2769e59912C6EC5D951c74B`, finalized deployment tx, retrieved source canonicalized to SHA-256 `96ceea3e7d71fd2c0e36461c4b4ca0d425f10fa9c013ff09ad895b8610acf8f5` |
| Production frontend | Vercel CLI | Project `mosaic`, deployment `dpl_8dW5b6rubUs862jZykGBYwJBtBqm`, URL https://mosaic-five-rust.vercel.app, production contract variable set to the release address |

No browser, one model response, administrator, sponsor or server selects payouts.

The positive economic lifecycle and adverse wallet/GitHub cases remain separate live-evidence work; no transaction or outcome is claimed here without an actual recorded wallet action.
