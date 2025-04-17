import { validate } from "../utils/validateSchema";

export async function validateApi(request, path) {
  const res = await request.get(path);
  const json = await res.json();

  return validate(json);
}
