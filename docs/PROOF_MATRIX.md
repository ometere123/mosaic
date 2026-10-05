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
| Final contract/source | Studionet receipt + source retrieval | `0x418180Bf909C50c8710C4B378E9113264d484eDF`, finalized deployment tx `0x785a22183aef5897b4975806f899006bfdb05bd058664b2013fed4304462476f`, retrieved source canonicalized to SHA-256 `92a8a514cd3ac556cb033fb2d9cd8dd4164a6c8cec37291e0873de79a85d5b58` |
| Production frontend | Vercel CLI + Git status | Project `mosaic`, deployment `dpl_6g2QcTCQCAVV9dP3CzcGVABHccC7`, URL https://themosaic.vercel.app, READY, production contract variable set to the current release-candidate address |
| Current external causal proof | GitHub + contract | `ometere123/backfill` mission `0`, PR `4`, baseline `987fca62be4eaba1741195910e4d2079402e419d`, merge `73ad12c5534d713c8fa01efc8c3bdce2f06f2e1c`, proof comment `5970233201`, seal tx `0x0d6f55284dc92e0f470d6982a42ec4c3f8a5ce192d14fd6eaae6ff5d3daf36b6` |
| Current duplicate replay rejection | Final contract receipt + reread | `0x32c7d8fa3e3650887dcf86b8d0e01098065d87628d95ccfc286b1556ae19372c` finalized with execution `ERROR` / `pr_already_sealed`; contributor count stayed one |
| Final settlement | Final contract receipt + authoritative reads | Mission `0` resolution `0x53f492e446ff54ba3a2dda8e6ff7e56dbc3d7bf83116f1498d4c229ce8a13854`: terminal `ACHIEVED`, claimant `ACHIEVED`, `CORE`, and `1 = 1 + 0 GEN` |
| Final EOA payout | Parent + triggered external transfer | Parent `0x3284f7a249d416d1e1589d565a009be28c258275b715a2bb0bb398d4c9b42347` finalized with leader `SUCCESS`; child `0xe07e016cde8d23ce7c51f3ff780ae1d7fd31e5133f78554af123e74ecdc46073` finalized to the contributor EOA for 1 GEN with `value_credited: true` |
| Historical superseded causal proof | GitHub + contract | `ometere123/backfill` mission `0`, PR `3`, merge `987fca62be4eaba1741195910e4d2079402e419d`, proof comment `5965906014`, seal tx `0xd8acde0726d8a535bb5fc808089a6ad2b713e747592d272dfaa820fe743bc103` |
| Historical superseded provenance failure | Final contract receipt | Duplicate PR tx `0x874125139472ffb57784f5f173c11c4772565ef91fb155774dcb331708606ad9` finalized with execution `ERROR`; contribution count remained one |
| Live wallet failure | Production UI + contract reread | Real user rejection rendered `Action failed. User rejected the request.`; mission pool and contract state remained unchanged |
| Positive settlement | Final contract receipt + reads | Mission `0` resolution `0x64b45f1cdd0c783f8db6938df0f0ba0940564531d3f79f5784ea074bf3f02254`: terminal `ACHIEVED`, claimant `ACHIEVED`, `CORE`, `1 = 1 + 0 GEN` |
| Contributor withdrawal defect | Parent + triggered child receipts | Parent `0x269e636799111b2dfac175efe6afcd9a3692057c673025f56af3d4a9bebdbcb3` finalized `SUCCESS`; child `0xd544e8229bbfe2bd44e1c27c3b884368c57cacedcb11a14be86946ff8bba30d2` finalized `ERROR` / `contract_not_found` |
| Economic negative | Final contract receipt + reads | Mission `1` resolution `0xf9cfee6fbfa6421bc78f635d13159540e1eb6fa937a811c89fb79289497d01ad`: terminal and claimant `NOT_ACHIEVED`, no roles, `3 = 0 + 3 GEN` |
| Sponsor residual withdrawal defect | Parent + triggered child receipts | Parent `0xf1f93ac9720579d6f0923e6881590918e8fedd0ecaafa91d8dee127b267b498d` finalized `SUCCESS`; child `0x46a710098c11b9c17ec0e0b80cb7e2ed0b69be760cbf98ef86963c9458d8a5d9` finalized `ERROR` / `contract_not_found` |

No browser, one model response, administrator, sponsor or server selects payouts.

Every transaction and outcome above was observed from the final contract; no status-only or unsubmitted browser action is counted as proof.
