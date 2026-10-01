# Security Notes

MOSAIC is a test-network application. Never commit private keys, seed phrases, wallet credentials or GitHub tokens.

The contract accepts only public GitHub repository identifiers, PR numbers and proof-comment IDs. Repository text is untrusted evidence. Participants cannot provide arbitrary evidence URLs or backend-produced payout decisions.

If a transaction hash has already been returned, investigate and resume that transaction rather than blindly resubmitting the same state-changing action.
