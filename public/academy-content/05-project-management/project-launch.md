# Launching to Active

The final stage of the project management lifecycle is transitioning from planning to active execution.

## 1. The Launch Button
Once the ranking process is complete and the team is aligned:
1. The Admin returns to the main **Projects dashboard**.
2. The Admin selects the projects they are ready to launch.
3. A **"Launch"** button appears in the header.

![Launch Button](/academy-screenshots/projects/launch.png)

## 2. State Transition: Active
Clicking **Launch** triggers several changes:
- **Lifecycle Status**: The project moves from **Draft** to **Active**.
- **Project Locking**: To protect the "Strategic Bet," **Collaborators** now lose their editing permissions and move to a **View-Only** state.

## 3. View-Only Permission
For all **Active** projects, collaborators can still see all metrics and progress but can no longer alter the core definitions (Success Criteria, Strategic Decision, etc.). This ensures accountability and prevents "goalpost shifting" during the learning phase.
 

## 4. Stale & Due Project Review Notifications

To enforce project governance and ensure that launched projects are reviewed in a timely manner, Traxxia includes a background scheduler that runs **every hour** in production (and **every minute** in development). 

### **Eligible Projects**
Only projects that are in the **Active** (`launched`) status are evaluated by the scheduler. Any draft, completed, paused, archived, or killed projects are skipped.

### **Notification Recipients**
*   **Accountable Owner** of the project.
*   **Project Creator** (if no accountable owner is currently assigned).
*   **Company Admins** of the associated workspace.

### **Notification Rules**

| Notification Type | Trigger Condition | In-App Notification | Email Specification |
| :--- | :--- | :--- | :--- |
| **1. Due Tomorrow Reminder** | Review is scheduled/due within the next **24 hours**. | `type: review_reminder` <br> *"Reminder: Project Review Tomorrow"* | **Subject**: `Reminder: Review for "{projectName}" Tomorrow` <br> **Message**: *Friendly reminder that the project **{projectName}** under **{businessName}** is scheduled for its periodic review tomorrow.* <br> **CTA**: **"Go to Projects"** button. |
| **2. Stale Project Warning** | Review is overdue by **24 hours or more**. | `type: stale_bet` <br> *"Overdue: Stale Project"* | **Subject**: `Action Required: Project "{projectName}" is Overdue` <br> **Message**: *The project **{projectName}** under **{businessName}** is overdue for its scheduled review. Please update its status or perform a review as soon as possible.* *(Styled in urgent red `#dc3545`)*. <br> **CTA**: **"Go to Projects"** button. |

 