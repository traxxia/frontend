# Collaborative Lifecycle & Locking

In Traxxia, project management is about transforming "Strategic Initiatives" into "Draft Projects." This guide details the collaboration rules and internal states that govern this process.

## 1. The Collaborative Workflow
Any user can start a project by selecting one or more initiatives and clicking **"Create Project"**.

### **Project Dashboards**
Admin manage projects through three primary workspace views:
-   **Draft Projects Tab**: Shows projects currently being fleshed out by the team (Orange badge).
-   **Finalized Projects Tab**: Shows curated projects approved by the Org Admin (Green badge).
-   **Prioritization Dashboard**: Active only during a prioritization event (Blue badge).

## 2. Real-Time Field Locking
To ensure data integrity during simultaneous editing, Traxxia uses a **Field-Level Lock** system:
-   **Visual States**:
    -   **Blue Border**: You are currently editing this field.
    -   **Red Border**: Another user (named in the tooltip) has locked this field.
-   **Manual Save**: Each field or section has its own save button to sync changes immediately to the cloud.

## 3. Auto-Unlock & Protection
-   **Inactivity Timer**: A 5-minute timer starts when you focus on a field.
-   **Warning**: At 4 minutes, you receive a prompt to "Keep Editing."
-   **Auto-Unlock**: After 5 minutes of idle time, the field unlocks, and any unsaved changes you had are discarded to allow others to edit.

## 4. Org Admin Curation
Finalizing a project is an **Org Admin only** action.
-   **Review**: The Admin verifies all mandatory fields (Description, Scope, Metrics, etc.) are complete.
-   **Finalize**: Clicking "Finalize Project" locks the project permanently from editing and moves it to the Finalized tab.
-   **Deletion**: Only **Draft projects** can be deleted by the Org Admin. Once prioritization starts, the deletion of its component projects is disabled.

> [!TIP]
> Use the **Completion Meter** (progress bar) on draft project cards to see how close a project is to being ready for finalization.

Next: [Ranking & Prioritization Workflow](../08-prioritization-launch/ranking-and-consensus.md)
