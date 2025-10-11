/**
 * Formats a week interval string from DD/MM-DD/MM/YY to readable format
 * @param interval - String in format "15/09-21/09/25"
 * @returns Formatted string like "15 Sep - 21 Sep 2025"
 */
export const formatInterval = (interval: string): string => {
  try {
    const parts = interval.split('-');
    if (parts.length !== 2) return interval;
    
    const startParts = parts[0].split('/');
    const endParts = parts[1].split('/');
    
    if (startParts.length !== 2 || endParts.length !== 3) return interval;
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const startDay = startParts[0];
    const startMonth = months[parseInt(startParts[1]) - 1];
    const endDay = endParts[0];
    const endMonth = months[parseInt(endParts[1]) - 1];
    const year = `20${endParts[2]}`;
    
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
  } catch (error) {
    return interval;
  }
};
