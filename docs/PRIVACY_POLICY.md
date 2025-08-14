# Privacy Policy — VW-nopass-client

_Last updated: 2025-08-14_

VW-nopass-client is an independent fork of the open-source Bitwarden browser extension. It is designed for environments where passwords must never be visible in the UI. This extension does not collect or transmit personal data to the developer.

## What data the extension processes

- **Vault item data (logins, usernames, passwords, TOTP, etc.)** is decrypted locally in your browser in order to provide autofill functionality.
- **Passwords are never rendered into the DOM** by this fork and are not exposed via copy buttons or “reveal” UI.
- **Local settings** (e.g., preferences, extension state) may be stored using the browser’s `storage` API.

## What data is collected or shared

- The extension **does not collect, store, or transmit** personal information to the developer or third parties.
- No analytics, no telemetry, no tracking are added by this fork.

## Permissions rationale

- `scripting`, `activeTab`, `tabs`, `webNavigation`, `webRequest`: required for secure autofill flows.
- `storage`, `unlimitedStorage`: to store local preferences and caches.
- `contextMenus`: to provide UI actions (password copy is removed in this fork).
- `notifications`, `alarms`, `idle`: background tasks, lock timers, and status updates.
- **Clipboard permissions are not requested** by default. If you enable username/TOTP copying in your build, `clipboardWrite` may be required.

## Data storage and retention

- Data handled by the extension remains on the user’s device and/or with the user’s chosen vault server (e.g., self-hosted or Bitwarden cloud), according to the underlying Bitwarden ecosystem you connect to.
- This fork does not add new remote endpoints.

## Third parties

- The extension interacts only with the Bitwarden-compatible server you configure (cloud or self-hosted). No data is sent to the developer.

## Security

- This fork follows Bitwarden’s client-side model (local decryption). We additionally suppress password rendering and copying in the UI to minimize accidental exposure.

## Children’s privacy

- This extension is intended for general audiences and enterprise environments and does not knowingly target children.

## Changes to this policy

- We may update this policy from time to time. The latest version will always be available at:
  https://github.com/brendanfoster075-byte/clients/blob/main/docs/PRIVACY_POLICY.md

## Contact

- For questions or issues, please open a GitHub issue:
  https://github.com/brendanfoster075-byte/clients/issues
