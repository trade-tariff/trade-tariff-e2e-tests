export default function validateTariffDate(daysAgo, lastUpdatedText) {
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  const formatted = date.toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return lastUpdatedText.includes(formatted);
}
