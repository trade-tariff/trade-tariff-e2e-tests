import { validate } from "../utils/validateSchema";

export async function validateApi(request, path, headers = {}) {
  const res = await request.get(path, { headers });
  const json = await res.json();

  return validate(json);
}
