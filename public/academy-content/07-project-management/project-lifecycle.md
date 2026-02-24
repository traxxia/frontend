# Collaborative Lifecycle & Locking (UPDATED)
<!-- Content Refreshed: 2026-02-20 -->

In Traxxia, project management is about transforming "Strategic Initiatives" into "Draft Projects." This guide details the collaboration rules and internal states that govern this process.

## 1. The Collaborative Workflow
Any user can start a project by selecting one or more initiatives and clicking **"Create Project"**.

### **Project States & Colors**
Traxxia uses color-coded visual cues to signify a project's current status and health:
-   **Draft**: Standard grey border/badge for projects being fleshed out.
-   **Active**: **Green** border and badge for projects in active execution.
-   **At Risk**: **Red** border and badge for projects requiring immediate attention.
-   **Paused**: **Orange** border and badge for projects temporarily on hold.
-   **Killed**: **Grey** (semi-transparent) for projects that have been terminated.
-   **Scaled**: **Purple** border and badge for projects successfully completed.

### **Workspace Management Views**
Admins manage projects through three primary views:
-   **Project Management View**: The main hub for creating and editing draft projects.
-   **Prioritization Dashboard**: Active when the workspace is in the "Prioritizing" state (indicated by the **Blue** active tab).
-   **Finalized View**: Shows approved projects after they have been prioritized and launched.

![Project List View](/academy-screenshots/projects/project-list-view.png)
*Screenshot of the Project Management View*
 
## 2. Real-Time Field Locking
To ensure data integrity during simultaneous editing, Traxxia uses a **Field-Level Lock** system:
-   **Visual States**:
    -   **Blue Border**: You are currently editing this field (indicated by input focus).
    -   **Red Border**: Another user (named in the tooltip) has locked this field for editing.
-   **Manual Save**: Each field or section has its own save button to sync changes immediately to the cloud.

## 3. Auto-Unlock & Protection
-   **Inactivity Timer**: A **5-minute** inactivity timer governs each field lock (managed by the backend `heartbeat` service).
-   **Warning**: At **4 minutes** of inactivity, you receive a prompt to "Keep Editing."
-   **Auto-Unlock**: After **5 minutes** of idle time, the lock is automatically released, and any unsaved changes are discarded to allow other team members to contribute.

## 4. Org Admin Curation
Finalizing a project is an **Org Admin only** action.
-   **Review**: The Admin verifies all mandatory fields (Description, Strategic Decision, Metrics, etc.) are complete.
-   **Finalize**: Only Org Admins can "Launch" or "Finalize" projects, which locks them from further basic editing.
-   **Deletion**: Individual project deletion is enabled only for **Draft projects**. 

> [!TIP] Use the **Completion Meter** (progress bar) on draft project cards to see how close a project is to being ready for finalization.

Next: [Edit Project](edit-projects.md)
