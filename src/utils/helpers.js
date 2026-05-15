export const getDaysLeft = (dateStr) => {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export const getMilestoneProgress = (daysLeft, totalDays) => {
  if (!totalDays) return 0;
  return Math.min(100, Math.round(((totalDays - daysLeft) / totalDays) * 100));
};

export const sortByTimestamp = (docs) =>
  [...docs].sort((a, b) => {
    const tA = a.timestamp_generacion?.toMillis ? a.timestamp_generacion.toMillis() : 0;
    const tB = b.timestamp_generacion?.toMillis ? b.timestamp_generacion.toMillis() : 0;
    return tB - tA;
  });
