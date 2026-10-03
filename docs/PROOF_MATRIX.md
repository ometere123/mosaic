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
| Release contract/source | Studionet receipt + source retrieval | `0x05fd77aB1f916e36C718E6b55CBdf5F726216d4a`, finalized deployment tx `0x7def22417f48e35caff481815a7665d0dce26841bd025f5035a707da1791e167`, retrieved source canonicalized to SHA-256 `96ceea3e7d71fd2c0e36461c4b4ca0d425f10fa9c013ff09ad895b8610acf8f5` |
| Production frontend | Vercel CLI + Git status | Project `mosaic`, deployment `dpl_DBCDnShzbLd8BD1YVqZSjoh3Pja9`, URL https://themosaic.vercel.app, READY and Git status green, production contract variable set to the final address |
| External causal proof | GitHub + contract | `ometere123/backfill` mission `0`, PR `3`, merge `987fca62be4eaba1741195910e4d2079402e419d`, proof comment `5965906014`, seal tx `0xd8acde0726d8a535bb5fc808089a6ad2b713e747592d272dfaa820fe743bc103` |
| Live provenance failure | Final contract receipt | Duplicate PR tx `0x874125139472ffb57784f5f173c11c4772565ef91fb155774dcb331708606ad9` finalized with execution `ERROR`; contribution count remained one |
| Live wallet failure | Production UI + contract reread | Real user rejection rendered `Action failed. User rejected the request.`; mission pool and contract state remained unchanged |

No browser, one model response, administrator, sponsor or server selects payouts.

The positive economic lifecycle and adverse wallet/GitHub cases remain separate live-evidence work; no transaction or outcome is claimed here without an actual recorded wallet action.
