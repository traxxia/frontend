import * as XLSX from 'xlsx';

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
export const detectTemplateType = async (uploadedFile) => {
  try {
    const filenameDetection = detectByFilename(uploadedFile);
    if (filenameDetection) {
      return filenameDetection;
    }

    const uploadedStructure = await parseUploadedFile(uploadedFile);
    const contentDetection = await detectByUniqueContent(uploadedStructure);
    if (contentDetection) {
      return contentDetection;
    }

    const columnCountDetection = detectByColumnCount(uploadedStructure);
    if (columnCountDetection) {
      return columnCountDetection;
    }
    return {
      type: 'unknown',
      name: 'Unknown Template',
      score: 0,
      confidence: 'none'
    };

  } catch (error) {
    throw new Error(`Template detection failed: ${error.message}`);
  }
};

const detectByFilename = (uploadedFile) => {
  const fileName = uploadedFile.name.toLowerCase();

  if (fileName.includes('simplified')) {
    return {
      type: 'simplified',
      name: 'Simplified Template',
      score: 1.0,
      confidence: 'high'
    };
  }

  if (fileName.includes('standard')) {
    return {
      type: 'standard',
      name: 'Standard Template',
      score: 1.0,
      confidence: 'high'
    };
  }

  if (fileName.includes('detailed')) {
    return {
      type: 'detailed',
      name: 'Detailed Template',
      score: 1.0,
      confidence: 'high'
    };
  }

  return null;
};

const detectByUniqueContent = async (uploadedStructure) => {
  const allHeaders = [];
  Object.values(uploadedStructure.sheets).forEach(sheet => {
    allHeaders.push(...(sheet.headers || []));
  });

  const normalizedHeaders = allHeaders.map(h => normalizeHeader(h));
  const headerString = normalizedHeaders.join('|').toLowerCase();
  const templatePatterns = {
    simplified: {
      uniqueHeaders: ['quickcash', 'basicrevenue', 'simplecosts'],
      keywords: ['simple', 'basic', 'quick'],
      score: 0.9
    },
    standard: {
      uniqueHeaders: ['operatingexpenses', 'grossmargin', 'netoperatingincome'],
      keywords: ['operating', 'gross', 'net'],
      score: 0.9
    },
    detailed: {
      uniqueHeaders: ['comprehensiveincome', 'retainedearnings', 'workingcapitalchanges'],
      keywords: ['comprehensive', 'retained', 'detailed'],
      score: 0.9
    }
  };
  for (const [templateType, pattern] of Object.entries(templatePatterns)) {
    const uniqueHeadersFound = pattern.uniqueHeaders.filter(unique =>
      normalizedHeaders.some(header => header.includes(unique) || unique.includes(header))
    );
    const keywordsFound = pattern.keywords.filter(keyword =>
      headerString.includes(keyword)
    );

    const totalMatches = uniqueHeadersFound.length + keywordsFound.length;
    const totalPossible = pattern.uniqueHeaders.length + pattern.keywords.length;

    if (totalMatches > 0 && (totalMatches / totalPossible) > 0.3) {
      return {
        type: templateType,
        name: TEMPLATE_FILES[templateType].name,
        score: pattern.score,
        confidence: 'high'
      };
    }
  }
  return null;
};

const detectByColumnCount = (uploadedStructure) => {
  const totalColumns = Object.values(uploadedStructure.sheets).reduce((sum, sheet) =>
    sum + (sheet.headers?.length || 0), 0);

  if (totalColumns <= 10) {
    return {
      type: 'simplified',
      name: 'Simplified Template',
      score: 0.7,
      confidence: 'medium'
    };
  } else if (totalColumns <= 25) {
    return {
      type: 'standard',
      name: 'Standard Template',
      score: 0.7,
      confidence: 'medium'
    };
  } else {
    return {
      type: 'detailed',
      name: 'Detailed Template',
      score: 0.7,
      confidence: 'medium'
    };
  }
};
const downloadAndParseTemplate = async (templateType) => {
  const template = TEMPLATE_FILES[templateType];
  if (!template) {
    throw new Error(`Unknown template type: ${templateType}`);
  }

  try {
    const response = await fetch(template.path);
    if (!response.ok) {
      throw new Error(`Failed to download template: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    const templateStructure = {
      name: template.name,
      fileName: template.fileName,
      sheets: {}
    };

    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (sheetData.length > 0) {
        const headers = sheetData[0] || [];
        templateStructure.sheets[sheetName] = {
          headers: headers.filter(h => h !== null && h !== undefined && h !== ''),
          totalRows: sheetData.length,
          sampleData: sheetData.slice(0, 3)
        };
      }
    });
    return templateStructure;
  } catch (error) {
    throw new Error(`Error downloading template ${template.name}: ${error.message}`);
  }
};

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

const normalizeHeader = (header) => {
  if (typeof header !== 'string') return String(header || '');
  return header.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
};

export const validateAgainstTemplate = async (uploadedFile, templateType) => {
  try {
    const templateStructure = await downloadAndParseTemplate(templateType);
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

    validateSheetStructure(templateStructure, uploadedStructure, validation);
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

const validateSheetStructure = (template, uploaded, validation) => {
  const templateSheets = Object.keys(template.sheets);
  const uploadedSheets = Object.keys(uploaded.sheets);

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

  const extraSheets = uploadedSheets.filter(sheet => !templateSheets.includes(sheet));
  if (extraSheets.length > 0) {
    validation.warnings.push(`Found additional sheets not in template: ${extraSheets.join(', ')}`);
  }
};

const validateSheetColumns = (templateSheet, uploadedSheet, sheetName, validation) => {
  const templateHeaders = templateSheet.headers;
  const uploadedHeaders = uploadedSheet.headers;

  const normalizedTemplate = templateHeaders.map(h => normalizeHeader(h));
  const normalizedUploaded = uploadedHeaders.map(h => normalizeHeader(h));

  const missingColumns = templateHeaders.filter(header =>
    !normalizedUploaded.includes(normalizeHeader(header))
  );

  const extraColumns = uploadedHeaders.filter(header =>
    !normalizedTemplate.includes(normalizeHeader(header))
  );

  validation.details.sheetComparison[sheetName] = {
    expectedColumns: templateHeaders.length,
    foundColumns: uploadedHeaders.length,
    matchingColumns: templateHeaders.length - missingColumns.length,
    missingColumns,
    extraColumns,
    hasData: uploadedSheet.hasData
  };

  if (missingColumns.length > 0) {
    validation.errors.push(
      `Sheet "${sheetName}" is missing required columns: ${missingColumns.join(', ')}`
    );
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

export const getAvailableTemplates = () => {
  return Object.keys(TEMPLATE_FILES).map(key => ({
    id: key,
    ...TEMPLATE_FILES[key]
  }));
};

export const formatValidationResults = (validation) => {
  if (!validation) return 'No validation results';
  if (validation.isValid) {
    return `✅ File matches ${validation.templateName} template perfectly`;
  }
  let summary = `❌ File does not match ${validation.templateName} template\n`;
  summary += `${validation.errors.length} error(s), ${validation.warnings.length} warning(s)`;
  return summary;
};
