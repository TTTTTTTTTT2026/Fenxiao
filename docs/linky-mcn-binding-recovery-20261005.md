# Linky MCN binding recovery after legacy refresh failure (2026-10-05)

This is a one-time production data-repair procedure for the 2026-10-05 06:00 UTC legacy probe failure. It does not authorize reward, withdrawal, or other business-switch changes. The operator must follow the production deployment runbook and record a protected backup and rollback evidence before any data write.

## Order of operations

1. Deploy the merged backend fix and confirm the running revision, healthy containers, `app.linky-verification.source=MCN`, and that a scheduled legacy refresh cannot run. Do not restore data on the old backend: its next six-hour cycle could overwrite it again.
2. Take and verify a fresh full MySQL backup. In a restricted location outside the repository, capture the four candidate rows' complete **before** values, the corresponding last MCN verification attempts, and a digest of that snapshot. Do not put phone numbers, Linky IDs, guild IDs, or request IDs in general logs.
3. In a transaction, select candidates using every criterion below. The expected count is **four** based on a read-only production check at 2026-10-05 09:47 UTC. If the count or evidence has changed, stop and investigate; do not broaden the repair blindly.
4. Conditionally update only the two binding-state columns to `MATCHED_OURS` / `ELIGIBLE`. Set `checked_at` to the last successful MCN attempt time (not the failed script time), `checked_by=0`, a short repair-provenance remark, and `updated_at` in UTC. Do not change account ownership, guild, invite route, reward, or wallet data.
5. Before commit, verify exactly four rows changed, each has a qualifying historical attempt, and each resolves as Linky `verified=true` in the workspace calculation. Commit only after those checks. Independently read back all four rows and record a masked audit of before/after and evidence IDs in protected operations storage. If a check fails, roll back the transaction.
6. Confirm the affected users can see Linky as bound after reloading the client. No user-triggered re-verification is required. A historical recovery does **not** assert fresh MCN membership at repair time.

## Required evidence for each candidate

- Current `linky_account_binding` is user-linked, `REFRESH_FAILED` / `INELIGIBLE`, with `checked_at=2026-10-05 06:00:00` UTC and a remark identifying the missing `python3` legacy probe. Capture its `id`, `updated_at`, and all state fields before mutation.
- The **latest** `linky_verification_attempt` for the same user and Linky account is `verification_source=MCN`, `result_status=FOUND`, `membership_status=IN_EXPECTED_GUILD`, with no error code. It has nonempty `request_id`, `snapshot_at`, `source_generation`, and `checksum`.
- The successful attempt's observed guild equals its expected guild, the binding's current `expected_guild_id` and `guild_id`, and the user's current `linky_invitation_guild_attribution.guild_id`. The attribution source is `VERIFIED_BINDING`.
- There is no later verification attempt for that same user and Linky account. Do not restore accounts with a subsequent authoritative rejection, changed guild, missing evidence, or concurrent binding update.

The production read-only preflight found four candidates satisfying these conditions; this must be rechecked immediately before writing. The update should compare the captured binding `id` and `updated_at` as concurrency guards. Keep the protected preimage for conditional rollback; never reverse a later legitimate verification or user change.

## Regression checks

- In MCN mode the scheduler makes no calls to the legacy refresh service; direct legacy refresh calls fail before probing or writing.
- In local/test LEGACY mode the existing refresh remains available.
- Workspace selection still recognizes `ELIGIBLE` / `MATCHED_OURS`; the repair changes no business eligibility rule, only restores previously verified records invalidated by the unrelated script failure.
