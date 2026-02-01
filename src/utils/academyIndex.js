/**
 * Traxxia Academy - Navigation Structure and Metadata
 * 
 * This file defines the complete navigation structure for the Academy,
 * including all categories and articles with their metadata.
 */

export const academyStructure = {
    categories: [
        {
            id: "getting-started",
            title: "Getting Started",
            icon: "Rocket",
            description: "Learn the basics of Traxxia and get your account set up",
            articles: [
                {
                    id: "what-is-traxxia",
                    title: "What is Traxxia?",
                    path: "01-getting-started/01-what-is-traxxia.md",
                    phase: 2,
                    roles: ["all"],
                    tags: ["beginner", "overview"],
                    relatedArticles: ["creating-an-account", "understanding-user-roles"]
                },
                {
                    id: "creating-an-account",
                    title: "Creating an Account",
                    path: "01-getting-started/02-creating-an-account.md",
                    phase: 2,
                    roles: ["all"],
                    tags: ["beginner", "setup"],
                    relatedArticles: ["what-is-traxxia", "first-login-experience"]
                },
                {
                    id: "understanding-user-roles",
                    title: "Understanding User Roles",
                    path: "01-getting-started/03-understanding-user-roles.md",
                    phase: 2,
                    roles: ["all"],
                    tags: ["beginner", "roles"],
                    relatedArticles: ["creating-an-account", "first-login-experience"]
                },
                {
                    id: "first-login-experience",
                    title: "First Login Experience",
                    path: "01-getting-started/04-first-login-experience.md",
                    phase: 2,
                    roles: ["all"],
                    tags: ["beginner", "setup"],
                    relatedArticles: ["understanding-user-roles", "dashboard-overview"]
                },
                {
                    id: "dashboard-overview",
                    title: "Dashboard Overview",
                    path: "01-getting-started/05-dashboard-overview.md",
                    phase: 2,
                    roles: ["all"],
                    tags: ["beginner", "navigation"],
                    relatedArticles: ["first-login-experience", "navigation-basics"]
                },
                {
                    id: "navigation-basics",
                    title: "Navigation Basics",
                    path: "01-getting-started/06-navigation-basics.md",
                    phase: 2,
                    roles: ["all"],
                    tags: ["beginner", "navigation"],
                    relatedArticles: ["dashboard-overview"]
                },
                {
                    id: "changing-language-settings",
                    title: "Changing Language Settings",
                    path: "01-getting-started/07-changing-language-settings.md",
                    phase: 3,
                    roles: ["all"],
                    tags: ["settings", "localization"],
                    relatedArticles: ["dashboard-overview"]
                },

                {
                    id: "help-and-support",
                    title: "Help & Support Resources",
                    path: "01-getting-started/09-help-and-support-resources.md",
                    phase: 3,
                    roles: ["all"],
                    tags: ["support", "reference"],
                    relatedArticles: ["what-is-traxxia"]
                }
            ]
        },
        {
            id: "businesses",
            title: "Business Management",
            icon: "Building2",
            description: "Create and manage your business profiles",
            articles: [
                {
                    id: "what-is-a-business-profile",
                    title: "What is a Business Profile?",
                    path: "02-businesses/01-what-is-a-business-profile.md",
                    phase: 2,
                    roles: ["all"],
                    tags: ["business", "overview"],
                    relatedArticles: ["creating-your-first-business"]
                },
                {
                    id: "creating-your-first-business",
                    title: "Creating Your First Business",
                    path: "02-businesses/02-creating-your-first-business.md",
                    phase: 2,
                    roles: ["orgadmin", "user"],
                    tags: ["business", "howto"],
                    relatedArticles: ["what-is-a-business-profile", "ai-assistant-overview"]
                }
            ]
        },
        {
            id: "questionnaire",
            title: "AI Questionnaire",
            icon: "MessageSquare",
            description: "Learn how to use the AI-powered questionnaire system",
            articles: [
                {
                    id: "ai-assistant-overview",
                    title: "AI Assistant Overview",
                    path: "03-questionnaire/01-ai-assistant-overview.md",
                    phase: 2,
                    roles: ["orgadmin", "user", "collaborator"],
                    tags: ["ai", "overview"],
                    relatedArticles: ["answering-questions-effectively", "question-phases-explained"]
                },
                {
                    id: "answering-questions-effectively",
                    title: "Answering Questions Effectively",
                    path: "03-questionnaire/02-answering-questions-effectively.md",
                    phase: 2,
                    roles: ["orgadmin", "user", "collaborator"],
                    tags: ["ai", "howto"],
                    relatedArticles: ["ai-assistant-overview", "question-phases-in-depth"]
                },
                {
                    id: "question-phases-in-depth",
                    title: "Question Phases In-Depth",
                    path: "03-questionnaire/03-question-phases-in-depth.md",
                    phase: 2,
                    roles: ["orgadmin", "user", "collaborator"],
                    tags: ["ai", "concepts"],
                    relatedArticles: ["ai-assistant-overview", "strategic-analysis-overview"]
                },
                {
                    id: "tracking-your-progress",
                    title: "Tracking Your Progress",
                    path: "03-questionnaire/04-tracking-your-progress.md",
                    phase: 3,
                    roles: ["orgadmin", "user", "collaborator"],
                    tags: ["ai", "progress"],
                    relatedArticles: ["question-phases-in-depth", "business-statuses-explained"]
                }
            ]
        },
        {
            id: "strategic-analysis",
            title: "Strategic Analysis",
            icon: "TrendingUp",
            description: "Unlock powerful strategic insights for your business",
            articles: [
                {
                    id: "strategic-analysis-overview",
                    title: "Strategic Analysis Overview",
                    path: "04-strategic-analysis/01-strategic-analysis-overview.md",
                    phase: 2,
                    roles: ["all"],
                    tags: ["strategy", "overview"],
                    relatedArticles: ["using-swot-analysis"]
                },
                {
                    id: "using-swot-analysis",
                    title: "Using SWOT Analysis",
                    path: "04-strategic-analysis/02-using-swot-analysis.md",
                    phase: 2,
                    roles: ["all"],
                    tags: ["strategy", "swot", "howto"],
                    relatedArticles: ["strategic-analysis-overview"]
                },
                {
                    id: "porters-five-forces",
                    title: "Porter's Five Forces Analysis",
                    path: "04-strategic-analysis/04-porters-five-forces.md",
                    phase: 3,
                    roles: ["all"],
                    tags: ["strategy", "competitive", "framework"],
                    relatedArticles: ["strategic-analysis-overview", "using-swot-analysis"]
                }
            ]
        },
        {
            id: "financial-analysis",
            title: "Financial Analysis",
            icon: "DollarSign",
            description: "Upload and analyze financial documents",
            articles: [
                {
                    id: "financial-analysis-overview",
                    title: "Financial Analysis Overview",
                    path: "05-financial-analysis/01-financial-analysis-overview.md",
                    phase: 2,
                    roles: ["all"],
                    tags: ["financial", "overview"],
                    relatedArticles: ["uploading-financial-documents"]
                },
                {
                    id: "uploading-financial-documents",
                    title: "Uploading Financial Documents",
                    path: "05-financial-analysis/02-uploading-financial-documents.md",
                    phase: 2,
                    roles: ["orgadmin", "user"],
                    tags: ["financial", "howto"],
                    relatedArticles: ["financial-file-formats"]
                },
                {
                    id: "financial-file-formats",
                    title: "Financial File Formats",
                    path: "05-financial-analysis/03-financial-file-formats.md",
                    phase: 2,
                    roles: ["all"],
                    tags: ["financial", "reference"],
                    relatedArticles: ["uploading-financial-documents"]
                },
                {
                    id: "understanding-financial-reports",
                    title: "Understanding Financial Reports",
                    path: "05-financial-analysis/04-understanding-financial-reports.md",
                    phase: 3,
                    roles: ["all"],
                    tags: ["financial", "reports", "analysis"],
                    relatedArticles: ["uploading-financial-documents", "financial-analysis-overview"]
                }
            ]
        },
        {
            id: "projects",
            title: "Project Management",
            icon: "FolderKanban",
            description: "Create and manage strategic projects",
            articles: [
                {
                    id: "project-management-overview",
                    title: "Project Management Overview",
                    path: "06-projects/01-project-management-overview.md",
                    phase: 2,
                    roles: ["all"],
                    tags: ["projects", "overview"],
                    relatedArticles: []
                },

            ]
        },
        {
            id: "collaboration",
            title: "Collaboration",
            icon: "Users",
            description: "Work with your team on projects and analysis",
            articles: [
                {
                    id: "collaboration-overview",
                    title: "Collaboration Overview",
                    path: "07-collaboration/01-collaboration-overview.md",
                    phase: 2,
                    roles: ["all"],
                    tags: ["collaboration", "overview"],
                    relatedArticles: ["inviting-collaborators"]
                },
                {
                    id: "inviting-collaborators",
                    title: "Inviting Collaborators",
                    path: "07-collaboration/02-inviting-collaborators.md",
                    phase: 2,
                    roles: ["orgadmin"],
                    tags: ["collaboration", "howto"],
                    relatedArticles: ["collaboration-overview", "understanding-user-roles"]
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
