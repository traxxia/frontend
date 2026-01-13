export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';

  try {
    const dateObj = new Date(dateString);

    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }

    const options = {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };

    return dateObj.toLocaleString('en-GB', options).replace(',', '');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};
