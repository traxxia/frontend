# Understanding User Roles

Traxxia uses a role-based access control system to ensure the right people have the right permissions. Understanding your role helps you know what features you can access and what actions you can perform.

## User Role Types

Traxxia supports four distinct user roles, each with specific permissions and responsibilities:

### 1. 🔱Super Admin (Org Admin)

The highest level of access in Traxxia. Super Admins have complete control over the entire organization.

**Key Permissions:**
- Create and manage multiple companies
- Access all company data across the organization
- Manage all users across all companies
- View and modify all businesses
- Access the Super Admin Panel
- Configure system-wide settings
- View audit trails and user history

**Typical Use Case:**  
Organization owners, IT administrators, or executives who need oversight of the entire Traxxia deployment.

> [!IMPORTANT]
> Super Admins bypass most permission restrictions. This role should only be assigned to trusted individuals who need full system access.

---

### 2. 👔 Company Admin (Org Admin)

Full administrative control within their specific company, but cannot access other companies' data.

**Key Permissions:**
- Create and manage businesses within their company
- Invite and manage users in their company
- View all businesses in their company
- Access admin dashboard features
- Manage projects and strategic analysis
- Upload financial documents
- Assign collaborators to businesses

**Typical Use Case:**  
Department heads, business unit managers, or company administrators who manage a specific organization within Traxxia.

![Company Admin dashboard showing business management options](/academy-screenshots/getting-started/registration-form-filled.png)

> [!TIP]
> Company Admins are sometimes referred to as "org admins" throughout the platform. These terms are interchangeable.

---

### 3. 🤝 Collaborator

Contributors who work on specific businesses they've been invited to. They have full edit access to their assigned businesses.

**Key Permissions:**
- View and edit businesses they're assigned to
- Answer AI questionnaire questions
- Create and manage projects
- Participate in strategic planning
- Rank and prioritize projects
- Add comments and feedback
- Upload documents to assigned businesses

**Restrictions:**
- Cannot create new businesses
- Cannot invite other users
- Cannot access businesses they're not assigned to
- Cannot delete businesses
- Cannot access admin features

**Typical Use Case:**  
Team members, consultants, analysts, or stakeholders who contribute to specific business initiatives.

![Collaborator view showing assigned businesses](/academy-screenshots/getting-started/registration-form-filled.png)

---

### 4. 👁️ Viewer

Read-only access to assigned businesses. Viewers can see information but cannot make changes.

**Key Permissions:**
- View businesses they're assigned to
- Read strategic analysis results
- View project information
- See AI-generated insights
- Download reports (when available)

**Restrictions:**
- Cannot edit any content
- Cannot answer questions
- Cannot create or modify projects
- Cannot rank projects
- Cannot upload documents
- Cannot invite users
- Limited chat functionality

**Typical Use Case:**  
Stakeholders, board members, or external parties who need visibility but shouldn't modify data.

> [!NOTE]
> Viewers will see a message indicating they have read-only access when attempting to perform restricted actions.

---

## Role Comparison Matrix

| Feature | Super Admin | Company Admin | Collaborator | Viewer |
|---------|-------------|---------------|--------------|--------|
| **Create Businesses** | ✅ All companies | ✅ Own company | ❌ No | ❌ No |
| **Edit Businesses** | ✅ All | ✅ Own company | ✅ Assigned only | ❌ No |
| **Delete Businesses** | ✅ All | ✅ Own company | ❌ No | ❌ No |
| **Invite Users** | ✅ Yes | ✅ Own company | ❌ No | ❌ No |
| **Answer AI Questions** | ✅ Yes | ✅ Yes | ✅ Assigned only | ❌ No |
| **Create Projects** | ✅ Yes | ✅ Yes | ✅ Assigned only | ❌ No |
| **Rank Projects** | ✅ Yes | ✅ Yes | ✅ Assigned only | ❌ No |
| **Upload Financial Docs** | ✅ Yes | ✅ Yes | ✅ Assigned only | ❌ No |
| **View Strategic Analysis** | ✅ All | ✅ Own company | ✅ Assigned only | ✅ Assigned only |
| **Access Admin Panel** | ✅ Yes | ✅ Limited | ❌ No | ❌ No |
| **Manage Users** | ✅ All companies | ✅ Own company | ❌ No | ❌ No |

---

## How to Check Your Role

You can view your current role in several places:

### 1. User Menu
1. Click your profile icon in the top-right corner
2. Your role appears under your name and email
3. The format shows: "Role: [Your Role]"

![User menu showing role information](/academy-screenshots/getting-started/registration-form-filled.png)

### 2. Dashboard Header
Your role may be displayed in the dashboard header, depending on your account type.

### 3. Browser Session
Your role is stored securely in your browser session and persists until you log out.

---

## Role Assignment

### How Roles Are Assigned

Roles are assigned when:

1. **During Registration**
   - First user from a company becomes Company Admin
   - Invited users receive the role assigned by the inviter

2. **By Administrators**
   - Super Admins can assign any role
   - Company Admins can assign Collaborator or Viewer roles within their company

3. **Cannot Self-Assign**
   - Users cannot change their own roles
   - Contact your administrator to request a role change

### Requesting a Role Change

If you need different permissions:

1. Contact your Company Admin or Super Admin
2. Explain why you need the role change
3. They can modify your role in the User Management section

> [!WARNING]
> Changing a user's role takes effect immediately. Users may need to refresh their browser to see updated permissions.

---

## Business Access Control

Beyond roles, Traxxia controls access at the **business level**:

### Owner vs. Collaborator Access

- **Business Owner**: The user who created the business
  - Full control over the business
  - Can delete the business
  - Can invite collaborators
  
- **Invited Collaborator**: User invited to the business
  - Can edit business content
  - Cannot delete the business
  - Cannot remove other collaborators

![Business collaborators panel showing owner and invited users](/academy-screenshots/getting-started/registration-form-filled.png)

### Invitation System

Company Admins and Super Admins can invite users to specific businesses:

```
1. Navigate to the business
2. Click "Invite Collaborators"
3. Enter email addresses
4. Assign role (Collaborator or Viewer)
5. Users receive invitation emails
```

---

## Common Scenarios

### Scenario 1: New Employee
**Question**: A new analyst joins your team. What role should they have?

**Answer**: Assign them the **Collaborator** role and invite them to specific businesses they'll work on. They'll have full edit access to those businesses without being able to create new ones or access sensitive admin features.

### Scenario 2: External Consultant
**Question**: You're working with an external strategy consultant. What's appropriate?

**Answer**: Assign **Collaborator** role if they need to input data and create projects. Assign **Viewer** if they only need to review and provide feedback externally.

### Scenario 3: Board Member Access
**Question**: A board member wants visibility into strategic planning.

**Answer**: Assign **Viewer** role. They can review all strategic analyses and project plans without accidentally modifying anything.

### Scenario 4: Department Head
**Question**: You have a department head who manages their own team's strategic initiatives.

**Answer**: Assign **Company Admin** role. They can create businesses for their projects, manage their team members, and have full control within their scope.

---

## Security Best Practices

### 1. Principle of Least Privilege
Assign the minimal role necessary for each user's responsibilities. You can always upgrade later if needed.

### 2. Regular Audits
Super Admins should periodically review user roles and access:
- Remove access for departed employees
- Verify roles match current responsibilities
- Check for unused accounts

### 3. Separation of Duties
Don't assign Super Admin unnecessarily. Use Company Admin for departmental autonomy while maintaining organizational oversight.

### 4. Viewer for Sensitive Visibility
When someone needs to see data but shouldn't modify it (compliance, auditing), always use Viewer role.

---

## FAQ

**Q: Can I have different roles in different businesses?**  
A: No. Your role is set at the user account level and applies across all businesses you can access. However, you may be a **collaborator** on some businesses and have no access to others.

**Q: What happens if I'm assigned Viewer but try to edit something?**  
A: The system will display a message indicating you have read-only access and prevent the action.

**Q: Can a Collaborator see other businesses in the same company?**  
A: No. Collaborators only see businesses they've been explicitly invited to.

**Q: How do I know who has access to my business?**  
A: Business owners and Company Admins can view the list of collaborators in the business settings.

**Q: Can roles be changed after assignment?**  
A: Yes. Super Admins and Company Admins can modify user roles at any time through the User Management interface.

---

## Next Steps

Now that you understand user roles:

1. [Explore your Dashboard](./05-dashboard-overview.md) based on your role
2. [Learn about navigation](./06-navigation-basics.md) to find features available to you
3. [Create your first business profile](../02-businesses/01-creating-your-first-business.md) (if you have permission)

---

**Related Articles:**
- [Creating an Account](./02-creating-an-account.md)
- [Dashboard Overview](./05-dashboard-overview.md)
- [Inviting Collaborators](../07-collaboration/02-inviting-collaborators.md)
