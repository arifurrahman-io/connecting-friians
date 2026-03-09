export function timeAgo(timestamp) {
  if (!timestamp) return "";

  const date = timestamp?.seconds
    ? new Date(timestamp.seconds * 1000)
    : new Date(timestamp);

  const seconds = Math.floor((new Date() - date) / 1000);

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);

  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}
