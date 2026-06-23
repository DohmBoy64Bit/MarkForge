# Linux Smoke - 2026-06-22

Milestone: release hardening Milestone 4.

## Scope

This audit verifies whether the local Linux host can run MarkForge's Linux smoke path and records the exact current blocker.

## Host

- Host type: WSL 2 Ubuntu.
- Distribution: Ubuntu 26.04 LTS (`resolute`).
- Kernel: `6.6.87.2-microsoft-standard-WSL2`.
- User: `seans`.
- Non-interactive sudo: unavailable (`sudo-needs-password`).

## Smoke Command

The project now exposes:

```bash
pnpm linux:smoke
```

The script is implemented at `scripts/linux-smoke.sh`.

## Current Result

The local WSL host cannot complete the Linux smoke because required native Linux prerequisites are missing. Running `bash scripts/linux-smoke.sh` reports six prerequisite issues:

- Native `node` is missing.
- Native `corepack` is missing; the only visible Corepack path is the Windows shim at `/mnt/c/Program Files/nodejs/corepack`.
- Native `cargo` is missing.
- Native `rustc` is missing.
- `webkit2gtk-4.1` is missing from `pkg-config`.
- `javascriptcoregtk-4.1` is missing from `pkg-config`.

Observed available tools:

- `pkg-config`: `/usr/bin/pkg-config`.
- `gtk+-3.0`: `3.24.52`.
- Windows `node.exe` is callable from WSL, but that does not satisfy the native Linux smoke requirement.
- Windows Corepack/Pnpm shims are visible from WSL but fail under bash with CRLF interpreter metadata; the smoke script now rejects Windows paths as Linux prerequisites.

## Evidence Commands

```bash
wsl.exe -d Ubuntu -- bash -lc "cd /mnt/c/Projects/MarkForge && uname -a"
wsl.exe -d Ubuntu -- bash -lc "cd /mnt/c/Projects/MarkForge && command -v node || true"
wsl.exe -d Ubuntu -- bash -lc "cd /mnt/c/Projects/MarkForge && command -v cargo || true"
wsl.exe -d Ubuntu -- bash -lc "cd /mnt/c/Projects/MarkForge && pkg-config --modversion gtk+-3.0 || true"
wsl.exe -d Ubuntu -- bash -lc "cd /mnt/c/Projects/MarkForge && pkg-config --modversion webkit2gtk-4.1 || true"
wsl.exe -d Ubuntu -- bash -lc "cd /mnt/c/Projects/MarkForge && pkg-config --modversion javascriptcoregtk-4.1 || true"
```

## Follow-Up Needed

Install native Linux prerequisites on an Ubuntu host, then run:

```bash
corepack pnpm linux:smoke
```

After that passes, run artifact bundling:

```bash
MARKFORGE_LINUX_BUNDLE=1 corepack pnpm linux:smoke
```

Linux packaging is not release-ready until this smoke produces Linux artifacts and a launch check confirms the editor and viewer start on Linux.
