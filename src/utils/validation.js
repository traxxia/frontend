export const validateRationale = (text) => {
  const trimmedText = (text || "").trim();

  if (trimmedText.length === 0) {
    return {
      isValid: false,
      error: "Rationale is required"
    };
  }

  const leadingSpaces = text.match(/^\s+/);
  if (leadingSpaces && leadingSpaces[0].length >= 3) {
    return {
      isValid: false,
      error: `Too many spaces before content (${leadingSpaces[0].length} spaces). Please reduce leading spaces.`
    };
  }

  const totalLength = trimmedText.length;
  const numbersCount = (trimmedText.match(/\d/g) || []).length;
  const specialCharsCount = (trimmedText.match(/[^a-zA-Z0-9\s]/g) || []).length;

  const numberRatio = numbersCount / totalLength;
  const specialRatio = specialCharsCount / totalLength;

  if (numberRatio > 0.4 || specialRatio > 0.3) {
    return {
      isValid: false,
      error: `Please use meaningful text.`
    };
  }

  const lettersOnly = trimmedText.replace(/[^a-zA-Z]/g, '');

  if (lettersOnly.length === 0) {
    return {
      isValid: false,
      error: "Rationale must contain letters (no numbers/special chars only)"
    };
  }

  if (lettersOnly.length < 5) {
    return {
      isValid: false,
      error: "Rationale must contain at least 5 letters of meaningful text"
    };
  }

  return {
    isValid: true,
    error: ""
  };
};

export const validateRequiredText = (text, fieldName, minLength = 2) => {
  if (!text || text.trim().length < minLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${minLength} characters`
    };
  }
  return { isValid: true, error: "" };
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: "Please enter a valid email address"
    };
  }
  return { isValid: true, error: "" };
};

export const validateField = (fieldName, value, rules = {}) => {
  const {
    required = false,
    numeric = false,
    alphanumeric = false,
    maxLength = null,
    minLength = null,
    min = null,
    max = null,
    pattern = null,
    allowSpecialChars = null,
  } = rules;

  // Required validation
  if (required && (!value || value.toString().trim() === '')) {
    return {
      isValid: false,
      message: `${fieldName} is required`,
    };
  }

  // Skip other validations if field is empty and not required
  if (!value || value.toString().trim() === '') {
    return { isValid: true, message: '' };
  }

  const stringValue = value.toString().trim();

  // Numeric validation (numbers and allowed special characters only)
  if (numeric) {
    const allowedChars = allowSpecialChars || ['.', ','];
    const numericPattern = new RegExp(`^[0-9${allowedChars.map(c => '\\' + c).join('')}]+$`);

    if (!numericPattern.test(stringValue)) {
      return {
        isValid: false,
        message: `${fieldName} must contain only numbers${allowedChars.length > 0 ? ` and ${allowedChars.join(', ')}` : ''
          }`,
      };
    }

    // Validate numeric value
    const numValue = parseFloat(stringValue.replace(/,/g, ''));

    if (isNaN(numValue)) {
      return {
        isValid: false,
        message: `${fieldName} must be a valid number`,
      };
    }

    if (min !== null && numValue < min) {
      return {
        isValid: false,
        message: `${fieldName} must be at least ${min}`,
      };
    }

    if (max !== null && numValue > max) {
      return {
        isValid: false,
        message: `${fieldName} cannot exceed ${max}`,
      };
    }
  }

  // Alphanumeric validation
  if (alphanumeric && !/^[a-zA-Z0-9\s]+$/.test(stringValue)) {
    return {
      isValid: false,
      message: `${fieldName} must contain only letters and numbers`,
    };
  }

  // Custom pattern validation
  if (pattern && !pattern.test(stringValue)) {
    return {
      isValid: false,
      message: `${fieldName} format is invalid`,
    };
  }

  // Length validations
  if (minLength && stringValue.length < minLength) {
    return {
      isValid: false,
      message: `${fieldName} must be at least ${minLength} characters`,
    };
  }

  if (maxLength && stringValue.length > maxLength) {
    return {
      isValid: false,
      message: `${fieldName} cannot exceed ${maxLength} characters`,
    };
  }

  // Text requirement (must contain at least one letter)
  if (rules.requiresText && !/[a-zA-Z]/.test(stringValue)) {
    return {
      isValid: false,
      message: `${fieldName} must contain at least some alphabetic characters`,
    };
  }

  return { isValid: true, message: '' };
};

export const validateFields = (fieldsConfig) => {
  const errors = {};
  let firstError = '';

  Object.entries(fieldsConfig).forEach(([fieldName, config]) => {
    const { value, label, rules } = config;
    const validation = validateField(label || fieldName, value, rules);

    if (!validation.isValid) {
      errors[fieldName] = validation.message;
      if (!firstError) {
        firstError = validation.message;
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    firstError,
  };
};