/**
 * Format a date string to a readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Format a date string to a short readable format (no time)
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
export const formatDateShort = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Format a date string to relative time (e.g., "2 hours ago")
 * @param {string} dateString - ISO date string
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    // Handle future dates
    if (diffInSeconds < 0) {
      return 'In the future';
    }
    
    // Less than a minute
    if (diffInSeconds < 60) {
      return 'Just now';
    }
    
    // Less than an hour
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    
    // Less than a day
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    
    // Less than a month (30 days)
    if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
    
    // Less than a year
    if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} month${months !== 1 ? 's' : ''} ago`;
    }
    
    // More than a year
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years} year${years !== 1 ? 's' : ''} ago`;
    
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Unknown time';
  }
};

/**
 * Format a date for input fields (YYYY-MM-DD)
 * @param {string|Date} date - Date string or Date object
 * @returns {string} Formatted date string for input
 */
export const formatDateForInput = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    return dateObj.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
};

/**
 * Get the start of day for a given date
 * @param {string|Date} date - Date string or Date object
 * @returns {Date} Start of day Date object
 */
export const getStartOfDay = (date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setHours(0, 0, 0, 0);
  return dateObj;
};

/**
 * Get the end of day for a given date
 * @param {string|Date} date - Date string or Date object
 * @returns {Date} End of day Date object
 */
export const getEndOfDay = (date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setHours(23, 59, 59, 999);
  return dateObj;
};

/**
 * Check if a date is today
 * @param {string|Date} date - Date string or Date object
 * @returns {boolean} True if date is today
 */
export const isToday = (date) => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    
    return dateObj.toDateString() === today.toDateString();
  } catch (error) {
    return false;
  }
};

/**
 * Check if a date is yesterday
 * @param {string|Date} date - Date string or Date object
 * @returns {boolean} True if date is yesterday
 */
export const isYesterday = (date) => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return dateObj.toDateString() === yesterday.toDateString();
  } catch (error) {
    return false;
  }
};

/**
 * Format a date with smart relative formatting
 * Shows "Today", "Yesterday", or formatted date
 * @param {string} dateString - ISO date string
 * @returns {string} Smart formatted date string
 */
export const formatDateSmart = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    if (isToday(date)) {
      return `Today, ${date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    }
    
    if (isYesterday(date)) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    }
    
    // For older dates, show full date
    return formatDate(dateString);
    
  } catch (error) {
    console.error('Error in smart date formatting:', error);
    return 'Invalid Date';
  }
};

/**
 * Calculate days between two dates
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {number} Number of days between dates
 */
export const daysBetween = (startDate, endDate) => {
  try {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    const diffInTime = end.getTime() - start.getTime();
    return Math.ceil(diffInTime / (1000 * 3600 * 24));
  } catch (error) {
    console.error('Error calculating days between dates:', error);
    return 0;
  }
};

/**
 * Get a human-readable time duration
 * @param {number} milliseconds - Duration in milliseconds
 * @returns {string} Human-readable duration
 */
export const formatDuration = (milliseconds) => {
  if (!milliseconds || milliseconds < 0) return '0ms';
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else if (seconds > 0) {
    return `${seconds}s`;
  } else {
    return `${milliseconds}ms`;
  }
};

/**
 * Get current timestamp in ISO format
 * @returns {string} Current timestamp
 */
export const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Get current date in YYYY-MM-DD format
 * @returns {string} Current date
 */
export const getCurrentDate = () => {
  return formatDateForInput(new Date());
};

/**
 * Parse a date string safely
 * @param {string} dateString - Date string to parse
 * @returns {Date|null} Parsed date or null if invalid
 */
export const safeParseDate = (dateString) => {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};