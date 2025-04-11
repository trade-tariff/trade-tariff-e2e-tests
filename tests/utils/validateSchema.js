import Ajv from "ajv";
import schema from "tests/schemas/jsonapi.json" assert { type: "json" }; // This is required for ES module

const ajv = new Ajv({ allErrors: true });
const validateJsonApiResponse = ajv.compile(schema);

export function validate(json) {
  const valid = validateJsonApiResponse(json);
  if (!valid) {
    console.error(validateJsonApiResponse.errors);
    throw new Error("Schema validation failed");
  }
}
