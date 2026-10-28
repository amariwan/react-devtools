# Main branch protection

The canonical branch is `main`. The repository must enforce these rules in
GitHub Settings → Rules → Rulesets (or the equivalent branch protection UI):

- Require pull requests, at least one approval, and dismiss stale approvals.
- Require the `Verify / verify` status check and require the branch to be up to date.
- Require conversation resolution and block force pushes and branch deletion.
- Do not allow administrators to bypass required checks for normal changes.
- Restrict release automation to the protected `main` branch; never publish from pull requests.

The local checkout cannot verify GitHub repository settings. After applying the
ruleset, maintainers should record the ruleset name and a successful protected
branch merge in the release-readiness report.
