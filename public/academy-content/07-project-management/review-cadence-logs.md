# Review Cadence & Decision Logs

Traxxia is built on a "Review Loop" philosophy. To ensure strategy doesn't become stale, every project must undergo regular accountability checks.

## 1. Setting a Review Cadence
When a project is activated, the owner assigns a **Review Cadence**:
-   **Monthly**: For fast-moving experiments or high-risk bets.
-   **Quarterly**: For long-term infrastructure or brand initiatives.
-   **Milestone-based**: For projects with clear, non-time-specific phases.

## 2. The "Stale" Logic
The system automatically monitors the time since the last **Official Cadence Review**. 
-   If a review is overdue, the project is visually flagged as **"Stale"** in the UI.
-   **Ad-hoc Updates**: You can modify a project (e.g., changing it to "At Risk") at any time. This records an event in the log but **does not** reset the cadence timer. Only a formal review clears the "Stale" status.

## 3. Performing a Cadence Review
During a scheduled review, the owner must manual click "Perform Review" and provide input on:
1.  **The Decision**: Select one of four actions: **Continue, Pivot, Increase Investment, or Kill**.
2.  **The Justification**: Provide a mandatory text explanation for the decision.

### The "No Change" Clause
If a project is performing exactly as expected and no details need to be changed, the owner must still manually select **"Proceed with No Changes"** and provide a justification (e.g., "Performance on track, no pivot needed"). This clears the stale flag and maintains accountability.

## 4. The Decision Log (Audit Trail)
The **Decision Log** is an immutable record of every strategic adjustment. It captures:
-   **Log Type**: Detects if it was a "Cadence Review" or an "Ad-hoc Update."
-   **States**: The Execution and Assumption states at that point in time.
-   **Reasoning**: The mandatory justification provided by the owner.
-   **Lifecycle Metadata**: Timestamp and the specific actor who made the decision.

> [!TIP] This log allows the CEO and Leadership team to perform a "post-mortem" or audit of why specific strategic paths were chosen or abandoned, creating an organizational learning loop.

Next: [Ranking & Consensus](../08-prioritization-launch/ranking-and-consensus.md)
