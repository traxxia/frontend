# Understanding User Roles

Traxxia uses a role-based access control system to ensure the right people have the right permissions. Understanding your role helps you know what features you can access and what actions you can perform.

## User Role Types

Traxxia supports four distinct user roles, each with specific permissions and responsibilities:

### 1. 🔱 Super Admin (Super Admin)

The highest level of organizational oversight in Traxxia. Super Admins have viewing privileges for all organizational data.

**Key Permissions:**
- **View** all businesses in the organization (read-only access)
- Invite and manage users across the organization
- Control organization-wide settings
- Assign roles to users
- View audit trails and user history
- Access the Super Admin Panel

**What they cannot do:**
- Create new businesses
- Modify or edit business information  
- Delete businesses
- Access business questionnaires or analyses
- Upload financial documents

**Typical Use Case:**  
Organization owners, IT administrators, or executives who need oversight of the entire Traxxia deployment without hands-on business management.

> [!IMPORTANT]
> Super Admins have **viewing privileges only** for business data. To create or manage businesses, users need the Org Admin, User, or Collaborator + User roles.

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

![Company Admin dashboard showing business management options](/academy-content/01-getting-started/images/issue1-admin.png)

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

**Business Creation:**
- Collaborators can create businesses
- Users can have multiple roles simultaneously (e.g., User + Collaborator)
- Check your assigned roles in the user menu to confirm business creation privileges
- Can delete businesses they created (if they have User role)

**Restrictions:**
- Cannot invite other users
- Cannot access businesses they're not assigned to
- Cannot delete businesses created by others
- Cannot access admin features
- Cannot modify organization settings

**Typical Use Case:**  
Team members, consultants, analysts, or stakeholders who contribute to specific business initiatives.

![Collaborator view showing assigned businesses](/academy-content/01-getting-started/images/issue2-collaborator-business.png)

> [!NOTE]
> Business creation requires the **User**, **Org Admin**, or **Collaborator** roles. Contact your organization administrator if you need additional permissions.

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

---

### 5. 🧑‍💻 User

Members of the organization. who can be promoted to any of the following roles.

**Key Permissions:**
- Can create and delete businesses
- Have access to answer and analysis 
- Can download analysis

**Restrictions:**
- cannot acccess or view other's business
- cannot Kickstart the business to project phase
- cannot access admin panel


> [!NOTE]
> Viewers will see a message indicating they have read-only access when attempting to perform restricted actions.

---

## Role Comparison Matrix

| Feature | Super Admin | Company Admin | Collaborator | Viewer | User |
|---------|-------------|---------------|--------------|--------|------|
| **Create Businesses** | ❌ No | ✅ Own company | ✅ Yes  | ❌ No | ✅ Yes |
| **Edit Businesses** | ❌ No | ✅ Own company | ✅ Assigned only & ✅ Created | ❌ No | ✅ Yes |
| **Delete Businesses** | ❌ No | ✅ Own company | ✅ Yes | ❌ No | ✅ Yes |
| **Invite Users** | ✅ Yes | ✅ Own company | ❌ No | ❌ No | ❌ No |
| **Answer AI Questions** | ❌ No | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes |
| **Create Projects** | ❌ No | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes |
| **Rank Projects** | ❌ No | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes |
| **Upload Financial Docs** | ❌ No | ✅ Yes | ✅ Assigned only & ✅ Created | ❌ No | ✅ Yes |
| **View Strategic Analysis** | ✅ All | ✅ Own company | ✅ Assigned only & ✅ Created | ✅ Assigned only | ✅ yes |
| **Access Admin Panel** | ✅ Yes | ✅ Limited | ❌ No | ❌ No | ❌ No |
| **Manage Users** | ✅ All companies | ✅ Own company | ❌ No | ❌ No | ❌ No |

---

## How to Check Your Role

You can view your current role in several places:

### 1. User Menu
1. Click your profile icon in the top-right corner
2. Your role appears under your name and email
3. The format shows: "Role: [Your Role]"

![User menu showing role information](/academy-screenshots/getting-started/role-indicator.png)

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

![Business collaborators panel showing owner and invited users](/academy-content/01-getting-started/images/issue2-collaborator-business.png)

### Invitation System

Company Admins and Super Admins can invite users to specific businesses:

```
1. Navigate to the business
2. Click "Invite Collaborators"
3. Enter email addresses
4. Assign role (Collaborator or Viewer)
5. Business appears in invited user's dashboard automatically
```

> [!TIP]
> Invited users will see the business in their dashboard immediately upon login. No email notification is sent, so make sure to inform team members directly when you've added them to a business.

---

## Common Scenarios

### Scenario 1: New Employee
**Question**: A new analyst joins your team. What role should they have?

**Answer**: Assign them the **Collaborator** role and invite them to specific businesses they'll work on. They can also create their own businesses if needed. They'll have full edit access to those businesses without being able to access sensitive admin features.

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

### 2. Viewer for Sensitive Visibility
When someone needs to see data but shouldn't modify it (compliance, auditing), always use Viewer role.

---

## FAQ

**Q: Can I have different roles in different businesses?**  
A: No. Your role is set at the user account level and applies across all businesses you can access. However, you may be a **collaborator** on some businesses and have no access to others.

**Q: What happens if I'm assigned Viewer but try to edit something?**  
A: The system will display a message indicating you have read-only access and prevent the action.

**Q: Can a Collaborator see other businesses in the same company?**  
A: No. Collaborators only see businesses they've been explicitly invited to.



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
