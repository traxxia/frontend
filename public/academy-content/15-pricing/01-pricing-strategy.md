# Pricing Strategy & Functional Requirements

## 1. Executive Summary
Traxxia Phase 3 shifts from a project-based tool to a tiered SaaS model optimized for the LATAM market. The focus is on providing immediate strategic value through basic plans while reserving advanced execution and collaboration features for higher-tier offerings.

The goal is to provide immediate "Aha!" moments in introductory plans while reserving the "Delivery & Execution" value for expansion plans.

---

## 2. Plan Category Definitions

### Introductory Plans
*   **Target:** Owner-CEOs, Small Business Managers.
*   **Value Prop:** Gain strategic clarity and validate Product-Market Fit (PMF) without the cost of a consultant.

**Core Feature Set:**
*   **Strategic Insights:** Access to the full insight generation engine.
*   **PMF Flow:** Dedicated workflow to validate business positioning.
*   **Unlimited Initiatives:** Users can create as many initiatives as needed within their workspaces.
*   **Restriction:** Users on these plans cannot convert strategic initiatives into projects and cannot access workflows related to execution.

### Expansion & Execution Plans
*   **Target:** Strategy-literate execs, growing SMEs, upgraded CEOs.
*   **Value Prop:** Turn strategy into rigorous execution with team-wide alignment.

**Core Feature Set:**
*   **Complete Lifecycle:** Convert strategic initiatives into actionable projects.
*   **Portfolio Management:** Prioritization matrix and scenario comparisons.
*   **Collaboration Seats**: Invite team members to join your organization.
*   **Execution Rigor**: Monitoring, maintenance, and project health tracking.

---

## 3. Feature Gating & Workflow Logic

| Feature Category | Introductory | Expansion |
| :--- | :--- | :--- |
| **Workspaces (Hard Cap)** | Plan Dependent | Plan Dependent |
| **Strategy Engine** | Full Access | Full Access |
| **PMF Flow** | Included | Included |
| **Initiative to Project Conversion** | Locked | Full Access |
| **Project Kickoff / Workflows** | Locked | Full Access |
| **Collaborators** | Limited/None | Included Seats |
| **AI Metering** | Internal Only | Internal Only |

### 3.1 Upgrade Triggers
Upgrade prompts appear at logical value-extension points:
*   **Initiative Completion:** When a user finishes a strategic plan in an introductory tier, a "Convert to Project" button appears with an "Upgrade to Execute" call-to-action.
*   **Collaboration Request:** Attempting to add a team member triggers the upgrade modal if current limits are reached.
*   **Workspace Limit:** Attempting to add more businesses than allowed by the plan triggers an upgrade or contact-sales prompt.

---

## 4. Functional Requirements

### Subscription & Access Control
*   **Workspace Limits:** The system must enforce hard caps as defined in the plan configuration.
*   **Feature Gating:** The system must disable all "Project" related modules (Kickoff, Monitoring, Maintenance) for users without execution access.
*   **Collaborator Management:** Organization seats are managed based on the active plan limits.

### Downgrade Protocol
*   **Data Retention:** On downgrade, the system must retain all data but revoke "Write" access to features not included in the new plan.
*   **Workspace Selection:** If a user exceeds the new plan's workspace limit, the UI must force the user to choose which businesses to retain.
*   **Collaborator Removal:** Collaborator access is adjusted immediately upon downgrade to fit the new plan's seat count.
*   **Project Lock:** Existing projects remain in the database but become "Read-Only."

### Workspace Integrity & Anti-Abuse
*   **Deletion Rate-Limit:** Users are restricted to 1 workspace deletion per 30-day period.
*   **Soft Deletion:** Deleted workspaces are archived internally (soft-deleted).

### AI Usage & Metering
*   **Silent Metering:** No visible AI token UI or user-facing warnings.
*   **Internal Constraints:** Backend logs all LLM calls per UID for infrastructure cost monitoring.

---

## 5. Architecture & UX Defaults
*   **Upgrade Default:** Clicking a locked feature shows a "Value Proposition" modal explaining the benefits of higher-tier plans.
*   **LATAM Sensitivity:** Pricing is USD-anchored but offers higher value in expansion plans (collaboration/workspaces) to acknowledge regional sensitivity.
