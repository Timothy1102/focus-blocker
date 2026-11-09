# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project follows
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Popup switch to block the browser history page (`chrome://history`). Off by default.

## [1.0.0] - 2026-11-09

### Added

- Block any website via a `declarativeNetRequest` redirect rule, including its subdomains.
- Popup with per-site on/off switches, removal, "Block current site" and quick-add suggestions.
- Input normalisation: full URLs and bare domains both become a plain domain.
- Already-open tabs are redirected as soon as their site is blocked.
- "Blocked" page with a short focus message and a way back.
- Light and dark themes that follow the system setting.
