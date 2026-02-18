# AI Ranking in the UI

Traxxia utilizes advanced AI to provide an objective, data-driven ranking of your project priorities, serving as a benchmark against human intuition.

## 1. How AI Ranking is Triggered

AI ranking is **automatically triggered** whenever you save your manual rankings in the Rank Projects panel. You do not need to manually request it — saving your rankings is enough.

A loading overlay ("Generating AI Rankings...") appears briefly while the AI analyzes your projects.

![AI Ranking](/academy-screenshots/projects/ai-assisted-ranking.png)

## 2. How it is Displayed

The AI Ranking appears alongside your manual ranking in the Ranking View.

*   **AI Rank**: A numerical rank assigned to each project based on strategic alignment and potential impact
*   **Comparison**: You can see at a glance where the AI agrees or disagrees with your team's manual ranking

## 3. Lock Project Creation & AI Ranking

When a **Company Admin** clicks **"Lock Project Creation"** (which moves the business to the "Prioritizing" phase):

1. The system calls the AI ranking engine for all current projects
2. AI rankings are saved and become visible to all collaborators
3. Project creation is locked — no new projects can be added
4. The business status moves to **"Prioritizing"**

This ensures the AI has a stable set of projects to rank before collaborators begin their manual ranking.

## 4. Comparing AI vs. Collaborator Ranking

Administrators have access to the **Rankings View** which shows all collaborators' rankings alongside the AI ranking.

This view highlights:
*   **Overlooked Gems:** Items ranked low by the team but high by AI. These may be worth reconsidering.
*   **Overhyped Features:** Items ranked high by the team but low by AI. These may be driven by bias rather than data.

Use these insights to facilitate discussion during the finalization meeting.

## 5. Re-ranking After Manual Changes

Every time rankings are saved, the AI re-ranks automatically. This means the AI ranking always reflects the latest state of your projects and their details.
