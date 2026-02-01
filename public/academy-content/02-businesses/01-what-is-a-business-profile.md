# What is a Business Profile?

In Traxxia, a **Business Profile** is the core organizational unit for strategic planning and analysis. It represents a specific business initiative, venture, department, or strategic project you want to analyze and manage.

Think of a Business Profile as a dedicated workspace for:
- Strategic analysis and planning
- AI-driven questionnaires
- Financial analysis
- Project management
- Team collaboration

---

## Business vs. Company vs. Organization

It's important to understand the distinction:

| Term | Definition | Example |
|------|------------|---------|
| **Organization** | The entire Traxxia deployment | "Acme Corporation" |
| **Company** | A company within the organization | "Acme North America Division" |
| **Business Profile** | A specific strategic initiative | "Launch New Product Line in LATAM" |

> [!NOTE]
> Super Admins can manage multiple companies. Company Admins manage businesses within their company. Most users work with Business Profiles.

---

## What Makes Up a Business Profile?

Every Business Profile contains:

### 1. Basic Information
- **Business Name**: Unique identifier (max 20 characters)
- **Business Purpose**: Why this business exists
- **Description**: Detailed context
- **Location**: City and country

### 2. Strategic Components
- **AI Questionnaire**: Comprehensive business questions
- **Strategic Analysis**: SWOT, PESTEL, Porter's Five Forces, etc.
- **Financial Analysis**: Profitability, growth, risk metrics
- **Projects**: Strategic initiatives and priorities

### 3. Collaboration Features
- **Owner**: Creator of the business
- **Collaborators**: Invited team members
- **Permissions**: Role-based access control

### 4. Progress Tracking
- **Questionnaire Completion**: Percentage of questions answered
- **Analysis Generation**: Which frameworks are ready
- **Project Status**: Implementation progress

---

## Types of Business Profiles

Business Profiles can represent various strategic scenarios:

### 1. New Business Launch
**Use Case**: You're starting a new company or venture

**What to Include**:
- Business concept and value proposition
- Target market and customers
- Competitive landscape
- Go-to-market strategy

**Example**: "Launch E-commerce Platform for Handcrafted Goods"

### 2. Product/Service Expansion
**Use Case**: Adding a new offering to an existing business

**What to Include**:
- New product/service details
- Market opportunity analysis
- Resource requirements
- Competition assessment

**Example**: "Expand Consulting Services to Include AI Strategy"

### 3. Geographic Expansion
**Use Case**: Entering new markets or regions

**What to Include**:
- Target market characteristics
- Local competitive dynamics
- Regulatory considerations
- Entry strategy

**Example**: "Open Retail Locations in LATAM Region"

### 4. Strategic Initiative
**Use Case**: Major change or transformation project

**What to Include**:
- Initiative goals and objectives
- Stakeholder analysis
- Change management considerations
- Success metrics

**Example**: "Digital Transformation Initiative for Operations"

### 5. Department or Business Unit
**Use Case**: Analyzing a specific part of your organization

**What to Include**:
- Department mission and goals
- Internal capabilities
- Resource allocation
- Performance metrics

**Example**: "Marketing Department Strategic Plan 2024"

---

## Business Profile Lifecycle

### Phase 1: Creation & Analysis
- **Focus**: Setting up the business structure and analyzing potential
- **Key Activities**: Answering AI Questionnaire, Strategic Analysis
- **Dashboard Appearance**: Located under **Businesses** accordion

### Phase 2: Execution
- **Focus**: Implementing the strategy
- **Key Activities**: Project management, detailed planning
- **Dashboard Appearance**: Located under **Projects** accordion

> [!IMPORTANT]
> Creating your first project automatically transitions the business from Analysis to Projects phase. The dashboard card color changes from green to blue.

### Phase 3: Launched (Future Feature)

**Status**: Launched

**What Happens**:
- Business is live/operational
- Focus shifts to performance monitoring
- Historical analysis available
- Locked from major edits

---

## Business Ownership & Permissions

### Business Owner

The user who created the Business Profile is the **Owner**.

**Owner Permissions**:
- ✅ **Can** create new businesses
- ✅ **Can** edit business details
- ❌ **Cannot** invite collaborators (Org Admin only)
- ❌ **Cannot** remove collaborators (Org Admin only)
- ✅ Can change business details

### Invited Collaborators

Users invited to work on the business.
> [!NOTE]
> Collaborator permissions are based on their assigned role in the business. Super Admins cannot be added to the project phase.

**Collaborator Permissions (based on role)**:
- Company Admin: Full access
- Collaborator: Edit access, cannot delete
- Viewer: Read-only access

**Invitation Process**:
```
1. **Owner/Admin invites** user to the business
2. **Invitee** sees the business appear in their dashboard
3. **Collaborator** can access based on permissions
```

---

## Business Profile Best Practices

### 1. Descriptive Naming

**Bad Example**: "Business 1", "Test", "New Project"

**Good Example**: "LATAM Market Entry 2024", "AI Consulting Service Launch", "Manufacturing Efficiency Initiative"

> [!TIP]
> Use names that clearly communicate what the business is about. You'll

### 2. Comprehensive Purpose

**Weak Purpose**: "Increase revenue"

**Strong Purpose**: "Launch a subscription-based AI consulting service targeting mid-market companies in financial services to diversify revenue streams and leverage our AI expertise"

### 3. Detailed Description

Include:
- Context and background
- Strategic rationale
- Key stakeholders
- Success metrics
- Timeline (if applicable)

### 4. Single Focus

**Don't**: Combine multiple unrelated initiatives in one Business Profile

**Do**: Create separate profiles for distinct initiatives

**Example**:
- ❌ "2024 Strategic Initiatives" (too broad)
- ✅ "Product Line Extension - Smart Home Devices"
- ✅ "Enter European Market"
- ✅ "Digital Marketing Transformation"

---

## When to Create a New Business Profile

Create a new Business Profile when:

✅ You're starting a new venture or product
✅ Entering a new market or geography
✅ Launching a major strategic initiative
✅ Need separate analysis for a department
✅ Different team will own the initiative
✅ Requires distinct strategic planning

**Don't create a new profile when:**

❌ It's a minor update to existing business
❌ It's a task within a larger project
❌ Just need to update business information

---

## Business Data & Privacy

### Data Ownership

- Business data belongs to the owner's company
- Super Admins can access all businesses
- Company Admins can access company businesses
- **Collaborators**: See only businesses they are assigned to or created

### Data Included

**Stored in Business Profile**:
- All questionnaire answers
- Strategic analysis results
- Financial projections
- Projects and rankings

**Not Stored**:
- User passwords
- Payment information (non-applicable)
- Cross-business data

### Data Security

> [!WARNING]
> Deleting a Business Profile permanently removes all associated data:
> - Questionnaire answers
> - Strategic analyses
> - Financial documents
> - Projects and rankings
> - Collaboration history

There is no "undo" or recovery option.

---

## Managing Multiple Business Profiles

### Organizing Your Portfolio

Traxxia helps you manage multiple businesses by:

1.  **Phase**: Analysis vs. Execution (Accordion separation)
2.  **Collaboration**: See which businesses define you as a collaborator

### Workspace Management

**Keep Dashboard Clean**:
- Delete test/demo profiles
- Use consistent naming conventions

**Batch Similar Work**:
- Complete questionnaires for all businesses first
- Then review all analyses together
- Create projects in batches

---

## Business Profile Metrics

Traxxia tracks several metrics per business:

| Metric | Description | Shown On |
|--------|-------------|----------|
| **Progress %** | Questionnaire completion | Dashboard card |
| Phase | Where business is in lifecycle | Accordion group |
| **Projects Count** | Number of initiatives | Projects tab |
| **Team Size** | Invited collaborators | Business settings |
| **Last Updated** | Recent activity timestamp | Business details |

---

## Common Questions

**Q: How many Business Profiles can I create?**
**A:** Currently, you can create up to **5 businesses** per user.

**Q: Can I duplicate a Business Profile?**
A: Not currently. You must create each business separately. This encourages unique, focused analysis.

**Q: Can I move a business between companies?**
A: No. Businesses belong to the creating company. Super Admins would need to recreate it.

**Q: What happens if the business owner leaves the organization?**  
A: The Company Admin can reassign ownership or manage the business directly.

**Q: Can I merge two Business Profiles?**  
A: No. Keep businesses separate for clarity. If they should be one initiative, create a new combined business and archive the old ones.

**Q: Is there a template for Business Profiles?**  
A: No template system currently. Each business follows the same structure (questionnaire, analysis, projects), but content is unique.

---

## Next Steps

Now that you understand Business Profiles:

1. **[Create Your First Business](./02-creating-your-first-business.md)** - Step-by-step guide
2. **[Complete the AI Questionnaire](../03-questionnaire/01-ai-assistant-overview.md)** - Answer strategic questions
3. **[Explore Strategic Analysis](../04-strategic-analysis/01-strategic-analysis-overview.md)** - Generate insights

---

**Related Articles:**
- [Creating Your First Business](./02-creating-your-first-business.md)
- [Dashboard Overview](../01-getting-started/05-dashboard-overview.md)
- [Understanding User Roles](../01-getting-started/03-understanding-user-roles.md)
- [AI Assistant Overview](../03-questionnaire/01-ai-assistant-overview.md)
