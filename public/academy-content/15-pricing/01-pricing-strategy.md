# Pricing Strategy & Functional Requirements

## 1. Executive Summary
Traxxia Phase 3 shifts from a project-based tool to a tiered SaaS model optimized for the LATAM market. The focus is on two tiers: **Essential** (Insight-focused for individual owners) and **Advanced** (Execution-focused for leadership teams).

The goal is to provide immediate "Aha!" moments in the Essential tier while reserving the "Delivery & Execution" value for the Advanced tier.

---

## 2. Tier Definitions

### Tier 1: Essential
*   **Target:** Owner-CEOs, Small Business Managers.
*   **Price Point:** USD $29.00 – $39.00 / month.
*   **Value Prop:** Gain strategic clarity and validate Product-Market Fit (PMF) without the cost of a consultant.

**Core Feature Set:**
*   **Strategic Insights:** Access to the full insight generation engine.
*   **PMF Flow:** Dedicated workflow to validate business positioning.
*   **Unlimited Initiatives:** Users can create as many initiatives as needed within their single workspace.
*   **Limits:** 1 Workspace (Single Business Entity).
*   **Restriction:** Zero Projects. Essential users cannot convert strategic initiatives into projects and cannot access workflows related to execution.

### Tier 2: Advanced
*   **Target:** Strategy-literate execs, growing SMEs, upgraded CEOs.
*   **Price Point:** USD $89.00 – $129.00 / month.
*   **Value Prop:** Turn strategy into rigorous execution with team-wide alignment.

**Core Feature Set:**
*   **Everything in Essential.**
*   **Workspaces:** Up to 3 active workspaces per account.
*   **Complete Lifecycle:** Convert strategic initiatives into actionable projects.
*   **Portfolio Management:** Prioritization matrix and scenario comparisons.
*   **Collaboration:** Includes 3 collaborator seats in the base price (Total of 4 users including the Admin).
*   **Execution Rigor:** Monitoring, maintenance, and project health tracking.

---

## 3. Feature Gating & Workflow Logic

| Feature Category | Essential | Advanced |
| :--- | :--- | :--- |
| **Workspaces (Hard Cap)** | 1 Business | 3 Businesses |
| **Strategy Engine** | Full Access | Full Access |
| **PMF Flow** | Included | Included |
| **Initiative to Project Conversion** | Locked | Full Access |
| **Project Kickoff / Workflows** | Locked | Full Access |
| **Collaborators** | 0 | 3 included (Admin + 3) |
| **AI Metering** | Internal Only | Internal Only |

### 3.1 Upgrade Triggers
Upgrade prompts appear at logical value-extension points:
*   **Initiative Completion:** When a user finishes a strategic plan in the Essential tier, a "Convert to Project" button appears with an "Upgrade to Execute" call-to-action.
*   **Collaboration Request:** Attempting to add a team member triggers the upgrade modal.
*   **Workspace Limit:** Attempting to add a second business in Essential or a fourth in Advanced triggers an upgrade or contact-sales prompt.

---

## 4. Functional Requirements

### Subscription & Access Control
*   **Workspace Limits:** The system must enforce a hard cap of 1 workspace for Essential and 3 for Advanced.
*   **Feature Gating:** The system must disable all "Project" related modules (Kickoff, Monitoring, Maintenance) for Essential users.
*   **Collaborator Management:** Advanced accounts are limited to 3 collaborator invites.

### Downgrade Protocol
*   **Data Retention:** On downgrade, the system must retain all data but revoke "Write" access to Advanced features.
*   **Workspace Selection:** If a user has >1 workspace and downgrades, the UI must force the user to choose one business to retain.
*   **Collaborator Removal:** All collaborator access is revoked immediately upon downgrade.
*   **Project Lock:** Existing projects remain in the database but become "Read-Only."

### Workspace Integrity & Anti-Abuse
*   **Deletion Rate-Limit:** Users are restricted to 1 workspace deletion per 30-day period.
*   **Soft Deletion:** Deleted workspaces are archived internally (soft-deleted).

### AI Usage & Metering
*   **Silent Metering:** No visible AI token UI or user-facing warnings.
*   **Internal Constraints:** Backend logs all LLM calls per UID for infrastructure cost monitoring.

---

## 5. Architecture & UX Defaults
*   **Upgrade Default:** Clicking a locked feature shows a "Value Proposition" modal explaining the Advanced tier benefits.
*   **LATAM Sensitivity:** Pricing is USD-anchored but offers higher value in Advanced (collaboration/workspaces) to acknowledge regional sensitivity.
