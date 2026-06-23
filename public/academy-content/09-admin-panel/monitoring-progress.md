# Monitoring Progress & Platform Governance

The **Super Admin Panel** provides a centralized control center for both Platform (Super Admins) and Organization (Company Admins) management. This guide details the core administrative tabs and the dynamic subscription system that powers Traxxia.
 

## 1. Dynamic Subscription System
Traxxia utilizes a fully dynamic plan model, managed exclusively by Super Admins. Instead of static tiers, the platform supports a flexible configuration approach:

### 1.1 Plan Configuration
Super Admins have full authority to **Create**, **Update**, and **Disable** plans. This allows for a completely dynamic product offering:
-   **Resource Caps**: Hard limits on Workspaces, Users, Collaborators, and Viewers.
-   **Feature Toggles**: Enable or disable modules like **Strategic Analysis**, **PMF Workflows**, and **Project Execution**.
-   **Plan Status**: Plans can be toggled between **Active** and **Disabled**. 
    -   **Active Plans**: Only these are available for purchase by new or returning customers.
    -   **Disabled Plans**: Removing a plan from the "Active" list does not immediately affect current subscribers. Existing users will retain their features until their current subscription period ends, ensuring a smooth transition during pricing or feature shifts.

### 1.2 Monitoring & Lifecycle
The Monitoring Progress dashboard allows Super Admins to:
-   **Track Distributions**: See a breakdown of companies across different plan configurations.
-   **Enforce Limits**: The system automatically snapshotted limits at the time of purchase, ensuring users are protected from mid-cycle changes.
-   **Override & Adjust**: Manually adjust an organization's limits or grant trial access to premium features when necessary.
 

## 2. Deep Dive into Super Admin Tabs

The Super Admin Panel is categorized into several specialized tabs, each providing granular control over different layers of the Traxxia platform.

### 2.1 Companies & Organizational Health
The **Companies** tab is the primary entry point for managing organizational accounts.
-   **Profiles**: View and manage all registered companies.
-   **Direct Edits**: Update company names, contact emails, and website information.
-   **Usage Stats**: Quickly see the number of businesses and active users associated with each tenant to monitor growth and engagement.

### 2.2 Businesses & Strategic Progress
The **Businesses** tab provides a workspace-level view of progress.
-   **Workspace Tracking**: Monitor individual business units within companies.
-   **Lifecycle Monitoring**: See which businesses have completed the AI Questionnaire, reached PMF status, or are actively executing projects.
-   **Resource Utilization**: Track the number of active and launched projects per workspace.

### 2.3 Global User Management
The **User Management** tab serves as the central identity hub.
-   **Unified User List**: A searchable bank of all users registered on the platform.
-   **Role-Based Filtering**: Easily filter users by their system roles (Super Admin, Admin, Member, Collaborator, or Viewer).
-   **Permission Control**: Manually promote or demote users to ensure appropriate access levels across the site.

### 2.4 Plan Management (Super Admin Exclusive)
This is where the dynamic subscription engine lives.
-   **Limit Configuration**: Set hard caps on Workspaces, Users, Collaborators, and Viewers.
-   **Feature Gating**: Toggle access to core strategic modules (Insight, Strategic, PMF, Projects).
-   **Status Lifecycle**: Toggle plans between **Active** (available for purchase) and **Disabled** (legacy/inactive).

### 2.5 User History & Strategic Audit
The **User History** tab provides a chronological record of value-added actions.
-   **Contribution Logs**: Track when users complete questionnaire phases, generate strategic insights, or export reports.
-   **Engagement Attribution**: Understand which team members are most active in driving the strategy forward.

### 3.6 Audit Trail & Compliance
The **Audit Trail** is a high-security log of sensitive system events.
-   **Platform Changes**: Records changes to plans, user roles, and system configurations.
-   **Security Monitoring**: Logs logins, authentication failures, and password resets.
-   **Transparency**: Provides the "Decision Log" context for project pivots or cancellations, ensuring executive-level accountability.

### 3.7 Question & Framework Management
The **Questions** tab controls the platform's AI reasoning engine.
-   **Questionnaire Flow**: Add, edit, or remove questions from the Initial, Foundations, and Alignment phases.
-   **Logic Mapping**: Define which strategic frameworks (SWOT, PESTEL, etc.) a question contributes to.
-   **Ordering**: Use drag-and-drop to optimize the user onboarding experience and questionnaire flow.

### 3.8 Academy Feedback
The **Academy Feedback** tab allows Super Admins to monitor the effectiveness of this documentation.
-   **Usage Metrics**: Track which articles are marked as "Helpful" by users.
-   **Continuous Improvement**: Review direct user feedback to identify areas where documentation or platform guidance needs refinement.

> [!NOTE] Access to these management functions is strictly enforced by role. Collaborators and standard Viewers do not have access to the Admin Panel.