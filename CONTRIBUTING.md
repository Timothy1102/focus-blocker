# Contributing

Thanks for your interest in Focus Blocker! Bug reports, ideas and pull requests are all welcome.

## Reporting a bug or suggesting a feature

[Open an issue](https://github.com/Timothy1102/focus-blocker/issues/new/choose). For bugs, please include your Chrome version, what you did, what you expected and what happened. If a site is not being blocked, the exact URL helps a lot.

## Making a change

1. Fork the repository and create a branch.
2. Load the folder as an unpacked extension (see [Development](README.md#development)) and test your change in the browser.
3. Run the tests:

   ```bash
   npm test
   ```

4. Open a pull request describing what changed and why. Small, focused pull requests are easiest to review.

## Guidelines

- Keep it dependency-free: plain JavaScript (ES modules) with no build step.
- Keep it private: no analytics, no network requests, no remote code. Request a new permission only when there is no alternative, and explain it in the README's permissions table.
- Put logic that does not need `chrome.*` APIs in `shared.js` so it can be unit-tested, and add a test for it in `test/`.
- Match the surrounding code style and keep the UI accessible (labels, keyboard focus, contrast).
- User-facing changes go in [`CHANGELOG.md`](CHANGELOG.md) under **Unreleased**.
