export const formatCurrency = (paise, currency = "INR") => {
  if (paise === null || paise === undefined) return "₹0";
  const inr = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 2,
  }).format(inr);
};

export const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return "0 mins";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins > 0 ? `${mins}m` : ""}`.trim();
  }
  if (mins > 0) {
    return `${mins}m ${secs > 0 ? `${secs}s` : ""}`.trim();
  }
  return `${secs}s`;
};

export const formatDate = (isoString) => {
  if (!isoString) return "-";
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return isoString;
  }
};
