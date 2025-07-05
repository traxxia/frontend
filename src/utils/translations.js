// src/utils/translations.js - Fixed Version with Separated Patterns

// SEPARATE FILE FOR ANALYSIS PATTERNS - DON'T MIX WITH UI TRANSLATIONS
export const analysisPatterns = {
  en: {
    swot: {
      title: "SWOT Analysis",
      conclusion: "Conclusion",
      sections: {
        strengths: "Strengths",
        weaknesses: "Weaknesses",
        opportunities: "Opportunities",
        threats: "Threats"
      },
      patterns: {
        analysisHeader: /\*\*\s*SWOT Analysis\s*:\*\*([\s\S]*?)(?=In conclusion|To address|By embracing|$)/i,
        conclusion: /(In conclusion[\s\S]*?$|To address the weaknesses[\s\S]*?$|By embracing[\s\S]*?$)/i,
        sections: /\*\*\s*(Strengths|Weaknesses|Opportunities|Threats)\s*:\*\*\s*([\s\S]*?)(?=(\*\*\s*(Strengths|Weaknesses|Opportunities|Threats)\s*:\*\*|In conclusion|To address|By embracing|$))/gi
      }
    },

    valueChain: {
      title: "Value Chain Analysis",
      conclusion: "Conclusion",
      primaryActivities: "Primary Activities",
      supportActivities: "Support Activities",
      margin: "Margin Analysis",
      linkages: "Linkages Analysis",
      noAnalysis: "No analysis available.",
      sections: {
        inboundLogistics: "Inbound Logistics",
        operations: "Operations",
        outboundLogistics: "Outbound Logistics",
        marketingSales: "Marketing & Sales",
        service: "Service",
        firmInfrastructure: "Firm Infrastructure",
        hrManagement: "Human Resource Management",
        techDevelopment: "Technology Development",
        procurement: "Procurement"
      },
      patterns: {
        primaryActivities: /\*\*Primary Activities:\*\*([\s\S]*?)(?=\*\*Support Activities:|$)/i,
        supportActivities: /\*\*Support Activities:\*\*([\s\S]*?)(?=\*\*Margin:|$)/i,
        margin: /\*\*Margin:\*\*([\s\S]*?)(?=\*\*Linkages:|$)/i,
        linkages: /\*\*Linkages:\*\*([\s\S]*?)(?=In conclusion|To apply these principles|By embracing|$)/i,
        conclusion: /(In conclusion[\s\S]*?$|To apply these principles[\s\S]*?$|By embracing these recommendations[\s\S]*?$)/i,
        inboundLogistics: /- Inbound Logistics:\*\*([\s\S]*?)(?=- Operations:|$)/i,
        operations: /- Operations:\*\*([\s\S]*?)(?=- Outbound Logistics:|$)/i,
        outboundLogistics: /- Outbound Logistics:\*\*([\s\S]*?)(?=- Marketing (?:\u0026|&) Sales:|$)/i,
        marketingSales: /- Marketing (?:\u0026|&) Sales:\*\*([\s\S]*?)(?=- Service:|$)/i,
        service: /- Service:\*\*([\s\S]*?)(?=$)/i,
        firmInfrastructure: /- Firm Infrastructure:\*\*([\s\S]*?)(?=- Human Resource Management:|$)/i,
        hrManagement: /- Human Resource Management:\*\*([\s\S]*?)(?=- Technology Development:|$)/i,
        techDevelopment: /- Technology Development:\*\*([\s\S]*?)(?=- Procurement:|$)/i,
        procurement: /- Procurement:\*\*([\s\S]*?)(?=$)/i
      }
    },

    bcg: {
      title: "BCG Matrix Analysis",
      conclusion: "Conclusion",
      recommendations: "Actionable Recommendations",
      marketGrowthRate: "Market Growth Rate",
      relativeMarketShare: "Relative Market Share",
      high: "High",
      low: "Low",
      quadrants: {
        agileLeaders: "Agile Leaders",
        establishedPerformers: "Established Performers",
        emergingInnovators: "Emerging Innovators",
        strategicDrifters: "Strategic Drifters"
      },
      descriptions: {
        agileLeaders: "(High Share / High Growth)",
        establishedPerformers: "(High Share / Low Growth)",
        emergingInnovators: "(Low Share / High Growth)",
        strategicDrifters: "(Low Share / Low Growth)"
      },
      patterns: {
        conclusion: [
          /\*{2,}\s*Conclusion\s*\*{2,}\s*([\s\S]*?)(?=\*\*Actionable Recommendations:\*\*|Actionable Recommendations:|$)/i,
          /\*\*\s*Conclusion\s*:\s*\*\*\s*([\s\S]*?)(?=\*\*Actionable Recommendations:\*\*|Actionable Recommendations:|$)/i,
          /\*\*Conclusion:\*\*\s*([\s\S]*?)(?=\*\*Actionable Recommendations:\*\*|Actionable Recommendations:|$)/i,
          /Conclusion:\s*([\s\S]*?)(?=\*\*Actionable Recommendations:\*\*|Actionable Recommendations:|$)/i,
          /In conclusion[,:]\s*([\s\S]*?)(?=\*\*Actionable Recommendations:\*\*|Actionable Recommendations:|$)/i,
          /\*\*\s*Conclusion\s*\*\*\s*([\s\S]*?)(?=\*\*Actionable Recommendations:\*\*|Actionable Recommendations:|$)/i,
          /Given the incomplete[\s\S]*?(?=\*\*Actionable Recommendations:\*\*|Actionable Recommendations:|$)/i,
          /To drive success[\s\S]*?(?=\*\*Actionable Recommendations:\*\*|Actionable Recommendations:|$)/i
        ],
        recommendations: /\*\*Actionable Recommendations:\*\*([\s\S]*?)$/i,
        cleanupPatterns: [
          /\*{2,}\s*Conclusion\s*\*{2,}[\s\S]*$/i,
          /\*\*\s*Conclusion\s*:\s*\*\*[\s\S]*$/i,
          /\*\*Conclusion:\*\*[\s\S]*$/i,
          /In conclusion[\s\S]*$/i,
          /Given the incomplete[\s\S]*$/i,
          /To drive success[\s\S]*$/i,
          /\*\*Actionable Recommendations:\*\*[\s\S]*$/i
        ]
      }
    },

    porter: {
      title: "Porter's Five Forces Analysis",
      conclusion: "Conclusion",
      recommendations: "Actionable Recommendations",
      forces: {
        supplierPower: "Supplier Power",
        buyerPower: "Buyer Power",
        competitiveRivalry: "Competitive Rivalry",
        threatOfSubstitution: "Threat of Substitution",
        threatOfNewEntry: "Threat of New Entry"
      },
      patterns: {
        conclusion: [
          /\*{2,}\s*Conclusion\s*\*{2,}\s*([\s\S]*?)(?=\*\*Actionable Recommendations:\*\*|Actionable Recommendations:|$)/i,
          /\*\*\s*Conclusion\s*:\s*\*\*\s*([\s\S]*?)(?=\*\*Actionable Recommendations:\*\*|Actionable Recommendations:|$)/i,
          /\*\*Conclusion:\*\*\s*([\s\S]*?)(?=\*\*Actionable Recommendations:\*\*|Actionable Recommendations:|$)/i,
          /Conclusion:\s*([\s\S]*?)(?=\*\*Actionable Recommendations:\*\*|Actionable Recommendations:|$)/i,
          /In conclusion[,:]\s*([\s\S]*?)(?=\*\*Actionable Recommendations:\*\*|Actionable Recommendations:|$)/i,
          /\*\*\s*Conclusion\s*\*\*\s*([\s\S]*?)(?=\*\*Actionable Recommendations:\*\*|Actionable Recommendations:|$)/i
        ],
        recommendations: /\*\*Actionable Recommendations:\*\*([\s\S]*?)$/i,
        cleanupPatterns: [
          /\*{2,}\s*Conclusion\s*\*{2,}[\s\S]*$/i,
          /\*\*\s*Conclusion\s*:\s*\*\*[\s\S]*$/i,
          /\*\*Conclusion:\*\*[\s\S]*$/i,
          /In conclusion[\s\S]*$/i,
          /To succeed in this environment[\s\S]*$/i,
          /By following these recommendations[\s\S]*$/i,
          /To stay competitive[\s\S]*$/i
        ]
      }
    },

    strategic: {
      title: "STRATEGIC Analysis",
      conclusion: "Conclusion",
      noData: "No data available for",
      keyActions: "Key actions:",
      theory: "Theory:",
      example: "Example:",
      patterns: {
        conclusion: [
          /\*{2,}\s*Conclusion\s*\*{2,}\s*([\s\S]*?)(?=\*\*Actionable Recommendations:\*\*|$)/i,
          /\*\*\s*Conclusion\s*:\s*\*\*\s*([\s\S]*?)(?=\*\*Actionable Recommendations:\*\*|$)/i,
          /\*\*Conclusion:\*\*\s*([\s\S]*?)(?=\*\*Actionable Recommendations:\*\*|$)/i,
          /In conclusion[,:]\s*([\s\S]*?)(?=\*\*Actionable Recommendations:\*\*|$)/i
        ],
        letterPatterns: [
          /\*\*([STRATEGIC])\s*=\s*([^*]+?)\*\*\s*([\s\S]*?)(?=\*\*[STRATEGIC]\s*=|\*\*Conclusion|In conclusion|$)/i,
          /([STRATEGIC])\s*=\s*([^\n]+?)\n([\s\S]*?)(?=[STRATEGIC]\s*=|Conclusion|In conclusion|$)/i,
          /\*\*([STRATEGIC])\*\*\s*=\s*([^\n]+?)\n([\s\S]*?)(?=\*\*[STRATEGIC]|[STRATEGIC]\s*=|Conclusion|In conclusion|$)/i,
          /([STRATEGIC])\s*:\s*([^\n]+?)\n([\s\S]*?)(?=[STRATEGIC]\s*:|Conclusion|In conclusion|$)/i
        ]
      }
    }
  },

  es: {
    swot: {
      title: "Análisis FODA",
      conclusion: "Conclusión",
      sections: {
        strengths: "Fortalezas",
        weaknesses: "Debilidades",
        opportunities: "Oportunidades",
        threats: "Amenazas"
      },
      patterns: {
        analysisHeader: /\*\*\s*Análisis FODA\s*\*\*([\s\S]*?)(?=\*\*Conclusión|En conclusión|Para abordar|Al abordar|$)/i,
        conclusion: /(\*\*Conclusión.*?\*\*[\s\S]*?$|En conclusión[\s\S]*?$|Para abordar[\s\S]*?$|Al abordar[\s\S]*?$)/i,
        sections: /\*\*\s*(Fortalezas|Debilidades|Oportunidades|Amenazas)\s*:\*\*\s*([\s\S]*?)(?=(\*\*\s*(Fortalezas|Debilidades|Oportunidades|Amenazas)\s*:\*\*|\*\*Conclusión|En conclusión|Para abordar|Al abordar|$))/gi
      }
    },

    valueChain: {
      title: "Análisis de la Cadena de Valor",
      conclusion: "Conclusión",
      primaryActivities: "Actividades Primarias",
      supportActivities: "Actividades de Apoyo",
      margin: "Análisis de Margen",
      linkages: "Análisis de Vínculos",
      noAnalysis: "Sin análisis disponible.",
      sections: {
        inboundLogistics: "Logística de Entrada",
        operations: "Operaciones",
        outboundLogistics: "Logística de Salida",
        marketingSales: "Marketing y Ventas",
        service: "Servicio",
        firmInfrastructure: "Infraestructura de la Empresa",
        hrManagement: "Gestión de Recursos Humanos",
        techDevelopment: "Desarrollo Tecnológico",
        procurement: "Abastecimiento"
      },
      patterns: {
        primaryActivities: /\*\*Actividades Primarias:\*\*([\s\S]*?)(?=\*\*Actividades de Apoyo:|$)/i,
        supportActivities: /\*\*Actividades de Apoyo:\*\*([\s\S]*?)(?=\*\*Margen:|$)/i,
        margin: /\*\*Margen:\*\*([\s\S]*?)(?=\*\*Vínculos:|$)/i,
        linkages: /\*\*Vínculos:\*\*([\s\S]*?)(?=En conclusión|Para aplicar|Al adoptar|$)/i,
        conclusion: /(En conclusión[\s\S]*?$|Para aplicar estos principios[\s\S]*?$|Al adoptar estas recomendaciones[\s\S]*?$)/i,
        inboundLogistics: /- Logística de Entrada:\*\*([\s\S]*?)(?=- Operaciones:|$)/i,
        operations: /- Operaciones:\*\*([\s\S]*?)(?=- Logística de Salida:|$)/i,
        outboundLogistics: /- Logística de Salida:\*\*([\s\S]*?)(?=- Marketing (?:y|&) Ventas:|$)/i,
        marketingSales: /- Marketing (?:y|&) Ventas:\*\*([\s\S]*?)(?=- Servicio:|$)/i,
        service: /- Servicio:\*\*([\s\S]*?)(?=$)/i,
        firmInfrastructure: /- Infraestructura de la Empresa:\*\*([\s\S]*?)(?=- Gestión de Recursos Humanos:|$)/i,
        hrManagement: /- Gestión de Recursos Humanos:\*\*([\s\S]*?)(?=- Desarrollo Tecnológico:|$)/i,
        techDevelopment: /- Desarrollo Tecnológico:\*\*([\s\S]*?)(?=- Abastecimiento:|$)/i,
        procurement: /- Abastecimiento:\*\*([\s\S]*?)(?=$)/i
      }
    },

    bcg: {
      title: "Análisis de Matriz BCG",
      conclusion: "Conclusión",
      recommendations: "Recomendaciones Accionables",
      marketGrowthRate: "Tasa de Crecimiento del Mercado",
      relativeMarketShare: "Participación Relativa en el Mercado",
      high: "Alta",
      low: "Baja",
      quadrants: {
        agileLeaders: "Líderes Ágiles",
        establishedPerformers: "Ejecutores Establecidos",
        emergingInnovators: "Innovadores Emergentes",
        strategicDrifters: "Divagadores Estratégicos"
      },
      descriptions: {
        agileLeaders: "(Alta Participación / Alto Crecimiento)",
        establishedPerformers: "(Alta Participación / Bajo Crecimiento)",
        emergingInnovators: "(Baja Participación / Alto Crecimiento)",
        strategicDrifters: "(Baja Participación / Bajo Crecimiento)"
      },
      patterns: {
        conclusion: [
          /\*{2,}\s*Conclusión\s*\*{2,}\s*([\s\S]*?)(?=\*\*Recomendaciones Accionables:\*\*|Recomendaciones Accionables:|$)/i,
          /\*\*\s*Conclusión\s*:\s*\*\*\s*([\s\S]*?)(?=\*\*Recomendaciones Accionables:\*\*|Recomendaciones Accionables:|$)/i,
          /\*\*Conclusión:\*\*\s*([\s\S]*?)(?=\*\*Recomendaciones Accionables:\*\*|Recomendaciones Accionables:|$)/i,
          /Conclusión:\s*([\s\S]*?)(?=\*\*Recomendaciones Accionables:\*\*|Recomendaciones Accionables:|$)/i,
          /En conclusión[,:]\s*([\s\S]*?)(?=\*\*Recomendaciones Accionables:\*\*|Recomendaciones Accionables:|$)/i,
          /\*\*\s*Conclusión\s*\*\*\s*([\s\S]*?)(?=\*\*Recomendaciones Accionables:\*\*|Recomendaciones Accionables:|$)/i,
          /Dado el incompleto[\s\S]*?(?=\*\*Recomendaciones Accionables:\*\*|Recomendaciones Accionables:|$)/i,
          /Para impulsar el éxito[\s\S]*?(?=\*\*Recomendaciones Accionables:\*\*|Recomendaciones Accionables:|$)/i
        ],
        recommendations: /\*\*Recomendaciones Accionables:\*\*([\s\S]*?)$/i,
        cleanupPatterns: [
          /\*{2,}\s*Conclusión\s*\*{2,}[\s\S]*$/i,
          /\*\*\s*Conclusión\s*:\s*\*\*[\s\S]*$/i,
          /\*\*Conclusión:\*\*[\s\S]*$/i,
          /En conclusión[\s\S]*$/i,
          /Dado el incompleto[\s\S]*$/i,
          /Para impulsar el éxito[\s\S]*$/i,
          /\*\*Recomendaciones Accionables:\*\*[\s\S]*$/i
        ]
      }
    },

    porter: {
      title: "Análisis de las Cinco Fuerzas de Porter",
      conclusion: "Conclusión",
      recommendations: "Recomendaciones Accionables",
      forces: {
        supplierPower: "Poder de los Proveedores",
        buyerPower: "Poder de los Compradores",
        competitiveRivalry: "Rivalidad Competitiva",
        threatOfSubstitution: "Amenaza de Sustitución",
        threatOfNewEntry: "Amenaza de Nuevos Entrantes"
      },
      patterns: {
        conclusion: [
          /\*{2,}\s*Conclusión\s*\*{2,}\s*([\s\S]*?)(?=\*\*Recomendaciones Accionables:\*\*|Recomendaciones Accionables:|$)/i,
          /\*\*\s*Conclusión\s*:\s*\*\*\s*([\s\S]*?)(?=\*\*Recomendaciones Accionables:\*\*|Recomendaciones Accionables:|$)/i,
          /\*\*Conclusión:\*\*\s*([\s\S]*?)(?=\*\*Recomendaciones Accionables:\*\*|Recomendaciones Accionables:|$)/i,
          /Conclusión:\s*([\s\S]*?)(?=\*\*Recomendaciones Accionables:\*\*|Recomendaciones Accionables:|$)/i,
          /En conclusión[,:]\s*([\s\S]*?)(?=\*\*Recomendaciones Accionables:\*\*|Recomendaciones Accionables:|$)/i,
          /\*\*\s*Conclusión\s*\*\*\s*([\s\S]*?)(?=\*\*Recomendaciones Accionables:\*\*|Recomendaciones Accionables:|$)/i
        ],
        recommendations: /\*\*Recomendaciones Accionables:\*\*([\s\S]*?)$/i,
        cleanupPatterns: [
          /\*{2,}\s*Conclusión\s*\*{2,}[\s\S]*$/i,
          /\*\*\s*Conclusión\s*:\s*\*\*[\s\S]*$/i,
          /\*\*Conclusión:\*\*[\s\S]*$/i,
          /En conclusión[\s\S]*$/i,
          /Para tener éxito en este entorno[\s\S]*$/i,
          /Al seguir estas recomendaciones[\s\S]*$/i,
          /Para mantenerse competitivo[\s\S]*$/i
        ]
      }
    },

    strategic: {
      title: "Análisis ESTRATÉGICO",
      conclusion: "Conclusión",
      noData: "Sin datos disponibles para",
      keyActions: "Acciones clave:",
      theory: "Teoría:",
      example: "Ejemplo:",
      patterns: {
        conclusion: [
          /\*{2,}\s*Conclusión\s*\*{2,}\s*([\s\S]*?)(?=\*\*Recomendaciones Accionables:\*\*|$)/i,
          /\*\*\s*Conclusión\s*:\s*\*\*\s*([\s\S]*?)(?=\*\*Recomendaciones Accionables:\*\*|$)/i,
          /\*\*Conclusión:\*\*\s*([\s\S]*?)(?=\*\*Recomendaciones Accionables:\*\*|$)/i,
          /En conclusión[,:]\s*([\s\S]*?)(?=\*\*Recomendaciones Accionables:\*\*|$)/i
        ],
        letterPatterns: [
          /\*\*([ESTRATÉGICO])\s*=\s*([^*]+?)\*\*\s*([\s\S]*?)(?=\*\*[ESTRATÉGICO]\s*=|\*\*Conclusión|En conclusión|$)/i,
          /([ESTRATÉGICO])\s*=\s*([^\n]+?)\n([\s\S]*?)(?=[ESTRATÉGICO]\s*=|Conclusión|En conclusión|$)/i,
          /\*\*([ESTRATÉGICO])\*\*\s*=\s*([^\n]+?)\n([\s\S]*?)(?=\*\*[ESTRATÉGICO]|[ESTRATÉGICO]\s*=|Conclusión|En conclusión|$)/i,
          /([ESTRATÉGICO])\s*:\s*([^\n]+?)\n([\s\S]*?)(?=[ESTRATÉGICO]\s*:|Conclusión|En conclusión|$)/i
        ]
      }
    }
  }
};

// CLEAN UI TRANSLATIONS ONLY - NO REGEX PATTERNS OR NESTED OBJECTS
export const staticTranslations = {
  en: {
    // Login page
    'welcome': 'Welcome!',
    'email_address': 'Email Address',
    'password': 'Password',
    'login': 'Log In',
    'signing_in': 'Signing in...',
    'not_member': 'Not a member?',
    'register_now': 'Register now',
    'continue_with': 'Or continue with',
    'hide_password': 'Hide password',
    'show_password': 'Show password',
    'login_failed': 'Login failed',

    // Register page
     "sign_up": "Sign Up",
    "create_account_subtitle": "Create your account to get started",
    "first_name": "First Name",
    "last_name": "Last Name",
    "email": "Email",
    "password": "Password",
    "confirm_password": "Confirm Password",
    "enter_first_name": "Enter your first name",
    "enter_last_name": "Enter your last name",
    "enter_email": "Enter your email address",
    "create_password": "Create a password",
    "show_password": "Show password",
    "hide_password": "Hide password",
    "agree_terms": "I agree to the",
    "terms_conditions": "Terms & Conditions",
    "and": "and",
    "privacy_policy": "Privacy Policy",
    "creating_account": "Creating account...",
    "create_account": "Create Account",
    "close": "Close",
    "account_created": "Account Created!",
    "registration_failed_msg": "Registration Failed",
    "redirecting_login": "Redirecting to login...",
    
    "first_name_required": "First name is required",
    "last_name_required": "Last name is required",
    "email_required": "Email address is required",
    "email_invalid": "Please enter a valid email address",
    "password_required": "Password is required",
    "password_min_length_8": "Password must be at least 8 characters long",
    "confirm_password_required": "Please confirm your password",
    "passwords_do_not_match": "Passwords do not match",
    "agree_terms_required": "You must agree to the terms and conditions",
    "password_requirements": "Password must be at least 8 characters long",
    
    "registration_successful": "Registration successful!",
    "registration_failed": "Registration failed. Please try again.",
    "email_already_exists": "An account with this email already exists",
    "user_account_notice": "All new accounts are created as regular users",

    // Dashboard page
    'dashboard': 'Dashboard',
    'welcome_dashboard': 'Welcome!',
    'create_business_plans': 'Create business plans step by step with the S.T.R.A.T.E.G.I.C framework. Activate AI capabilities for analysis, prediction, and decision-making.',
    'my_businesses': 'My Businesses',
    'create_business': 'Create business',
    'questions_remaining': 'Questions remaining:',
    'of': 'of',
    'business_insights': 'Business Insights',
    'generate_insights': 'Generate Insights',
    'get_comprehensive_analysis': 'Get comprehensive business analysis based on your responses',
    'analyzing': 'Analyzing...',
    'analysis_results': 'Analysis Results',
    'clear_results': 'Clear Results',
    'back_to_welcome': '← Back to Welcome',
    'loading_businesses': 'Loading businesses...',
    'error_loading_business': 'Error loading business data.',
    'no_businesses_found': 'No businesses found.',
    'enter_your_answer': 'Enter Your Answer',

    // Business Detail page
    'questions': 'Questions',
    'analysis': 'ANALYSIS',
    'strategic': 'STRATEGIC',
    'saving': 'Saving...',
    'save_successful': 'Save successful!',
    'save_failed': 'Save failed',
    'no_data_available': 'No Data Available',
    'no_business_data_found': 'No business data found.',
    'complete_all_questions': 'Complete All Questions',
    'complete_questions_to_unlock': 'Please answer all questions to unlock the analysis section',

    // Progress and status
    'progress': 'Progress',
    'completed': 'Completed',
    'in_progress': 'In Progress',
    'not_started': 'Not Started',
    'total_progress': 'Total Progress',
    'questions_answered': 'Questions Answered',
    'categories_completed': 'Categories Completed',

    // Progress Section
    'preview': 'Preview',
    'response_summary': 'Summary',
    'information': 'Information',
    'progress_label': 'Progress',
    'questions_answered_label': 'questions answered',
    'complete_remaining_questions': 'Please complete the remaining questions to continue. The more questions you answer, the more accurate and personalized your results will be.',
    'manual_save': 'Manual Save',

    // Preview Content
    'summary': 'Summary',
    'total_questions': 'Total Questions',
    'answered_questions': 'Answered Questions',
    'pending_questions': 'Pending Questions',
    'completion_rate': 'Completion Rate',
    'categories': 'Categories',
    'status': 'Status',
    'complete': 'Complete',
    'no_questions_category': 'No questions in this category',
    'question_short': 'Q',
    'answered': 'Answered',
    'pending': 'Pending',
    'options': 'options',
    'answer': 'Answer',
    'no_answer_provided': 'No answer provided yet',
    'available_options': 'Available options',
    'rating': 'Rating',

    // Common UI elements
    'loading': 'Loading...',
    'error': 'Error',
    'no_data': 'No data available',
    'refresh': 'Refresh',
    'save': 'Save',
    'cancel': 'Cancel',
    'delete': 'Delete',
    'edit': 'Edit',
    'add': 'Add',
    'search': 'Search',
    'filter': 'Filter',
    'export': 'Export',
    'settings': 'Settings',
    'logout': 'Logout',
    'back': 'Back',
    'next': 'Next',
    'previous': 'Previous',
    'submit': 'Submit',
    'close': 'Close',
    'open': 'Open',
    'expand': 'Expand',
    'collapse': 'Collapse',
    'view': 'View',
    'download': 'Download',
    'upload': 'Upload',
    'copy': 'Copy',
    'paste': 'Paste',
    'cut': 'Cut',
    'select_all': 'Select All',
    'clear': 'Clear',
    'reset': 'Reset',
    'apply': 'Apply',
    'confirm': 'Confirm',
    'yes': 'Yes',
    'no': 'No',
    'ok': 'OK',

    'swot_analysis': 'SWOT',
    'porters_five_forces': "Porter's Five Forces",
    'value_chain_analysis': 'Value Chain',
    'bcg_matrix': 'BCG Matrix',
    'strategic_framework': 'STRATEGIC',

    // Analysis Subtitles
    'swot_subtitle': 'Strengths, weaknesses, opportunities, and threats',
    'porters_subtitle': 'Industry analysis framework',
    'bcg_subtitle': 'Portfolio analysis tool for strategic planning',
    'value_chain_subtitle': 'Activities that create value in your organization',
    'strategic_subtitle': 'Comprehensive strategic analysis',

    // Error Messages
    'no_survey_responses': 'No survey responses found. Please complete the survey first.',
    'authentication_failed': 'Authentication failed. Please log in again.',
    'failed_load_business_data': 'Failed to load business data. Please try again.',

    // Analysis Components
    'strengths': 'Strengths',
    'weaknesses': 'Weaknesses',
    'opportunities': 'Opportunities',
    'threats': 'Threats',
    'supplier_power': 'Supplier Power',
    'buyer_power': 'Buyer Power',
    'competitive_rivalry': 'Competitive Rivalry',
    'threat_substitution': 'Threat of Substitution',
    'threat_new_entry': 'Threat of New Entry',
    'primary_activities': 'Primary Activities',
    'support_activities': 'Support Activities',
    'inbound_logistics': 'Inbound Logistics',
    'operations': 'Operations',
    'outbound_logistics': 'Outbound Logistics',
    'marketing_sales': 'Marketing & Sales',
    'service': 'Service',
    'firm_infrastructure': 'Firm Infrastructure',
    'human_resource_management': 'Human Resource Management',
    'technology_development': 'Technology Development',
    'procurement': 'Procurement',
    'margin': 'Margin',
    'linkages': 'Linkages',
    'agile_leaders': 'Agile Leaders (High Share / High Growth)',
    'established_performers': 'Established Performers (High Share / Low Growth)',
    'emerging_innovators': 'Emerging Innovators (Low Share / High Growth)',
    'strategic_drifters': 'Strategic Drifters (Low Share / Low Growth)',
    'political_factors': 'Political',
    'economic_factors': 'Economic',
    'social_factors': 'Social',
    'technological_factors': 'Technological',
    'legal_factors': 'Legal',
    'environmental_factors': 'Environmental',

    'select_analysis_framework': 'Select an Analysis Framework',
    'choose_framework_instruction': 'Choose from the tabs above to begin your analysis',
    'regenerate_analysis': 'Regenerate Analysis',
    'generating_analysis': 'Generating...',
    'analysis_complete': 'Analysis Complete',
    'analysis_error': 'Analysis Error',
    'no_analysis_selected': 'No analysis framework selected',
    'switch_framework': 'Switch Framework',
    'analysis_framework': 'Analysis Framework',
    'strategic_framework': 'Strategic Framework',
    'analysis_results': 'Analysis Results',
    'loading_analysis': 'Loading analysis...',
    'analysis_failed': 'Analysis failed to load',
    'try_regenerate': 'Try regenerating the analysis',

    'select_analysis_type': 'Select an Analysis Type',
    'choose_analysis_instruction': 'Choose from the options above to begin your analysis',
    'generating_analysis_text': 'Generating',
    'analysis_text': 'analysis',
    'no_analysis_data': 'No Analysis Data',
    'no_analysis_available': 'No analysis data available for',
    'analysis_results_text': 'analysis results',
    'analysis_complete_text': 'Analysis complete',
    'analysis_error_occurred': 'An error occurred while generating the analysis',
    'please_try_again': 'Please try again',
    'analysis_loading_text': 'Loading analysis data...',
    'analysis_unavailable': 'Analysis temporarily unavailable',

    'unsaved_changes': 'Unsaved changes',
    'auto_save_in': 'Auto-save in',
    'auto_save_pending': 'Auto-save pending...',
    'auto_save_info': 'Changes will be saved automatically in 10 seconds',
    'all_changes_saved': 'All changes saved',
    'changes_detected': 'Changes detected',
    'saving_automatically': 'Saving automatically...',
    'last_saved': 'Last saved',
    'save_in_progress': 'Save in progress',
    'auto_save_enabled': 'Auto-save enabled',
    'manual_save_now': 'Save now',

    'welcome': 'Welcome!',
    'welcome_message': 'Create business plans step by step with the S.T.R.A.T.E.G.I.C framework. Activate AI capabilities for analysis, prediction, and decision-making.',
    'my_businesses': 'My Businesses',
    'create_business': 'Create Business',
    'loading_businesses': 'Loading businesses...',
    'error_loading_business_data': 'Error loading business data.',
    'no_businesses_found': 'No businesses found.',
    'questions_remaining': 'Questions remaining',
    'of': 'of',
    'back_to_welcome': 'Back to Welcome',

    // Insights Section
    'business_insights': 'Business Insights',
    'generate_insights': 'Generate Insights',
    'generate_insights_desc': 'Get comprehensive business analysis based on your responses',
    'analyzing': 'Analyzing...',
    'generate_insights_btn': 'Generate Insights',
    'analysis_results': 'Analysis Results',
    'clear_results': 'Clear Results',

    // Hardcoded Insights Content
    'business_analysis_results': 'Business Analysis Results',
    'market_position': 'Market Position',
    'market_position_details': 'Your business operates in a competitive technology sector with significant growth potential. The current market share indicates room for expansion through strategic initiatives.',
    'strengths': 'Strengths',
    'strength_technical_foundation': 'Strong technical foundation',
    'strength_experienced_team': 'Experienced team',
    'strength_innovative_products': 'Innovative product offerings',
    'strength_established_customer_base': 'Established customer base',
    'areas_for_improvement': 'Areas for Improvement',
    'improvement_marketing_reach': 'Marketing reach could be expanded',
    'improvement_customer_acquisition': 'Customer acquisition costs need optimization',
    'improvement_product_diversification': 'Product diversification opportunities exist',
    'recommendations': 'Recommendations',
    'recommendation_digital_marketing': 'Focus on digital marketing strategies',
    'recommendation_customer_retention': 'Invest in customer retention programs',
    'recommendation_partnerships': 'Explore partnerships for market expansion',
    'recommendation_complementary_products': 'Consider developing complementary products',
    'growth_projections': 'Growth Projections',
    'growth_projection_details': 'Based on current trends, a 25-30% growth rate is achievable within the next 12 months with proper execution of recommended strategies.',

    'admin_panel.title': 'Admin Panel - Users Management',
    'admin_panel.all_users': 'All Users',
    'admin_panel.filter_placeholder': 'Filter by name or email...',
    'admin_panel.filter_date_placeholder': 'Filter by date',
    'admin_panel.sort_total_responses': 'Total Responses',
    'admin_panel.no_users_found': 'No users found',
    'admin_panel.download_csv_tooltip': 'Download CSV',
    'admin_panel.refresh_button_aria': 'Refresh users list',
    'admin_panel.loading': 'Loading...',

    'admin_panel_users_management': 'Admin Panel - Users Management',
    'all_users': 'All Users',
    'filter_by_name_or_email': 'Filter by name or email...',
    'name': 'Name',
    'email': 'Email',
    'company': 'Company',
    'created_at': 'Created At',
    'total_responses': 'Total Responses',
    'sort_by_total_responses': 'Sort by Total Responses',
    'actions': 'Actions',
    'download_csv': 'Download CSV',
    'no_users_found': 'No users found',
    'failed_to_fetch_users': 'Failed to fetch users',
    'failed_to_download_csv': 'Failed to download CSV',
    'register_now': 'Register Now',

    'signed_in_as': 'Signed in as',
    'dashboard': 'Dashboard',
    'admin': 'Admin',
    'logout': 'Logout',
    'traxia_logo_alt': 'Traxia Logo',
    'manual_save': 'Manual Save',
    'regenerating': 'Regenerating...',
    'regenerate': 'Regenerate',
  },

  es: {
     "sign_up": "Registrarse",
    "create_account_subtitle": "Crea tu cuenta para comenzar",
    "first_name": "Nombre",
    "last_name": "Apellido",
    "email": "Correo Electrónico",
    "password": "Contraseña",
    "confirm_password": "Confirmar Contraseña",
    "enter_first_name": "Ingresa tu nombre",
    "enter_last_name": "Ingresa tu apellido",
    "enter_email": "Ingresa tu correo electrónico",
    "create_password": "Crea una contraseña",
    "show_password": "Mostrar contraseña",
    "hide_password": "Ocultar contraseña",
    "agree_terms": "Acepto los",
    "terms_conditions": "Términos y Condiciones",
    "and": "y",
    "privacy_policy": "Política de Privacidad",
    "creating_account": "Creando cuenta...",
    "create_account": "Crear Cuenta",
    "close": "Cerrar",
    "account_created": "¡Cuenta Creada!",
    "registration_failed_msg": "Error en el Registro",
    "redirecting_login": "Redirigiendo al inicio de sesión...",
    
    "first_name_required": "El nombre es obligatorio",
    "last_name_required": "El apellido es obligatorio",
    "email_required": "El correo electrónico es obligatorio",
    "email_invalid": "Por favor ingresa un correo electrónico válido",
    "password_required": "La contraseña es obligatoria",
    "password_min_length_8": "La contraseña debe tener al menos 8 caracteres",
    "confirm_password_required": "Por favor confirma tu contraseña",
    "passwords_do_not_match": "Las contraseñas no coinciden",
    "agree_terms_required": "Debes aceptar los términos y condiciones",
    "password_requirements": "La contraseña debe tener al menos 8 caracteres",
    
    "registration_successful": "¡Registro exitoso! Bienvenido",
    "registration_failed": "Error en el registro. Por favor intenta de nuevo.",
    "email_already_exists": "Ya existe una cuenta con este correo electrónico",
    "user_account_notice": "Todas las cuentas nuevas se crean como usuarios regulares",
    'manual_save': 'Guardado Manual',
    'regenerating': 'Regenerando...',
    'regenerate': 'Regenerar',
    'signed_in_as': 'Conectado como',
    'dashboard': 'Tablero',
    'admin': 'Administración',
    'logout': 'Cerrar sesión',
    'traxia_logo_alt': 'Logo de Traxia',
    'admin_panel_users_management': 'Panel de Administración - Gestión de Usuarios',
    'all_users': 'Todos los Usuarios',
    'filter_by_name_or_email': 'Filtrar por nombre o correo electrónico...',
    'name': 'Nombre',
    'email': 'Correo electrónico',
    'company': 'Empresa',
    'created_at': 'Creado el',
    'total_responses': 'Respuestas Totales',
    'sort_by_total_responses': 'Ordenar por Respuestas Totales',
    'actions': 'Acciones',
    'download_csv': 'Descargar CSV',
    'no_users_found': 'No se encontraron usuarios',
    'failed_to_fetch_users': 'Error al obtener usuarios',
    'failed_to_download_csv': 'Error al descargar CSV',
    'register_now': 'Regístrate ahora',

    'admin_panel.title': 'Panel de Administración - Gestión de Usuarios',
    'admin_panel.all_users': 'Todos los usuarios',
    'admin_panel.filter_placeholder': 'Filtrar por nombre o correo...',
    'admin_panel.filter_date_placeholder': 'Filtrar por fecha',
    'admin_panel.sort_total_responses': 'Total de respuestas',
    'admin_panel.no_users_found': 'No se encontraron usuarios',
    'admin_panel.download_csv_tooltip': 'Descargar CSV',
    'admin_panel.refresh_button_aria': 'Actualizar lista de usuarios',
    'admin_panel.loading': 'Cargando...',

    'welcome': '¡Bienvenido!',
    'welcome_message': 'Crea planes de negocio paso a paso con el marco S.T.R.A.T.E.G.I.C. Activa capacidades de IA para análisis, predicción y toma de decisiones.',
    'my_businesses': 'Mis negocios',
    'create_business': 'Crear negocio',
    'loading_businesses': 'Cargando negocios...',
    'error_loading_business_data': 'Error al cargar los datos del negocio.',
    'no_businesses_found': 'No se encontraron negocios.',
    'questions_remaining': 'Preguntas restantes',
    'of': 'de',
    'back_to_welcome': 'Volver a Bienvenida',

    // Insights Section
    'business_insights': 'Perspectivas de negocio',
    'generate_insights': 'Generar perspectivas',
    'generate_insights_desc': 'Obtén un análisis completo del negocio basado en tus respuestas',
    'analyzing': 'Analizando...',
    'generate_insights_btn': 'Generar perspectivas',
    'analysis_results': 'Resultados del análisis',
    'clear_results': 'Borrar resultados',

    // Hardcoded Insights Content
    'business_analysis_results': 'Resultados del análisis de negocio',
    'market_position': 'Posición en el mercado',
    'market_position_details': 'Tu negocio opera en un sector tecnológico competitivo con un potencial significativo de crecimiento. La cuota de mercado actual indica espacio para expansión mediante iniciativas estratégicas.',
    'strengths': 'Fortalezas',
    'strength_technical_foundation': 'Fuerte base técnica',
    'strength_experienced_team': 'Equipo experimentado',
    'strength_innovative_products': 'Ofertas de productos innovadores',
    'strength_established_customer_base': 'Base de clientes establecida',
    'areas_for_improvement': 'Áreas para mejorar',
    'improvement_marketing_reach': 'El alcance de marketing podría ampliarse',
    'improvement_customer_acquisition': 'Los costos de adquisición de clientes necesitan optimización',
    'improvement_product_diversification': 'Existen oportunidades para diversificación de productos',
    'recommendations': 'Recomendaciones',
    'recommendation_digital_marketing': 'Enfócate en estrategias de marketing digital',
    'recommendation_customer_retention': 'Invierte en programas de retención de clientes',
    'recommendation_partnerships': 'Explora asociaciones para expansión de mercado',
    'recommendation_complementary_products': 'Considera desarrollar productos complementarios',
    'growth_projections': 'Proyecciones de crecimiento',
    'growth_projection_details': 'Basado en tendencias actuales, una tasa de crecimiento del 25-30% es alcanzable dentro de los próximos 12 meses con la ejecución adecuada de las estrategias recomendadas.',

    // Save related
    'save_in_progress': 'Guardando en progreso',
    'auto_save_enabled': 'Guardado automático activado',
    'manual_save_now': 'Guardar ahora',
    // Login page
    'welcome': '¡Bienvenido!',
    'email_address': 'Dirección de correo electrónico',
    'password': 'Contraseña',
    'login': 'Acceso',
    'signing_in': 'Iniciando sesión...',
    'not_member': '¿Aún no eres miembro?',
    'register_now': 'Regístrate ahora',
    'continue_with': 'O continuar con',
    'hide_password': 'Ocultar contraseña',
    'show_password': 'Mostrar contraseña',
    'login_failed': 'Error de inicio de sesión', 

    // Dashboard page
    'dashboard': 'Panel de Control',
    'welcome_dashboard': '¡Bienvenido!',
    'create_business_plans': 'Crea planes de negocio paso a paso con el marco S.T.R.A.T.E.G.I.C. Activa las capacidades de IA para análisis, predicción y toma de decisiones.',
    'my_businesses': 'Mis Negocios',
    'create_business': 'Crear negocio',
    'questions_remaining': 'Preguntas restantes:',
    'of': 'de',
    'business_insights': 'Perspectivas de Negocio',
    'generate_insights': 'Generar Perspectivas',
    'get_comprehensive_analysis': 'Obtén un análisis integral de negocio basado en tus respuestas',
    'analyzing': 'Analizando...',
    'analysis_results': 'Resultados del Análisis',
    'clear_results': 'Limpiar Resultados',
    'back_to_welcome': '← Volver a Bienvenida',
    'loading_businesses': 'Cargando negocios...',
    'error_loading_business': 'Error al cargar datos del negocio.',
    'no_businesses_found': 'No se encontraron negocios.',
    'enter_your_answer': 'Ingresa Tu Respuesta',

    // Business Detail page
    'questions': 'Preguntas',
    'analysis': 'ANÁLISIS',
    'strategic': 'ESTRATÉGICO',
    'saving': 'Guardando...',
    'save_successful': '¡Guardado exitoso!',
    'save_failed': 'Error al guardar',
    'no_data_available': 'No Hay Datos Disponibles',
    'no_business_data_found': 'No se encontraron datos de negocio.',
    'complete_all_questions': 'Completa Todas las Preguntas',
    'complete_questions_to_unlock': 'Por favor responde todas las preguntas para desbloquear la sección de análisis',

    // Progress Section
    'preview': 'Vista Previa',
    'response_summary': 'Resumen de Respuestas',
    'information': 'Información',
    'progress_label': 'Progreso',
    'questions_answered_label': 'preguntas respondidas',
    'complete_remaining_questions': 'Por favor completa las preguntas restantes para continuar. Mientras más preguntas respondas, más precisos y personalizados serán tus resultados.',
    'manual_save': 'Guardar Manual',

    // Preview Content
    'summary': 'Resumen',
    'total_questions': 'Total de Preguntas',
    'answered_questions': 'Preguntas Respondidas',
    'pending_questions': 'Preguntas Pendientes',
    'completion_rate': 'Tasa de Finalización',
    'categories': 'Categorías',
    'status': 'Estado',
    'complete': 'Completo',
    'no_questions_category': 'No hay preguntas en esta categoría',
    'question_short': 'P',
    'answered': 'Respondida',
    'pending': 'Pendiente',
    'options': 'opciones',
    'answer': 'Respuesta',
    'no_answer_provided': 'Aún no se ha proporcionado respuesta',
    'available_options': 'Opciones disponibles',
    'rating': 'Calificación',

    // Progress and status
    'progress': 'Progreso',
    'completed': 'Completado',
    'in_progress': 'En Progreso',
    'not_started': 'No Iniciado',
    'total_progress': 'Progreso Total',
    'questions_answered': 'Preguntas Respondidas',
    'categories_completed': 'Categorías Completadas',

    // Common UI elements
    'loading': 'Cargando...',
    'error': 'Error',
    'no_data': 'No hay datos disponibles',
    'refresh': 'Actualizar',
    'save': 'Guardar',
    'cancel': 'Cancelar',
    'delete': 'Eliminar',
    'edit': 'Editar',
    'add': 'Agregar',
    'search': 'Buscar',
    'filter': 'Filtrar',
    'export': 'Exportar',
    'settings': 'Configuración',
    'logout': 'Cerrar Sesión',
    'back': 'Atrás',
    'next': 'Siguiente',
    'previous': 'Anterior',
    'submit': 'Enviar',
    'close': 'Cerrar',
    'open': 'Abrir',
    'expand': 'Expandir',
    'collapse': 'Contraer',
    'view': 'Ver',
    'download': 'Descargar',
    'upload': 'Subir',
    'copy': 'Copiar',
    'paste': 'Pegar',
    'cut': 'Cortar',
    'select_all': 'Seleccionar Todo',
    'clear': 'Limpiar',
    'reset': 'Restablecer',
    'apply': 'Aplicar',
    'confirm': 'Confirmar',
    'yes': 'Sí',
    'no': 'No',
    'ok': 'OK',

    'swot_analysis': 'FODA',
    'porters_five_forces': 'Cinco Fuerzas de Porter',
    'value_chain_analysis': 'Cadena de Valor',
    'bcg_matrix': 'Matriz BCG',
    'strategic_framework': 'ESTRATÉGICO',

    // Analysis Subtitles
    'swot_subtitle': 'Fortalezas, debilidades, oportunidades y amenazas',
    'porters_subtitle': 'Marco de análisis de la industria',
    'bcg_subtitle': 'Herramienta de análisis de cartera para planificación estratégica',
    'value_chain_subtitle': 'Actividades que crean valor en tu organización',
    'strategic_subtitle': 'Análisis estratégico integral',

    // Error Messages
    'no_survey_responses': 'No se encontraron respuestas de encuesta. Por favor completa la encuesta primero.',
    'authentication_failed': 'Error de autenticación. Por favor inicia sesión nuevamente.',
    'failed_load_business_data': 'Error al cargar datos del negocio. Por favor intenta de nuevo.',

    // Analysis Components
    'strengths': 'Fortalezas',
    'weaknesses': 'Debilidades',
    'opportunities': 'Oportunidades',
    'threats': 'Amenazas',
    'supplier_power': 'Poder del Proveedor',
    'buyer_power': 'Poder del Comprador',
    'competitive_rivalry': 'Rivalidad Competitiva',
    'threat_substitution': 'Amenaza de Sustitución',
    'threat_new_entry': 'Amenaza de Nueva Entrada',
    'primary_activities': 'Actividades Primarias',
    'support_activities': 'Actividades de Apoyo',
    'inbound_logistics': 'Logística de Entrada',
    'operations': 'Operaciones',
    'outbound_logistics': 'Logística de Salida',
    'marketing_sales': 'Marketing y Ventas',
    'service': 'Servicio',
    'firm_infrastructure': 'Infraestructura de la Empresa',
    'human_resource_management': 'Gestión de Recursos Humanos',
    'technology_development': 'Desarrollo Tecnológico',
    'procurement': 'Adquisiciones',
    'margin': 'Margen',
    'linkages': 'Vínculos',
    'agile_leaders': 'Líderes Ágiles (Alta Participación / Alto Crecimiento)',
    'established_performers': 'Ejecutores Establecidos (Alta Participación / Bajo Crecimiento)',
    'emerging_innovators': 'Innovadores Emergentes (Baja Participación / Alto Crecimiento)',
    'strategic_drifters': 'Navegantes Estratégicos (Baja Participación / Bajo Crecimiento)',
    'political_factors': 'Político',
    'economic_factors': 'Económico',
    'social_factors': 'Social',
    'technological_factors': 'Tecnológico',
    'legal_factors': 'Legal',
    'environmental_factors': 'Ambiental',

    'select_analysis_framework': 'Selecciona un Marco de Análisis',
    'choose_framework_instruction': 'Elige entre las pestañas de arriba para comenzar tu análisis',
    'regenerate_analysis': 'Regenerar Análisis',
    'generating_analysis': 'Generando...',
    'analysis_complete': 'Análisis Completo',
    'analysis_error': 'Error de Análisis',
    'no_analysis_selected': 'No se ha seleccionado un marco de análisis',
    'switch_framework': 'Cambiar Marco',
    'analysis_framework': 'Marco de Análisis',
    'strategic_framework': 'Marco Estratégico',
    'analysis_results': 'Resultados del Análisis',
    'loading_analysis': 'Cargando análisis...',
    'analysis_failed': 'Error al cargar el análisis',
    'try_regenerate': 'Intenta regenerar el análisis',

    'select_analysis_type': 'Selecciona un Tipo de Análisis',
    'choose_analysis_instruction': 'Elige entre las opciones de arriba para comenzar tu análisis',
    'generating_analysis_text': 'Generando',
    'analysis_text': 'análisis',
    'no_analysis_data': 'No Hay Datos de Análisis',
    'no_analysis_available': 'No hay datos de análisis disponibles para',
    'analysis_results_text': 'resultados del análisis',
    'analysis_complete_text': 'Análisis completo',
    'analysis_error_occurred': 'Ocurrió un error al generar el análisis',
    'please_try_again': 'Por favor intenta de nuevo',
    'analysis_loading_text': 'Cargando datos del análisis...',
    'analysis_unavailable': 'Análisis temporalmente no disponible',

    'unsaved_changes': 'Cambios sin guardar',
    'auto_save_in': 'Auto-guardado en',
    'auto_save_pending': 'Auto-guardado pendiente...',
    'auto_save_info': 'Los cambios se guardarán automáticamente en 10 segundos',
    'all_changes_saved': 'Todos los cambios guardados',
    'changes_detected': 'Cambios detectados',
    'saving_automatically': 'Guardando automáticamente...',
    'last_saved': 'Último guardado',
    'save_in_progress': 'Guardado en progreso',
    'auto_save_enabled': 'Auto-guardado habilitado',
    'manual_save_now': 'Guardar ahora'
  }
};

// Initialize global translations
export const initializeTranslations = () => {
  window.appTranslations = staticTranslations;

  // Check session storage first, then localStorage as fallback
  const sessionLang = sessionStorage.getItem('appLanguage');
  const localLang = localStorage.getItem('appLanguage');
  window.currentAppLanguage = sessionLang || localLang || 'en';

  // Static translation function - ONLY FOR UI ELEMENTS
  window.getTranslation = function (key) {
    const result = window.appTranslations[window.currentAppLanguage][key] || key;
    return typeof result === 'string' ? result : String(key);
  };

  // Enhanced language change function - now saves to session storage
  window.setAppLanguage = function (language) {
    const oldLanguage = window.currentAppLanguage;
    window.currentAppLanguage = language;
    sessionStorage.setItem('appLanguage', language);
    localStorage.setItem('appLanguage', language); // Keep as backup

    // Update the translation function
    window.getTranslation = function (key) {
      const result = window.appTranslations[window.currentAppLanguage][key] || key;
      return typeof result === 'string' ? result : String(key);
    };

    // Only dispatch event if language actually changed
    if (oldLanguage !== language) {
      window.dispatchEvent(new CustomEvent('languageChanged', {
        detail: {
          language: language,
          previousLanguage: oldLanguage
        }
      }));
    }
  };

  // Get current language function
  window.getCurrentLanguage = function () {
    return window.currentAppLanguage || 'en';
  };

  // Backward compatibility - keep the old function name
  window.translateApp = window.setAppLanguage;

  // Clear language from session (useful for logout)
  window.clearSessionLanguage = function () {
    sessionStorage.removeItem('appLanguage');
    // Keep in localStorage for next login
  };
};

// Language detection function - for analysis components
export const detectLanguage = (analysisResult) => {
  if (!analysisResult) return 'en';

  const spanishKeywords = [
    'Análisis FODA', 'Fortalezas', 'Debilidades', 'Oportunidades', 'Amenazas',
    'Conclusión', 'En conclusión', 'Actividades Primarias', 'Actividades de Apoyo',
    'Cadena de Valor', 'Matriz BCG', 'Cinco Fuerzas', 'Recomendaciones Accionables'
  ];

  const englishKeywords = [
    'SWOT Analysis', 'Strengths', 'Weaknesses', 'Opportunities', 'Threats',
    'Conclusion', 'In conclusion', 'Primary Activities', 'Support Activities',
    'Value Chain', 'BCG Matrix', 'Five Forces', 'Actionable Recommendations'
  ];

  let spanishScore = 0;
  let englishScore = 0;

  spanishKeywords.forEach(keyword => {
    if (analysisResult.includes(keyword)) spanishScore++;
  });

  englishKeywords.forEach(keyword => {
    if (analysisResult.includes(keyword)) englishScore++;
  });

  return spanishScore > englishScore ? 'es' : 'en';
};