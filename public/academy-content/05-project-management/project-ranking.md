# The Ranking Workflow

Ranking is a multi-stage collaborative process that alternates between the **Company Admin** and the **Collaborators**.

## Stage 1: Admin Selection (Rank Your Project)
The process begins with the Admin. In the **Ranking** tab, under the **"Rank Your Project"** sub-tab:
1. The Admin selects a list of **Draft** projects they want to prioritize.
2. The Admin clicks **"Generate AI Rank"**. Traxxia analyzes the metadata (Impact, Effort, Risk) and suggests an initial order.
3. The Admin can then manually reorder the list as they wish.

![Admin Ranking Setup](/academy-screenshots/projects/rank-project-selection1.png)

## Stage 2: Collaborative Input
Once the Admin saves their initial rank:
1. **Unlocking**: The projects are now unlocked for all assigned collaborators.
2. **Collaborator View**: Every collaborator will see this list under their own **Ranking** tab.
3. **Submissions**: Each collaborator reorders the projects and saves their individual ranking.

## Stage 3: Progress Tracking
While the team is ranking, the Admin can monitor progress in real-time. A **Collaborator Progress Bar** in the Admin view updates as each team member hits "Save."

## Collaborative Ranking Notifications

To keep the leadership team and active collaborators aligned during the prioritization cycle, Traxxia sends automated, real-time in-app notifications and email alerts based on ranking actions.

### **Scenario A: Admin Ranks Projects**
*   **Trigger**: The Administrator completes and saves the initial project rankings for a business.
*   **Recipients**: All active **Collaborators** assigned to that business workspace.
*   **In-App Notification**: `type: admin_ranked_projects` ("Time to Rank Projects").
*   **Email Alert**:
    *   **Subject**: `Action Required: Project Ranking Update`
    *   **Body**: *The administrator has completed project rankings for **{businessName}**. Please review and submit your rankings.*
    *   **Call-to-Action**: Includes a direct **"View Rankings"** button linking to the collaborative ranking page.

### **Scenario B: Collaborator Ranks Projects**
*   **Trigger**: A Collaborator completes their personal ranking adjustments and saves their rationale.
*   **Recipients**: **Company Admins**.
*   **In-App Notification**: `type: collaborator_ranked_projects` ("Collaborator Ranked Projects").
*   **Email Alert**:
    *   **Subject**: `Update: Collaborator Ranked Projects`
    *   **Body**: ***{userName}** has submitted project rankings for **{businessName}**.*
    *   **Call-to-Action**: Includes a direct **"View Rankings"** button to review the collaborator's input.

  