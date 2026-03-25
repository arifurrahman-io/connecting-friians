/**
 * Converts a Firebase Timestamp or Date into a human-readable string.
 * High-performance version with future-date protection.
 */
export function formatTimeAgo(date) {
  if (!date) return "";

  // 1. Convert Firebase Timestamp or String to JS Date object
  const jsDate = date?.toDate ? date.toDate() : new Date(date);

  // Validate date to prevent "Invalid Date" UI errors
  if (isNaN(jsDate.getTime())) return "";

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - jsDate.getTime()) / 1000);

  // Handle system clock desync (future dates)
  if (diffInSeconds < 0) return "Just now";

  // 2. Time Logic Intervals
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  // 3. Return dynamic strings
  if (diffInSeconds < intervals.minute) {
    return "Just now";
  }

  if (diffInSeconds < intervals.hour) {
    const mins = Math.floor(diffInSeconds / intervals.minute);
    return `${mins}m ago`;
  }

  if (diffInSeconds < intervals.day) {
    const hours = Math.floor(diffInSeconds / intervals.hour);
    return `${hours}h ago`;
  }

  if (diffInSeconds < intervals.week) {
    const days = Math.floor(diffInSeconds / intervals.day);
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  }

  if (diffInSeconds < intervals.month) {
    const weeks = Math.floor(diffInSeconds / intervals.week);
    return `${weeks}w ago`;
  }

  // 4. For older dates, show the actual date (e.g., "Oct 11")
  // Using 'short' month for better fit in narrow Bento cards
  return jsDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: jsDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}
