const PRODUCTION_HOSTNAME = "www.trade-tariff.service.gov.uk";

function hostnameOf(baseUrl) {
  if (!baseUrl) {
    return "";
  }

  try {
    return new URL(baseUrl).hostname.toLowerCase();
  } catch {
    // A value that will not parse is compared as though it were a bare host,
    // so a malformed production URL still reads as production. Getting this
    // wrong in the other direction runs the production-skipped journeys,
    // which delete Cognito users and send real email.
    return baseUrl.trim().toLowerCase();
  }
}

export function isProductionEnvironment(baseUrl = process.env.BASE_URL) {
  return hostnameOf(baseUrl) === PRODUCTION_HOSTNAME;
}
