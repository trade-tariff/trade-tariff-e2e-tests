const Ajv = require("ajv");
const ajv = new Ajv({ allErrors: true });
const schema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "data": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "type": { "type": "string" }
      },
      "required": ["id", "type"],
      "additionalProperties": true
    },
    "included": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "type": { "type": "string" }
        },
        "required": ["id", "type"],
        "additionalProperties": true
      }
    }
  },
  "required": ["data", "included"],
  "additionalProperties": true
};

export const validate = ajv.compile(schema);
