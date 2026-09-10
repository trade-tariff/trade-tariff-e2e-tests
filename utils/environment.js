const PRODUCTION_HOST = /www\.trade-tariff\.service\.gov\.uk/;

export function isProductionEnvironment(baseUrl = process.env.BASE_URL) {
  return PRODUCTION_HOST.test(baseUrl ?? "");
}
