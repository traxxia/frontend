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
            error: `"${trimmedText}" contains too many numbers or special characters. Please use meaningful text.`
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
