import * as XLSX from 'xlsx';

// Template file configurations
const TEMPLATE_FILES = {
  simplified: {
    name: 'Simplified Template',
    fileName: 'traxxia_simplified_template.xlsx',
    path: '/templates/traxxia_simplified_template.xlsx'
  },
  standard: {
    name: 'Standard Template', 
    fileName: 'traxxia_standard_template.xlsx',
    path: '/templates/traxxia_standard_template.xlsx'
  },
  detailed: {
    name: 'Detailed Template',
    fileName: 'traxxia_detailed_template.xlsx', 
    path: '/templates/traxxia_detailed_template.xlsx'
  }
};

/**
 * Download and parse a template file from public folder
 */
const downloadAndParseTemplate = async (templateType) => {
  const template = TEMPLATE_FILES[templateType];
  if (!template) {
    throw new Error(`Unknown template type: ${templateType}`);
  }

  try {
    // Fetch the template file from public folder
    const response = await fetch(template.path);
    if (!response.ok) {
      throw new Error(`Failed to download template: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // Parse template structure
    const templateStructure = {
      name: template.name,
      fileName: template.fileName,
      sheets: {}
    };

    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      
      if (sheetData.length > 0) {
        // Get headers (first row)
        const headers = sheetData[0] || [];
        templateStructure.sheets[sheetName] = {
          headers: headers.filter(h => h !== null && h !== undefined && h !== ''),
          totalRows: sheetData.length,
          sampleData: sheetData.slice(0, 3) // First 3 rows for reference
        };
      }
    });

    return templateStructure;
  } catch (error) {
    throw new Error(`Error downloading template ${template.name}: ${error.message}`);
  }
};

/**
 * Parse uploaded file structure
 */
const parseUploadedFile = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    const uploadedStructure = {
      fileName: file.name,
      fileSize: file.size,
      sheets: {}
    };

    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      
      if (sheetData.length > 0) {
        const headers = sheetData[0] || [];
        uploadedStructure.sheets[sheetName] = {
          headers: headers.filter(h => h !== null && h !== undefined && h !== ''),
          totalRows: sheetData.length,
          hasData: sheetData.length > 1 && sheetData.slice(1).some(row => 
            row && row.some(cell => cell !== null && cell !== undefined && cell !== '')
          )
        };
      }
    });

    return uploadedStructure;
  } catch (error) {
    throw new Error(`Error parsing uploaded file: ${error.message}`);
  }
};
 
export const detectTemplateType = async (uploadedFile) => {
  try { 
    const uploadedStructure = await parseUploadedFile(uploadedFile);
    let bestMatch = null;
    let bestScore = 0;

    // Template complexity mapping for backend - consistent mapping
    const templateComplexityMap = {
      'simplified': 'simple',
      'standard': 'medium', 
      'detailed': 'medium'  // or 'complex' if you want detailed to be different
    };

    // Compare with each template type
    for (const [templateType, templateInfo] of Object.entries(TEMPLATE_FILES)) {
      try {
        const templateStructure = await downloadAndParseTemplate(templateType);
        const score = calculateMatchScore(uploadedStructure, templateStructure);
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            type: templateType,              // Original template type (simplified/standard/detailed)
            backendType: templateComplexityMap[templateType], // Mapped type for backend (simple/medium)
            name: templateInfo.name,
            score: score,
            confidence: score > 0.8 ? 'high' : score > 0.5 ? 'medium' : 'low'
          };
        }
      } catch (error) {
        console.warn(`Could not compare with ${templateType}:`, error.message);
      }
    }

    return bestMatch || {
      type: 'unknown',
      backendType: 'medium', // Default fallback
      name: 'Unknown Template',
      score: 0,
      confidence: 'none'
    };
  } catch (error) {
    throw new Error(`Template detection failed: ${error.message}`);
  }
};
 
export const validateAgainstTemplate = async (uploadedFile, templateType) => {
  try { 
    // Download and parse template
    const templateStructure = await downloadAndParseTemplate(templateType);
    
    // Parse uploaded file
    const uploadedStructure = await parseUploadedFile(uploadedFile);

    const validation = {
      isValid: true,
      templateType,
      templateName: templateStructure.name,
      templateFileName: templateStructure.fileName,
      uploadedFileName: uploadedStructure.fileName,
      errors: [],
      warnings: [],
      details: {
        sheetComparison: {},
        totalSheets: Object.keys(uploadedStructure.sheets).length,
        expectedSheets: Object.keys(templateStructure.sheets).length,
        matchingSheets: 0
      }
    };

    // Compare sheet structure
    validateSheetStructure(templateStructure, uploadedStructure, validation);

    // Set final validation status
    validation.isValid = validation.errors.length === 0;

    return validation;
  } catch (error) {
    return {
      isValid: false,
      templateType,
      templateName: TEMPLATE_FILES[templateType]?.name || 'Unknown',
      errors: [error.message],
      warnings: [],
      details: { sheetComparison: {}, totalSheets: 0, expectedSheets: 0, matchingSheets: 0 }
    };
  }
};

/**
 * Calculate match score between uploaded file and template
 */
const calculateMatchScore = (uploaded, template) => {
  const templateSheets = Object.keys(template.sheets);
  const uploadedSheets = Object.keys(uploaded.sheets);
  
  // Sheet name matching (40% weight)
  const sheetMatchScore = templateSheets.filter(sheet => 
    uploadedSheets.includes(sheet)
  ).length / templateSheets.length;

  // Column matching (60% weight)
  let totalExpectedColumns = 0;
  let totalMatchingColumns = 0;

  templateSheets.forEach(sheetName => {
    if (uploaded.sheets[sheetName]) {
      const templateHeaders = template.sheets[sheetName].headers;
      const uploadedHeaders = uploaded.sheets[sheetName].headers;
      
      totalExpectedColumns += templateHeaders.length;
      totalMatchingColumns += templateHeaders.filter(header =>
        uploadedHeaders.some(uploadedHeader => 
          normalizeHeader(header) === normalizeHeader(uploadedHeader)
        )
      ).length;
    }
  });

  const columnMatchScore = totalExpectedColumns > 0 ? 
    totalMatchingColumns / totalExpectedColumns : 0;

  // Weighted final score
  return (sheetMatchScore * 0.4) + (columnMatchScore * 0.6);
};

/**
 * Validate sheet structure between template and uploaded file
 */
const validateSheetStructure = (template, uploaded, validation) => {
  const templateSheets = Object.keys(template.sheets);
  const uploadedSheets = Object.keys(uploaded.sheets);

  // Check for missing sheets
  templateSheets.forEach(sheetName => {
    if (!uploadedSheets.includes(sheetName)) {
      validation.errors.push(`Missing required sheet: "${sheetName}"`);
    } else {
      validation.details.matchingSheets++;
      validateSheetColumns(
        template.sheets[sheetName], 
        uploaded.sheets[sheetName], 
        sheetName, 
        validation
      );
    }
  });

  // Check for extra sheets
  const extraSheets = uploadedSheets.filter(sheet => !templateSheets.includes(sheet));
  if (extraSheets.length > 0) {
    validation.warnings.push(`Found additional sheets not in template: ${extraSheets.join(', ')}`);
  }
};

/**
 * Validate columns within a sheet
 */
const validateSheetColumns = (templateSheet, uploadedSheet, sheetName, validation) => {
  const templateHeaders = templateSheet.headers;
  const uploadedHeaders = uploadedSheet.headers;

  // Normalize headers for comparison
  const normalizedTemplate = templateHeaders.map(h => normalizeHeader(h));
  const normalizedUploaded = uploadedHeaders.map(h => normalizeHeader(h));

  // Find missing columns
  const missingColumns = templateHeaders.filter(header => 
    !normalizedUploaded.includes(normalizeHeader(header))
  );

  // Find extra columns
  const extraColumns = uploadedHeaders.filter(header => 
    !normalizedTemplate.includes(normalizeHeader(header))
  );

  // Find mismatched columns (similar but not exact)
  const mismatchedColumns = [];
  templateHeaders.forEach(templateHeader => {
    const normalizedTemplate = normalizeHeader(templateHeader);
    const exactMatch = uploadedHeaders.find(uploadedHeader => 
      normalizeHeader(uploadedHeader) === normalizedTemplate
    );
    
    if (!exactMatch) {
      const similarMatch = uploadedHeaders.find(uploadedHeader =>
        calculateStringSimilarity(templateHeader.toLowerCase(), uploadedHeader.toLowerCase()) > 0.8
      );
      
      if (similarMatch) {
        mismatchedColumns.push({
          expected: templateHeader,
          found: similarMatch
        });
      }
    }
  });

  // Record sheet comparison details
  validation.details.sheetComparison[sheetName] = {
    expectedColumns: templateHeaders.length,
    foundColumns: uploadedHeaders.length,
    matchingColumns: templateHeaders.length - missingColumns.length,
    missingColumns,
    extraColumns,
    mismatchedColumns,
    hasData: uploadedSheet.hasData
  };

  // Add errors and warnings
  if (missingColumns.length > 0) {
    validation.errors.push(
      `Sheet "${sheetName}" is missing required columns: ${missingColumns.join(', ')}`
    );
  }

  if (mismatchedColumns.length > 0) {
    mismatchedColumns.forEach(({ expected, found }) => {
      validation.errors.push(
        `Sheet "${sheetName}": Column "${found}" should be "${expected}" (exact match required)`
      );
    });
  }

  if (extraColumns.length > 0) {
    validation.warnings.push(
      `Sheet "${sheetName}" has additional columns not in template: ${extraColumns.join(', ')}`
    );
  }

  if (!uploadedSheet.hasData) {
    validation.warnings.push(`Sheet "${sheetName}" appears to have no data rows`);
  }
};

/**
 * Normalize header for comparison
 */
const normalizeHeader = (header) => {
  if (typeof header !== 'string') return String(header || '');
  return header.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
};

/**
 * Calculate string similarity (0-1)
 */
const calculateStringSimilarity = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

/**
 * Calculate Levenshtein distance
 */
const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

/**
 * Get available template types
 */
export const getAvailableTemplates = () => {
  return Object.keys(TEMPLATE_FILES).map(key => ({
    id: key,
    ...TEMPLATE_FILES[key]
  }));
};

/**
 * Format validation results for display
 */
export const formatValidationResults = (validation) => {
  if (!validation) return 'No validation results';

  if (validation.isValid) {
    return `✅ File matches ${validation.templateName} template perfectly`;
  }

  let summary = `❌ File does not match ${validation.templateName} template\n`;
  summary += `${validation.errors.length} error(s), ${validation.warnings.length} warning(s)`;
  
  return summary;
};