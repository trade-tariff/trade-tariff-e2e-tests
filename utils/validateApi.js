import { validate } from "../utils/validateSchema";

export async function validateApi(request, path) {
  const res = await request.get(path);

  if (!res.ok()) {
    const body = (await res.text()).slice(0, 200);
    throw new Error(`${path} returned ${res.status()}: ${body}`);
  }

  const json = await res.json();

  return validate(json);
}
