# Pinned toolchain

The supported network is Studionet chain `61999` (`0xF22F`), RPC `https://studio.genlayer.com/api`, explorer `https://explorer-studio.genlayer.com`, currency `GEN`.

The repository-local GenLayer CLI is `0.39.1`; Direct Mode is GenVM `v0.2.12`; Python packages are `genlayer-py 0.16.3`, `genlayer-test 0.29.2`, and `genvm-linter 0.11.0`; the frontend uses `genlayer-js 1.1.8`. The frontend pins Next.js `16.3.8` and React `19.2.4`.

Do not substitute a global CLI, another network, or a newer runtime merely because one exists. Integrity checks and CI verify these pins and the canonical contract bytes.
