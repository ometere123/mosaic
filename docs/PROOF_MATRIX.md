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
| Final release-candidate contract/source | Studionet receipt + source retrieval | `0x97C9AB9afd4dCC03cAeF693cc5c8E93A7Db0395e`, finalized deployment tx `0x3a5c8a6a305469d56d183af7c35e116189ea85cb6dc36e347080ec0be8b23668`, retrieved source canonicalized to SHA-256 `a9f7ce4fa90ba1299740181c7fbaf5b5a6eb2cea9903a16d93dadecc497028fe` |
| Production frontend | Vercel CLI + Git status | Project `mosaic`, deployment `dpl_E4D3LcVYDSccPotNzV2pemy2wWyH`, URL https://themosaic.vercel.app, READY, bound to `0x97C9AB9afd4dCC03cAeF693cc5c8E93A7Db0395e`, release commit `30e4137471b72e84aa81f82dd55b8aedd8733dcf` |
| Historical/superseded external causal proof | GitHub + contract | Backfill mission `0`, PR `4`, seal and settlement evidence listed below belong to the superseded deployment and are not canonical proof for the corrected release candidate. |
| Historical/superseded duplicate replay rejection | Final contract receipt + reread | Backfill duplicate replay tx `0x32c7d8fa3e3650887dcf86b8d0e01098065d87628d95ccfc286b1556ae19372c`; preserved as historical evidence only. |
| Historical/superseded settlement and EOA payout | Final contract receipt + triggered external transfer | Backfill settlement and payout transactions below are preserved as historical/superseded evidence; the corrected deployment lifecycle has not started. |
| Historical superseded causal proof | GitHub + contract | `ometere123/backfill` mission `0`, PR `3`, merge `987fca62be4eaba1741195910e4d2079402e419d`, proof comment `5965906014`, seal tx `0xd8acde0726d8a535bb5fc808089a6ad2b713e747592d272dfaa820fe743bc103` |
| Historical superseded provenance failure | Final contract receipt | Duplicate PR tx `0x874125139472ffb57784f5f173c11c4772565ef91fb155774dcb331708606ad9` finalized with execution `ERROR`; contribution count remained one |
| Live wallet failure | Production UI + contract reread | Real user rejection rendered `Action failed. User rejected the request.`; mission pool and contract state remained unchanged |
| Positive settlement | Final contract receipt + reads | Mission `0` resolution `0x64b45f1cdd0c783f8db6938df0f0ba0940564531d3f79f5784ea074bf3f02254`: terminal `ACHIEVED`, claimant `ACHIEVED`, `CORE`, `1 = 1 + 0 GEN` |
| Contributor withdrawal defect | Parent + triggered child receipts | Parent `0x269e636799111b2dfac175efe6afcd9a3692057c673025f56af3d4a9bebdbcb3` finalized `SUCCESS`; child `0xd544e8229bbfe2bd44e1c27c3b884368c57cacedcb11a14be86946ff8bba30d2` finalized `ERROR` / `contract_not_found` |
| Economic negative | Final contract receipt + reads | Mission `1` resolution `0xf9cfee6fbfa6421bc78f635d13159540e1eb6fa937a811c89fb79289497d01ad`: terminal and claimant `NOT_ACHIEVED`, no roles, `3 = 0 + 3 GEN` |
| Sponsor residual withdrawal defect | Parent + triggered child receipts | Parent `0xf1f93ac9720579d6f0923e6881590918e8fedd0ecaafa91d8dee127b267b498d` finalized `SUCCESS`; child `0x46a710098c11b9c17ec0e0b80cb7e2ed0b69be760cbf98ef86963c9458d8a5d9` finalized `ERROR` / `contract_not_found` |

No browser, one model response, administrator, sponsor or server selects payouts.

Historical transaction rows above are explicitly scoped to their superseded deployments. No canonical lifecycle transaction has been submitted for the corrected release candidate.
