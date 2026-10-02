# Mutation strategy

`contract/tests/mutation/run.py` mutates the real `contract/contracts/mosaic.py` source, deploys each mutant through the existing Direct Mode fixtures, and runs a targeted regression. An unmodified full Direct Mode run is the control. Mutants are only counted when they represent a distinct protocol guard or invariant; equivalent/noise edits are not used to pad results.

Covered categories include frozen mission/source identity, proof binding, replay protection, evidence bounds, terminal ancestry, commitment roots, consensus equality, outcome compatibility, allocation policy, conservation, expiry and withdrawal ordering. The report records total, killed, surviving and equivalent mutants. Critical survivors block readiness. CI runs this harness as a dedicated contract-mutation job and separately runs the frontend source-mutating harness; syntax-invalid edits are excluded from both kill totals.
