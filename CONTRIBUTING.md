# Contributing to CurveTrace

Thank you for helping improve CurveTrace. Small, focused changes are easiest to
review.

## Report a bug

Before opening an issue, check whether it has already been reported. Include:

- Windows version and browser version
- Whether you used `CurveTrace.exe` or `CurveTrace.html`
- A minimal sequence of steps that reproduces the problem
- What you expected and what happened instead
- A screenshot or sample project when it can be shared safely

Do not attach confidential plots, unpublished data, or sensitive project files.

## Propose a change

1. Open an issue for substantial behavior or interface changes.
2. Keep each pull request limited to one clear improvement.
3. Preserve the offline-only design and avoid new runtime dependencies unless
   there is a strong reason.
4. Add or update tests for behavior changes.
5. Run the test suite before submitting:

```bash
node tools_bundle.js
node tests/core.test.js
node tests/structure.test.js
```

By contributing, you agree that your contribution may be distributed under the
project's MIT License.

