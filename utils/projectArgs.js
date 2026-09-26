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

export function runAdmin() {
  const projects = projectArgs();

  if (isProductionEnvironment()) return false;

  // no filter, so run admin too
  if (projects.length === 0) return true;

  return projects.includes("admin");
}
