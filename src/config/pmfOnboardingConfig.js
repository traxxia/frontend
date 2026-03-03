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
    title: 'Company client name',
    fields: ['companyName', 'website']
  },
  {
    step: 2,
    title: 'Where is business based',
    fields: ['country', 'city']
  },
  {
    step: 3,
    title: 'Primary industry',
    fields: ['primaryIndustry']
  },
  {
    step: 4,
    title: 'Which geographies strategic answers',
    fields: ['geography1', 'geography2', 'geography3']
  },
  {
    step: 5,
    title: 'Where does profit come from',
    fields: ['customerSegment1', 'customerSegment2', 'customerSegment3', 'productService1', 'productService2', 'productService3', 'channel1', 'channel2', 'channel3']
  },
  {
    step: 6,
    title: 'Strategic objective',
    fields: ['strategicObjective', 'strategicObjectiveOther']
  },
  {
    step: 7,
    title: 'Key challenges constraints',
    fields: ['keyChallenge', 'keyChallengeOther']
  },
  {
    step: 8,
    title: 'Differentiation',
    fields: ['differentiation', 'differentiationOther']
  },
  {
    step: 9,
    title: 'Usage context',
    fields: ['usageContext']
  }
];

// Total steps count
export const TOTAL_STEPS = FORM_STEPS.length;

// Field hints and examples
export const FIELD_HINTS = {
  geography: 'e.g., United States, LATAM, Southeast Asia',
  customerSegment: 'e.g., Young adults, SMEs, Enterprise',
  productService: 'e.g., Ice cream, M&A advisory',
  channel: 'e.g., Convenience stores, Direct sales'
};

// Field descriptions for tooltips
export const FIELD_DESCRIPTIONS = {
  companyName: 'The official name of the company or the specific client you are analyzing.',
  website: 'The primary URL of the business. This helps in identifying the industry and online presence.',
  country: 'The primary country where the business is registered or has its main operations.',
  city: 'The specific city of the main office or headquarters.',
  primaryIndustry: 'Select the industry that best represents the core of the business activities.',
  geographies: 'List the key geographic markets where the business currently operates or plans to operate.',
  customerSegments: 'Define the different groups of people or organizations the business aims to reach and serve.',
  productServices: 'Specify the key products or services the business offers to its customers.',
  channels: 'The methods used to deliver and sell the products or services to customers (e.g., retail, online, direct sales).',
  strategicObjective: 'The primary long-term goal the business is currently focused on achieving.',
  keyChallenges: 'Identify the main obstacles or constraints currently hindering business growth or performance.',
  differentiation: 'Select the key factors that provide the business with a competitive advantage in the market.',
  usageContext: 'Specify whether you are creating this strategy for your own company or for a client.'
};
