import countryList from 'react-select-country-list'
export const COUNTRIES = countryList().getData();
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
export const STRATEGIC_OBJECTIVES = [
  'Grow',
  'Improve profitability',
  'Focus / simplify',
  'Enter a new market',
  'Fix execution',
  'Other'
];
export const KEY_CHALLENGES = [
  'Too many initiatives',
  'Weak differentiation',
  'Pricing pressure',
  'Execution slippage',
  'Talent / structure',
  'Other'
];
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
export const USAGE_CONTEXT_OPTIONS = [
  'My company',
  'A client'
];
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
export const TOTAL_STEPS = FORM_STEPS.length;
export const FIELD_HINTS = {
  geography: 'e.g., United States, LATAM, Southeast Asia',
  customerSegment: 'e.g., Young adults, SMEs, Enterprise',
  productService: 'e.g., Ice cream, M&A advisory',
  channel: 'e.g., Convenience stores, Direct sales'
};
export const FIELD_DESCRIPTIONS = {
  companyName: 'desc_company_name',
  website: 'desc_website',
  country: 'desc_country',
  city: 'desc_city',
  primaryIndustry: 'desc_primary_industry',
  geographies: 'desc_geographies',
  customerSegments: 'desc_customer_segments',
  productServices: 'desc_product_services',
  channels: 'desc_channels',
  strategicObjective: 'desc_strategic_objective',
  keyChallenges: 'desc_key_challenges',
  differentiation: 'desc_differentiation',
  usageContext: 'desc_usage_context'
};
