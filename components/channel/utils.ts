/**
 * Formats a date string as a "time ago" relative time
 * e.g., "5 minutes ago", "yesterday", "2 weeks ago", etc.
 */
export const timeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Less than a minute
  if (secondsAgo < 60) {
    return 'just now';
  }
  
  // Less than an hour
  if (secondsAgo < 3600) {
    const minutes = Math.floor(secondsAgo / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  // Less than a day
  if (secondsAgo < 86400) {
    const hours = Math.floor(secondsAgo / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  // Less than a week
  if (secondsAgo < 604800) {
    const days = Math.floor(secondsAgo / 86400);
    if (days === 1) {
      return 'yesterday';
    }
    return `${days} days ago`;
  }
  
  // Less than a month
  if (secondsAgo < 2592000) {
    const weeks = Math.floor(secondsAgo / 604800);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
  
  // Less than a year
  if (secondsAgo < 31536000) {
    const months = Math.floor(secondsAgo / 2592000);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
  
  // More than a year
  const years = Math.floor(secondsAgo / 31536000);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}; 