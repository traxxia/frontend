# Account & Organization Lifecycle

Managing your Traxxia instance involves understanding the different roles, how plans affect your capabilities, and the strict protocols for downgrading.

## 1. Roles & Permissions
-   **Super Admin**: Platform-wide monitoring.
-   **Company Admin**: Manages billing, plans, and organization setup.
-   **Collaborator**: Team member (Advanced Plan only).

## 2. Upgrading to Advanced
Upgrading from Essential to Advanced is seamless. It unlocks:
-   **Project Execution**: Convert initiatives into kickstarted projects.
-   **More Slots**: Increase from 1 to 3 active workspaces.
-   **Team Seats**: Invite up to 3 collaborators to join your organization.

## 3. The Downgrade Protocol
On downgrade from Advanced to Essential, Traxxia enforces the following protocol to ensure data integrity while restricting access:

-   **Workspace Selection**: If you have more than 1 workspace, you must choose **one business** to retain. Others are soft-deleted/archived.
-   **Collaborator Removal**: All collaborator access is **revoked immediately**.
-   **Project Lock**: Existing projects remain in your database for retention but become **Read-Only**. You cannot create new ones or edit existing execution data.
-   **Feature Gating**: All execution-related modules (Kickoff, Maintenance, Health) are locked.

## 4. AI Usage & Governance
-   **Silent Metering**: Traxxia monitors AI usage internally. There are no tokens for users to manage, but the system logs infrastructure costs per organization.
-   **Anti-Abuse**: To prevent workspace-limit bypass, you are allowed only **one workspace deletion every 30 days**.

> [!TIP] Traxxia retains all your data during a downgrade—you simply lose the "Write" and "Execution" permissions for Advanced features. You can restore access by upgrading at any time.

---
**Congratulations!** You have completed the Traxxia Academy. You are now ready to lead your organization with data-driven strategic intelligence.
