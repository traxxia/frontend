# Dashboard Overview

Your Traxxia dashboard is your command center for managing strategic business initiatives. This guide helps you understand each section and make the most of your workspace.

## Dashboard Layout

The dashboard is organized into four main areas:

1. **Top Navigation**: Menu bar with user controls
2. **Main Content Area**: Business cards and actions
3. **Section Headers**: "My Businesses" and "Collaborating Businesses"
4. **Action Buttons**: Create business, filters, and more

![Dashboard full view showing all sections](/academy-screenshots/getting-started/dashboard.png)

---

## Top Navigation Bar

### Left Side
- **Traxxia Logo**: Click to refresh/return to dashboard

### Right Side
- **User Profile Icon**: Access your account menu
### Right Side
- **User Profile Icon**: Access your account menu

![Top navigation bar detail](/academy-screenshots/getting-started/dashboard.png)

---

## User Menu Options

Click your profile icon to access:

| Menu Item | Available To | Description |
|-----------|--------------|-------------|
| **Dashboard** | All except Super Admin | Return to main dashboard |
| **Traxxia Academy** | Everyone | Access this documentation |
| **Super Admin Panel** | Super Admin only | System administration |
| **Admin** | Company Admin, Super Admin | Company/user management |
| **Logout** | Everyone | End session securely |

> [!TIP]
> Your role and email are displayed at the top of the user menu for quick reference.

---

## My Businesses Section

This section shows **businesses you own or created**.

### Business Card Components

Each business card displays:

#### 1. Business Header
- **Business Name**: Main identifier

#### 2. Progress Indicator  
- **Circular Progress Bar**: Shows AI questionnaire completion (0-100%)
- **Color-coded**:
  - Blue (0-33%): Getting started
  - Orange (34-66%): In progress
  - Green (67-100%): Nearly complete

![Business card showing progress indicator](/academy-screenshots/business-management/business-actions-menu.png)

#### 3. Business Information
```
Purpose: [Business purpose you entered]
Description: [Brief description]
```

#### 4. Action Buttons

**Open Button** (Primary Blue):
- Opens the business details page
- Available to all with access

**Delete Button** (Red Trash Icon):
- Permanently removes the business
- Only available to business owners and adminsibraries
- Requires confirmation

![Business card action buttons](/academy-screenshots/business-management/business-actions-menu.png)

### Business Organization

See the accordion-based organization in [First Login Experience](./04-first-login-experience.md#step-7-understand-your-dashboard) for details on how businesses are grouped and displayed.

---

## Collaborating Businesses Section

Shows **businesses you've been invited to** by others.

### Key Differences from "My Businesses":
- Shows "Owner: [Name]" label
- Cannot delete these businesses
- Same progress and information display
- Full edit access (unless you're a Viewer)

![Collaborating businesses section](/academy-content/01-getting-started/images/issue2-collaborator-business.png)

---

## Create New Business Button

**Location**:  At the top of the "My Businesses" section

**Availability**: Org Admin, User, and Collaborator

> [!NOTE]
> Super Admins have view-only access and cannot create businesses. Viewers do not have creation privileges.

**What It Does**:
1. Opens a modal dialog
2. Prompts for business details:
   - Business Name (required, max 20 characters)
   - Business Purpose (required)
   - Description (optional)
   - City (optional)
   - Country (optional)
3. Creates the business and adds it to your dashboard

![Create business modal](/academy-screenshots/business-management/create-business-button.png)

### Business Name Rules

> [!WARNING]
> Business names must:
> - Not be empty
> - Be 20 characters or less
> - Not start with a number or symbol
> - Start with a letter

### After Creation

When you create a business:
1. ✅ Success message appears
2. ✅ Business card appears on dashboard
3. ✅ You're ready to start the AI questionnaire
4. ✅ Progress shows 0% initially

---

## Empty States

### No Businesses Yet

**What You See**:
```
📊 No businesses found

[Create New Business] button

or

You haven't been invited to any businesses yet.
```

**Next Steps for Admins**:
- Click "Create New Business" to start

**Next Steps for Collaborators**:
- Wait for an invitation from your administrator
- Check with your team lead

![Empty state for new users](/academy-screenshots/getting-started/dashboard.png)

---

## Business Progress Tracking

### How Progress is Calculated

The circular progress indicator shows **AI questionnaire completion**:

```
Progress % = (Answered Questions / Total Questions) × 100
```

**Example**:
- Total questions in module: 50
- Questions answered: 25
- Progress shown: 50%

### Progress Colors

| Percentage | Color | Status |
|------------|-------|--------|
| Percentage | Color | Status |
|------------|-------|--------|
| 0-33% | Blue | Just started |
| 34-66% | 🟡 Orange | Making progress |
| 67-99% | 🟢 Green | Almost done |
| 100% | ✅ Green | Complete |

---

## Understanding Business Status

### Phase 1: Analysis (Green Cards)

**Characteristics**:
- No projects created yet
- Focus on answering AI questions
- Running strategic analysis (SWOT, PESTEL, etc.)
- Uploading financial documents
- Building comprehensive business understanding

**Available Actions**:
- Complete questionnaire
- View strategic analysis
- Upload financial data
- Invite collaborators

### Phase 2: Projects (Blue Cards)

**Characteristics**:
- At least one project created
- Transition from analysis to execution
- Focus on strategic initiatives
- Project prioritization and ranking

**Available Actions**:
- Manage projects
- Rank priorities
- Assign team members
- Track progress
- Continue refining analysis

> [!NOTE]
> You can move back and forth between phases. Creating projects doesn't lock you out of the questionnaire or analysis.

---

## Dashboard Actions by Role

### Super Admin
```
✅ View all businesses (read-only)
✅ Invite and manage users
✅ Access Super Admin Panel
❌ Cannot create businesses
❌ Cannot modify business data
```

### Company Admin (Org Admin)
```
✅ View company businesses
✅ Create businesses
✅ Delete company businesses  
✅ Invite collaborators
✅ Access admin features
```

### Collaborator
```
✅ View assigned businesses
✅ Open and edit assigned businesses
✅ Cannot create businesses
✅ Cannot delete businesses they created
❌ Cannot access admin features
```

### Viewer
```
✅ View assigned businesses
✅ Open assigned businesses (read-only)
❌ Cannot edit anything
❌ Cannot create or delete
❌ Cannot access admin features
```

---

## Quick Actions

### Open a Business
1. Find the business card
2. Click the **"Open"** blue button
3. You'll be taken to the business details page

### Delete a Business
1. Locate the business card
2. Click the **red trash icon**
3. Confirm deletion in the popup
4. Business is permanently removed

> [!CAUTION]
> Deleting a business cannot be undone. All associated data (questions, analyses, projects) will be permanently deleted.

![Delete confirmation modal](/academy-screenshots/business-management/delete-confirmation.png)

### Filter/Search Businesses (Future)

### Filter/Search Businesses (Future)

Currently, businesses are displayed in creation order. Search features are planned for future releases.

---

## Dashboard Performance Tips

### 1. Business Organization
If you have many businesses, consider:
- Using clear, descriptive names
- Adding detailed purposes
- Grouping related initiatives

### 2. Regular Cleanup
Periodically review and delete:
- Completed or cancelled initiatives
- Test/demo businesses
- Outdated projects

### 3. Collaboration
Invite team members early:
- Distribute workload
- Get diverse perspectives
- Accelerate completion

---

## Dashboard Shortcuts

| Action | Shortcut | Description |
|--------|----------|-------------|
| **Return to Dashboard** | Click Traxxia logo | From anywhere in the app |
| **Refresh Dashboard** | F5 or Cmd+R | Reload latest data |
| **Open Business** | Click blue "Open" button | Navigate to business |
| **User Menu** | Click profile icon | Access settings and logout |

---

## Common Dashboard Scenarios

### Scenario 1: Just Logged In

**What to do**:
1. Review businesses on your dashboard
2. Check progress indicators
3. Prioritize businesses needing attention
4. Click into businesses with low progress

### Scenario 2: Multiple Businesses

**How to manage**:
1. Focus on one at a time
2. Complete questionnaires fully before starting new ones
3. Use business descriptions to track purpose
4. Archive/delete completed initiatives

### Scenario 3: Invited to a Business

**Your workflow**:
1. Find it in "Collaborating Businesses" section
2. Click "Open" to view details
3. Review owner's notes and progress
4. Start contributing to questionnaire/projects

### Scenario 4: Creating Your First Business

**Steps**:
1. Click "Create New Business"
2. Fill required fields carefully
3. Save and open the business
4. Begin AI questionnaire immediately

---

## Dashboard Notifications (Future)

Planned features include:
- 🔔 Notification badges for updates
- 📧 Email summaries of business activity
- 👥 Collaborator activity feeds
- ⏰ Reminders for incomplete questionnaires

---

## Mobile Responsiveness

The dashboard adapts to mobile devices:

**Mobile View Changes**:
- Business cards stack vertically
- Simplified card layout
- Touch-friendly buttons
- Hamburger menu for navigation

> [!TIP]
> While Traxxia works on mobile, we recommend using a desktop or tablet for the best experience with strategic analysis visualizations.

---

## Troubleshooting

### Issue: Businesses Not Loading

**Solutions**:
- Refresh the page (F5)
- Check your internet connection
- Clear browser cache
- Log out and log back in
- Contact support if persists

### Issue: Can't Create Business

**Possible Causes**:
- You don't have admin permissions
- Your account role is Viewer
- Network connectivity issue

**Solution**:
- Verify your role in the user menu
- Contact your Company Admin for permissions

### Issue: Business Card Shows Wrong Progress

**Solutions**:
- Open the business and check actual question progress
- Refresh the dashboard
- Progress syncs with questionnaire completion

---

## Best Practices

### 1. Regular Dashboard Reviews
Check your dashboard daily or weekly to:
- Monitor progress across businesses
- Respond to collaborator input
- Prioritize incomplete work

### 2. Descriptive Business Information
When creating businesses:
- Use clear, specific names
- Write detailed purposes
- Include relevant context in descriptions

### 3. Active Collaboration
If you own a business:
- Invite collaborators early
- Review their contributions
- Keep team engaged

### 4. Clean Workspace
Maintain dashboard organization:
- Delete obsolete businesses
- Complete or close dormant projects
- Keep active initiatives front and center

---

## Next Steps

Now that you understand the dashboard:

1. [Learn navigation basics](./06-navigation-basics.md) to move efficiently
2. [Create your first business](../02-businesses/01-creating-your-first-business.md) if you're an admin
3. [Start the AI questionnaire](../03-questionnaire/01-ai-assistant-overview.md) for your businesses

---

**Related Articles:**
- [First Login Experience](./04-first-login-experience.md)
- [Understanding User Roles](./03-understanding-user-roles.md)
- [Navigation Basics](./06-navigation-basics.md)
- [Creating Your First Business](../02-businesses/01-creating-your-first-business.md)
