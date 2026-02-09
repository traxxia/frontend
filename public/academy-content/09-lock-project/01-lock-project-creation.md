# Lock Project Creation

Understanding how and when to lock a project is essential for maintaining data integrity and ensuring stability after the planning phase.

## 1. Access Control: Who Can Lock?

Locking a project is a sensitive action that freezes the project's parameters. Therefore, this capability is restricted to high-level roles:
*   **Organization Admins:** Have full control over all projects within the organization.
*   **Project Owners:** Can lock projects they explicitly own.

Standard collaborators and viewers cannot lock or unlock projects.

## 2. Before Locking

Before you lock a project, ensure the following:
*   **Scope is Finalized:** All initial planning data has been entered and verified.
*   **Stakeholder Approval:** Key stakeholders have reviewed and agreed upon the project charter.
*   **Team Assembled:** The core team members have been assigned.

![lock project creation](/academy-screenshots/projects/create-project-button.png)

**State:** *Editable* - All fields and settings can be modified.

## 3. After Locking

Once a project is locked:
*   **Immutability:** Core project details (Name, Objectives, Start Date) become read-only.
*   **Phase Transition:** The project officially moves from "Planning" to "Execution" or "Analysis".
*   **Audit Trail:** A record is created indicating who locked the project and when.

![After Project Creation Locked](/academy-screenshots/projects/project-locked.png)

**State:** *Locked* - Critical fields are frozen. To make changes, an Admin must explicitly unlock the project, which will trigger a notification to all stakeholders.
