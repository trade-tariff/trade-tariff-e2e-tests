import { validate } from "../utils/validateSchema";
import { retryOnTransientStatus } from "./retryOnTransientStatus.js";

export async function validateApi(request, path, retryOptions) {
  return retryOnTransientStatus(async () => {
    const res = await request.get(path);

    if (!res.ok()) {
      const body = (await res.text()).slice(0, 200);
      const error = new Error(`${path} returned ${res.status()}: ${body}`);
      error.status = res.status();
      throw error;
    }

    const json = await res.json();

    return validate(json);
  }, retryOptions);
}
