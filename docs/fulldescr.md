VW-nopass-client is a customized fork of the Bitwarden browser extension designed for environments where passwords must never be visible to end-users.

Key differences from upstream:
• No password reveal: password fields are masked and never rendered to the DOM.
• No “Copy password”: copy buttons and context-menu entries for passwords are removed.
• Optional: copying usernames and TOTP can remain enabled (configurable in code).
• Same secure autofill behavior.

Notes:
• This project is NOT affiliated with or endorsed by Bitwarden Inc.
• Source code and changes are published under GPLv3.
• For issues and feedback, please use the GitHub repository linked below.

Permissions rationale:
• scripting/activeTab/tabs/webNavigation/webRequest – required for secure autofill flows.
• storage/unlimitedStorage – extension settings and local caches.
• contextMenus – UI integration (with password copy removed).
• notifications/alarms/idle – background tasks, lock timers, and status updates.

Source code: https://github.com/brendanfoster075-byte/clients
License: GPLv3
