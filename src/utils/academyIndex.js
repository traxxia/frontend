/**
 * Traxxia Academy - Navigation Structure and Metadata
 * 
 * This file defines the complete navigation structure for the Academy,
 * including all categories and articles with their metadata.
 */

export const academyStructure = {
    categories: [
        {
            id: "auth-onboarding",
            title: "1. Account Setup & Onboarding",
            icon: "UserPlus",
            description: "Learn how to create your account, select a plan, and get started.",
            articles: [
                {
                    id: "welcome-to-traxxia",
                    title: "Welcome to Traxxia",
                    path: "01-auth-onboarding/welcome-to-traxxia.md",
                    phase: 1,
                    roles: ["all"],
                    tags: ["overview", "intro"]
                },
                {
                    id: "registration-and-plans",
                    title: "Registration & Plans",
                    path: "01-auth-onboarding/registration-and-plans.md",
                    phase: 1,
                    roles: ["all"],
                    tags: ["setup", "onboarding"]
                },
                {
                    id: "roles-and-plans",
                    title: "Roles and Plan Lifecycle",
                    path: "11-account-management/roles-and-plans.md",
                    phase: 3,
                    roles: ["orgadmin"],
                    tags: ["plans", "roles", "billing"]
                }
            ]
        },
        {
            id: "dashboard-business",
            title: "2. Dashboard & Business Setup",
            icon: "LayoutDashboard",
            description: "Navigate your dashboard and set up your business profiles.",
            articles: [
                {
                    id: "dashboard-walk-through",
                    title: "Dashboard Walkthrough",
                    path: "02-dashboard-business/dashboard-walk-through.md",
                    phase: 1,
                    roles: ["orgadmin"],
                    tags: ["dashboard", "walkthrough"]
                },
                {
                    id: "creating-your-business",
                    title: "Business Overview",
                    path: "02-dashboard-business/creating-your-business.md",
                    phase: 1,
                    roles: ["orgadmin"],
                    tags: ["business", "dashboard"]
                }

            ]
        },
        {
            id: "ai-questionnaire",
            title: "3. The AI Questionnaire",
            icon: "MessageSquare",
            description: "Answering the core questions to define your business strategy.",
            articles: [
                {
                    id: "questionnaire-phases",
                    title: "Questionnaire Phases",
                    path: "03-ai-questionnaire/questionnaire-phases.md",
                    phase: 2,
                    roles: ["all"],
                    tags: ["ai", "questions"]
                },
                {
                    id: "the-brief",
                    title: "The Brief: Your Business Profile",
                    path: "03-ai-questionnaire/the-brief.md",
                    phase: 1,
                    roles: ["all"],
                    tags: ["profile", "brief", "editing"]
                }
            ]
        },
        {
            id: "insights-strategy",
            title: "4. Insights & Strategic Analysis",
            icon: "TrendingUp",
            description: "Understand your business through deep insights and strategic components.",
            articles: [
                {
                    id: "strategic-insights",
                    title: "Strategic Insights Overview",
                    path: "04-insights-strategy/strategic-insights.md",
                    phase: 2,
                    roles: ["all"],
                    tags: ["strategy", "insights"]
                },
                {
                    id: "swot-analysis",
                    title: "SWOT Analysis Guide",
                    path: "04-insights-strategy/swot-analysis.md",
                    phase: 2,
                    roles: ["all"],
                    tags: ["strategy", "swot"]
                },
                {
                    id: "pestel-analysis",
                    title: "PESTEL Analysis",
                    path: "04-insights-strategy/pestel-analysis.md",
                    phase: 2,
                    roles: ["all"],
                    tags: ["strategy", "external"]
                },
                {
                    id: "porters-five-forces",
                    title: "Porter's Five Forces",
                    path: "04-insights-strategy/porters-five-forces.md",
                    phase: 3,
                    roles: ["all"],
                    tags: ["strategy", "competitive"]
                },
                {
                    id: "strategic-framework",
                    title: "S.T.R.A.T.E.G.I.C Framework",
                    path: "04-insights-strategy/strategic-framework.md",
                    phase: 3,
                    roles: ["all"],
                    tags: ["strategy", "framework"]
                },
                {
                    id: "financial-analysis",
                    title: "Financial Analysis Overview",
                    path: "04-insights-strategy/financial-analysis.md",
                    phase: 2,
                    roles: ["all"],
                    tags: ["financial", "analysis"]
                }
            ]
        },
        {
            id: "collaboration",
            title: "5. Team Collaboration",
            icon: "Users",
            description: "Adding team members and working together on your goals.",
            articles: [
                {
                    id: "collaborators",
                    title: "Adding Collaborators",
                    path: "05-collaboration/collaborators.md",
                    phase: 2,
                    roles: ["orgadmin"],
                    tags: ["team", "collaboration"]
                },
                {
                    id: "collaborator-access",
                    title: "Collaborator Access",
                    path: "05-collaboration/collaborator-access.md",
                    phase: 2,
                    roles: ["collaborator"],
                    tags: ["team", "collaboration", "access"]
                }
            ]
        },
        {
            id: "kickstart-projects",
            title: "6. Kickstarting Projects",
            icon: "Rocket",
            description: "Moving from strategic analysis to actionable projects.",
            articles: [
                {
                    id: "kickstart-process",
                    title: "Kickstart Process",
                    path: "06-kickstart-projects/kickstart-process.md",
                    phase: 2,
                    roles: ["orgadmin"],
                    tags: ["projects", "kickstart"]
                },
                {
                    id: "ai-projects",
                    title: "AI-Driven Project Creation",
                    path: "06-kickstart-projects/Ai-Projects.md",
                    phase: 3,
                    roles: ["orgadmin"],
                    tags: ["ai", "projects", "creation"]
                }
            ]
        },
        {
            id: "project-management",
            title: "7. Project Management",
            icon: "FolderKanban",
            description: "Managing your initiatives throughout their lifecycle.",
            articles: [
                {
                    id: "project-lifecycle",
                    title: "Collaborative Lifecycle & Locking",
                    path: "07-project-management/project-lifecycle.md",
                    phase: 3,
                    roles: ["all"],
                    tags: ["projects", "management", "collaboration"]
                },
                {
                    id: "edit-projects",
                    title: "Edit Projects",
                    path: "07-project-management/edit-projects.md",
                    phase: 3,
                    roles: ["orgadmin"],
                    tags: ["projects", "management", "editing"]
                },
            ]
        },
        {
            id: "prioritization-launch",
            title: "8. Ranking & Launching",
            icon: "CheckSquare",
            description: "Prioritizing your projects and launching them to active status.",
            articles: [
                {
                    id: "ranking-and-consensus",
                    title: "Ranking & Consensus",
                    path: "08-prioritization-launch/ranking-and-consensus.md",
                    phase: 3,
                    roles: ["orgadmin", "collaborator"],
                    tags: ["ranking", "launch"]
                },
                {
                    id: "team-consensus",
                    title: "Team Consensus",
                    path: "08-prioritization-launch/team-consensus.md",
                    phase: 3,
                    roles: ["orgadmin", "collaborator"],
                    tags: ["consensus", "prioritization", "ranking"]
                }
            ]
        },
        {
            id: "ai-assistant",
            title: "9. The AI Assistant",
            icon: "Bot",
            description: "Your continuous companion for business and project intelligence.",
            articles: [
                {
                    id: "ai-companion",
                    title: "Your AI Companion",
                    path: "09-ai-assistant/ai-companion.md",
                    phase: 2,
                    roles: ["all"],
                    tags: ["ai", "assistant"]
                }
            ]
        },
        {
            id: "admin-panel",
            title: "10. Admin Panel Control",
            icon: "Shield",
            description: "Monitoring progress and managing organization-wide settings.",
            articles: [
                {
                    id: "monitoring-progress",
                    title: "Monitoring Process For Super Admin",
                    path: "10-admin-panel/monitoring-progress.md",
                    phase: 3,
                    roles: ["superadmin"],
                    tags: ["admin", "superadmin"]
                },
                {
                    id: "monitoring-process-company-admin",
                    title: "Monitoring Process for Company admin",
                    path: "10-admin-panel/monitoring-process-company-admin.md",
                    phase: 3,
                    roles: ["orgadmin"],
                    tags: ["admin", "orgadmin", "monitoring"]
                }
            ]
        },
        {
            id: "pmf-flow",
            title: "11. PMF Flow",
            icon: "Zap",
            description: "Master the core strategic value engine for clear priorities and execution.",
            articles: [
                {
                    id: "pmf-flow-details",
                    title: "PMF Flow",
                    path: "16-pmf-flow/pmf-flow.md",
                    phase: 1,
                    roles: ["all"],
                    tags: ["pmf", "strategy", "execution", "onboarding"]
                }
            ]
        }
    ]
};

/**
 * Helper function to find an article by ID
 * @param {string} articleId - The article ID to find
 * @returns {Object|null} The article object or null if not found
 */
export const findArticleById = (articleId) => {
    for (const category of academyStructure.categories) {
        const article = category.articles.find(a => a.id === articleId);
        if (article) {
            return { ...article, categoryId: category.id, categoryTitle: category.title };
        }
    }
    return null;
};

/**
 * Helper function to find a category by ID
 * @param {string} categoryId - The category ID to find
 * @returns {Object|null} The category object or null if not found
 */
export const findCategoryById = (categoryId) => {
    return academyStructure.categories.find(c => c.id === categoryId) || null;
};

/**
 * Get breadcrumb data for an article
 * @param {string} categoryId - The category ID
 * @param {string} articleId - The article ID
 * @returns {Array} Breadcrumb array
 */
export const getBreadcrumbs = (categoryId, articleId) => {
    const breadcrumbs = [
        { label: 'Academy', path: '/academy' }
    ];

    const category = findCategoryById(categoryId);
    if (category) {
        breadcrumbs.push({
            label: category.title,
            path: `/academy/${categoryId}`
        });
    }

    if (articleId) {
        const article = findArticleById(articleId);
        if (article) {
            breadcrumbs.push({
                label: article.title,
                path: `/academy/${categoryId}/${articleId}`
            });
        }
    }

    return breadcrumbs;
};
