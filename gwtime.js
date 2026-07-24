function getBeat(date = new Date()) {
  const utcSeconds =
    date.getUTCHours() * 3600 +
    date.getUTCMinutes() * 60 +
    date.getUTCSeconds();

  const bmtSeconds = (utcSeconds + 3600) % 86400;
  const beat = Math.floor(bmtSeconds / 86.4);

  return String(beat).padStart(3, "0");
}

function formatTime(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).formatToParts(date);

  const hour = parts.find(p => p.type === "hour")?.value ?? "";
  const minute = parts.find(p => p.type === "minute")?.value ?? "";
  const ampm = (parts.find(p => p.type === "dayPeriod")?.value ?? "").toLowerCase();

  return `${hour}:${minute}${ampm}`;
}

function buildTimeText(date = new Date()) {
  return [
    `GWTime @${getBeat(date)}`,
    ``,
    `CST: ${formatTime(date, "America/Chicago")}`,
    `EST: ${formatTime(date, "America/New_York")}`,
    `UTC: ${formatTime(date, "UTC")}`
  ].join("\n");
}

module.exports = {
  getBeat,
  formatTime,
  buildTimeText
};