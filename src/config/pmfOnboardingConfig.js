/**
 * PMF Onboarding Modal Configuration
 * This file contains all static data used in the PMF Onboarding process
 * Making it easy to update content without modifying the component
 */

// Countries list
export const COUNTRIES = [
  'United States', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Chile', 
  'Colombia', 'Peru', 'United Kingdom', 'Germany', 'France', 'Spain', 
  'Italy', 'Netherlands', 'Belgium', 'Switzerland', 'Austria', 'Sweden', 
  'Norway', 'Denmark', 'Finland', 'Poland', 'Portugal', 'Greece', 
  'Ireland', 'Czech Republic', 'Hungary', 'Romania', 'Bulgaria', 'Croatia',
  'Australia', 'New Zealand', 'Japan', 'China', 'India', 'South Korea', 
  'Singapore', 'Malaysia', 'Thailand', 'Indonesia', 'Philippines', 'Vietnam',
  'South Africa', 'Egypt', 'Nigeria', 'Kenya', 'Morocco', 'Israel', 
  'Turkey', 'Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Kuwait'
];

// Industries organized by category
export const INDUSTRIES_BY_CATEGORY = [
  {
    category: 'Extraction & Natural Resources',
    industries: [
      'Mining',
      'Fishing',
      'Agriculture / Agribusiness'
    ]
  },
  {
    category: 'Manufacturing & Industrial',
    industries: [
      'Manufacturing / Industrial Goods',
      'Construction'
    ]
  },
  {
    category: 'Consumer & Retail',
    industries: [
      'Retail',
      'Consumer Products (CPG)'
    ]
  },
  {
    category: 'Financial Services',
    industries: [
      'Payments / Fintech',
      'Commercial Banking',
      'Microfinance',
      'Investment Banking / Capital Markets',
      'Other Financial Services'
    ]
  },
  {
    category: 'Services',
    industries: [
      'Professional Services',
      'Education',
      'Healthcare'
    ]
  },
  {
    category: 'Infrastructure & Connectivity',
    industries: [
      'Distribution / Logistics / Transportation',
      'Energy / Utilities',
      'Telecom / Media'
    ]
  },
  {
    category: 'Technology',
    industries: [
      'Technology / SaaS'
    ]
  },
  {
    category: 'Public Sector',
    industries: [
      'Government / Public Sector'
    ]
  },
  {
    category: 'Other',
    industries: [
      'Other'
    ]
  }
];

// Strategic Objectives
export const STRATEGIC_OBJECTIVES = [
  'Grow',
  'Improve profitability',
  'Focus / simplify',
  'Enter a new market',
  'Fix execution',
  'Other'
];

// Key Challenges
export const KEY_CHALLENGES = [
  'Too many initiatives',
  'Weak differentiation',
  'Pricing pressure',
  'Execution slippage',
  'Talent / structure',
  'Other'
];

// Differentiation Options
export const DIFFERENTIATION_OPTIONS = [
  'Price',
  'Quality / expertise',
  'Speed / responsiveness',
  'Relationships / trust',
  'Customization',
  'Scale',
  'Brand',
  'Other'
];

// Usage Context Options
export const USAGE_CONTEXT_OPTIONS = [
  'My company',
  'A client'
];

// Form configuration with metadata for each step
export const FORM_STEPS = [
  {
    step: 1,
    title: 'company_client_name',
    fields: ['companyName', 'website']
  },
  {
    step: 2,
    title: 'where_is_business_based',
    fields: ['country', 'city']
  },
  {
    step: 3,
    title: 'primary_industry',
    fields: ['primaryIndustry']
  },
  {
    step: 4,
    title: 'which_geographies_strategic_answers',
    fields: ['geography1', 'geography2', 'geography3']
  },
  {
    step: 5,
    title: 'where_does_profit_come_from',
    fields: ['customerSegment1', 'customerSegment2', 'customerSegment3', 'productService1', 'productService2', 'productService3', 'channel1', 'channel2', 'channel3']
  },
  {
    step: 6,
    title: 'strategic_objective',
    fields: ['strategicObjective', 'strategicObjectiveOther']
  },
  {
    step: 7,
    title: 'key_challenges_constraints',
    fields: ['keyChallenge', 'keyChallengeOther']
  },
  {
    step: 8,
    title: 'differentiation',
    fields: ['differentiation', 'differentiationOther']
  },
  {
    step: 9,
    title: 'usage_context',
    fields: ['usageContext']
  }
];

// Total steps count
export const TOTAL_STEPS = FORM_STEPS.length;

// Field hints and examples
export const FIELD_HINTS = {
  geography: 'e.g., United States, LATAM, Southeast Asia',
  customerSegment: 'e.g., young adults, SMEs, enterprise',
  productService: 'e.g., ice cream, M&A advisory',
  channel: 'e.g., convenience stores, direct sales'
};
