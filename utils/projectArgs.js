import { isProductionEnvironment } from "./environment.js";

function projectArgs() {
  const projects = [];

  for (let index = 0; index < process.argv.length; index += 1) {
    const argument = process.argv[index];

    if (argument === "--project" && process.argv[index + 1]) {
      projects.push(process.argv[index + 1]);
      index += 1;
    } else if (argument.startsWith("--project=")) {
      projects.push(argument.slice("--project=".length));
    }
  }

  return projects;
}

export function runProject(name, { skipProd = true, skipVars = [] } = {}) {
  const projects = projectArgs();

  if (skipProd && isProductionEnvironment()) return false;

  // multiple things might skip a test, skipping the project
  // or passwordless flow are two skip vars but either being true
  // will skip a project that uses passwordless
  for (const env of skipVars) {
    if (process.env[env] === "true") return false;
  }

  if (projects.length === 0) return true;

  return projects.includes(name);
}
