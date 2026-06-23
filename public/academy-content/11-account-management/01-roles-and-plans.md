# Account & Organization Lifecycle

Managing your Traxxia instance involves understanding the different roles, how plans affect your capabilities, and the strict protocols for downgrading.

## 1. Roles & Permissions
-   **Super Admin**: Platform-wide monitoring.
-   **Company Admin**: Manages billing, plans, and organization setup.
-   **Collaborator**: Team member (available on specific plans).

## 2. Upgrading for More Features
Upgrading to a higher-tier plan is seamless. It unlocks:
-   **Project Execution**: Convert initiatives into kickstarted projects.
-   **More Slots**: Increase active workspace limits.
-   **Team Seats**: Invite collaborators to join your organization.

## 3. The Downgrade Protocol
On downgrade to a plan with lower limits, Traxxia enforces the following protocol to ensure data integrity while restricting access:

-   **Workspace Selection**: If you exceed the new workspace limit, you must choose which businesses to retain. Others are soft-deleted/archived.
-   **Collaborator Removal**: Collaborator access is adjusted to fit the new plan's limits.
-   **Project Lock**: Existing projects remain in your database for retention but become **Read-Only** if project execution access is removed.
-   **Feature Gating**: Execution-related modules (Kickoff, Maintenance, Health) are locked.

## 4. AI Usage & Governance
-   **Silent Metering**: Traxxia monitors AI usage internally. There are no tokens for users to manage, but the system logs infrastructure costs per organization.
-   **Anti-Abuse**: To prevent workspace-limit bypass, you are allowed only **one workspace deletion every 30 days**.

> [!TIP] Traxxia retains all your data during a downgrade—you simply lose the "Write" and "Execution" permissions for premium features. You can restore access by upgrading at any time.

---
**Congratulations!** You have completed the Traxxia Academy. You are now ready to lead your organization with data-driven strategic intelligence.
