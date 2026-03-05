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
            id: "pmf-flow",
            title: "3. PMF Flow",
            icon: "Zap",
            description: "Master the core strategic value engine for clear priorities and execution.",
            articles: [
                {
                    id: "pmf-foundation",
                    title: "Foundation & Onboarding",
                    path: "03-pmf-flow/01-pmf-foundation.md",
                    phase: 1,
                    roles: ["all"],
                    tags: ["pmf", "foundations", "onboarding"]
                },
                {
                    id: "pmf-insights",
                    title: "Insights & Strategic Core",
                    path: "03-pmf-flow/02-pmf-insights.md",
                    phase: 1,
                    roles: ["all"],
                    tags: ["pmf", "insights", "strategy"]
                },
                {
                    id: "pmf-execution",
                    title: "Execution & Priorities",
                    path: "03-pmf-flow/03-pmf-execution.md",
                    phase: 1,
                    roles: ["all"],
                    tags: ["pmf", "execution", "priorities", "kickstart"]
                }
            ]
        },
        {
            id: "kickstart-projects",
            title: "4. Kickstarting Projects",
            icon: "Rocket",
            description: "Moving from strategic analysis to actionable projects and bringing your team into the execution process.",
            articles: [
                {
                    id: "kickstart-process",
                    title: "Kickstart Process",
                    path: "04-kickstart-projects/kickstart-process.md",
                    phase: 2,
                    roles: ["orgadmin"],
                    tags: ["projects", "kickstart"]
                },
                {
                    id: "priorities-kickstart",
                    title: "Priorities & Kickstarting",
                    path: "04-kickstart-projects/02-priorities-kickstart.md",
                    phase: 3,
                    roles: ["orgadmin"],
                    tags: ["priorities", "kickstart", "execution"]
                },
                {
                    id: "collaborators",
                    title: "Adding Collaborators",
                    path: "04-kickstart-projects/collaborators.md",
                    phase: 2,
                    roles: ["orgadmin"],
                    tags: ["team", "collaboration"]
                },
                {
                    id: "collaborator-access",
                    title: "Collaborator Access",
                    path: "04-kickstart-projects/collaborator-access.md",
                    phase: 2,
                    roles: ["collaborator"],
                    tags: ["team", "collaboration", "access"]
                }
            ]
        },
        {
            id: "project-management",
            title: "5. Project Management",
            icon: "FolderKanban",
            description: "Managing your initiatives throughout their lifecycle and prioritizing for impact.",
            articles: [
                {
                    id: "project-overview",
                    title: "Projects Overview & States",
                    path: "05-project-management/project-overview.md",
                    phase: 3,
                    roles: ["all"],
                    tags: ["projects", "overview", "states"]
                },
                {
                    id: "create-project",
                    title: "Creating New Projects",
                    path: "05-project-management/create-project.md",
                    phase: 3,
                    roles: ["orgadmin"],
                    tags: ["projects", "creation", "setup"]
                },
                {
                    id: "project-details",
                    title: "Project Details & Viewing",
                    path: "05-project-management/project-details.md",
                    phase: 3,
                    roles: ["all"],
                    tags: ["projects", "details", "fields"]
                },
                {
                    id: "project-ranking",
                    title: "The Ranking Workflow",
                    path: "05-project-management/project-ranking.md",
                    phase: 3,
                    roles: ["all"],
                    tags: ["ranking", "prioritization", "workflow"]
                },
                {
                    id: "ranking-consensus",
                    title: "Consensus Analysis",
                    path: "05-project-management/ranking-consensus.md",
                    phase: 3,
                    roles: ["orgadmin", "collaborator"],
                    tags: ["consensus", "ai", "team"]
                },
                {
                    id: "project-launch",
                    title: "Launching to Active",
                    path: "05-project-management/project-launch.md",
                    phase: 3,
                    roles: ["orgadmin"],
                    tags: ["launch", "active", "permissions"]
                }
            ]
        },
        {
            id: "ai-questionnaire",
            title: "6. The AI Questionnaire",
            icon: "MessageSquare",
            description: "Answering the core questions to define your business strategy.",
            articles: [
                {
                    id: "questionnaire-overview",
                    title: "AI Questionnaire Overview",
                    path: "06-ai-questionnaire/01-questionnaire-overview.md",
                    phase: 1,
                    roles: ["all"],
                    tags: ["ai", "overview"]
                },
                {
                    id: "phases-and-ordering",
                    title: "Phases & Question Ordering",
                    path: "06-ai-questionnaire/02-phases-and-ordering.md",
                    phase: 2,
                    roles: ["all"],
                    tags: ["phases", "ordering"]
                },
                {
                    id: "editing-and-ai-generation",
                    title: "Editing & AI Generation",
                    path: "06-ai-questionnaire/03-editing-and-ai-generation.md",
                    phase: 1,
                    roles: ["all"],
                    tags: ["editing", "autosave"]
                },
                {
                    id: "financial-uploads-insights",
                    title: "Financial Uploads & Insights",
                    path: "06-ai-questionnaire/04-financial-uploads-insights.md",
                    phase: 2,
                    roles: ["all"],
                    tags: ["financial", "insights"]
                }
            ]
        },
        {
            id: "insights-strategy",
            title: "7. Insights & Strategic Analysis",
            icon: "TrendingUp",
            description: "Understand your business through deep insights and strategic components.",
            articles: [
                {
                    id: "strategic-insights",
                    title: "Strategic Insights Overview",
                    path: "07-insights-strategy/strategic-insights.md",
                    phase: 2,
                    roles: ["all"],
                    tags: ["strategy", "insights"]
                },
                {
                    id: "swot-analysis",
                    title: "SWOT Analysis Guide",
                    path: "07-insights-strategy/swot-analysis.md",
                    phase: 2,
                    roles: ["all"],
                    tags: ["strategy", "swot"]
                },
                {
                    id: "pestel-analysis",
                    title: "PESTEL Analysis",
                    path: "07-insights-strategy/pestel-analysis.md",
                    phase: 2,
                    roles: ["all"],
                    tags: ["strategy", "external"]
                },
                {
                    id: "porters-five-forces",
                    title: "Porter's Five Forces",
                    path: "07-insights-strategy/porters-five-forces.md",
                    phase: 3,
                    roles: ["all"],
                    tags: ["strategy", "competitive"]
                },
                {
                    id: "strategic-framework",
                    title: "S.T.R.A.T.E.G.I.C Framework",
                    path: "07-insights-strategy/strategic-framework.md",
                    phase: 3,
                    roles: ["all"],
                    tags: ["strategy", "framework"]
                },
                {
                    id: "financial-analysis",
                    title: "Financial Analysis Overview",
                    path: "07-insights-strategy/financial-analysis.md",
                    phase: 2,
                    roles: ["all"],
                    tags: ["financial", "analysis"]
                }
            ]
        },
        {
            id: "ai-assistant",
            title: "8. The AI Assistant",
            icon: "Bot",
            description: "Your continuous companion for business and project intelligence.",
            articles: [
                {
                    id: "ai-companion",
                    title: "Your AI Companion",
                    path: "08-ai-assistant/ai-companion.md",
                    phase: 2,
                    roles: ["all"],
                    tags: ["ai", "assistant"]
                }
            ]
        },
        {
            id: "admin-panel",
            title: "9. Admin Panel Control",
            icon: "Shield",
            description: "Monitoring progress and managing organization-wide settings.",
            articles: [
                {
                    id: "super-admin-overview",
                    title: "Super Admin Panel Overview",
                    path: "09-admin-panel/super-admin-overview.md",
                    phase: 3,
                    roles: ["superadmin"],
                    tags: ["admin", "superadmin", "overview"]
                },
                {
                    id: "companies-management",
                    title: "Companies Management",
                    path: "09-admin-panel/companies-management.md",
                    phase: 3,
                    roles: ["superadmin"],
                    tags: ["admin", "companies"]
                },
                {
                    id: "businesses-management",
                    title: "Businesses Management",
                    path: "09-admin-panel/businesses-management.md",
                    phase: 3,
                    roles: ["superadmin"],
                    tags: ["admin", "businesses"]
                },
                {
                    id: "user-management",
                    title: "User Management",
                    path: "09-admin-panel/user-management.md",
                    phase: 3,
                    roles: ["superadmin"],
                    tags: ["admin", "users"]
                },
                {
                    id: "user-history",
                    title: "User History",
                    path: "09-admin-panel/user-history.md",
                    phase: 3,
                    roles: ["superadmin"],
                    tags: ["admin", "history"]
                },
                {
                    id: "question-management",
                    title: "Question Management",
                    path: "09-admin-panel/question-management.md",
                    phase: 3,
                    roles: ["superadmin"],
                    tags: ["admin", "questions"]
                },
                {
                    id: "monitoring-progress",
                    title: "Monitoring Process For Super Admin",
                    path: "09-admin-panel/monitoring-progress.md",
                    phase: 3,
                    roles: ["superadmin"],
                    tags: ["admin", "superadmin"]
                },
                {
                    id: "monitoring-process-company-admin",
                    title: "Monitoring Process for Company admin",
                    path: "09-admin-panel/monitoring-process-company-admin.md",
                    phase: 3,
                    roles: ["orgadmin"],
                    tags: ["admin", "orgadmin", "monitoring"]
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
