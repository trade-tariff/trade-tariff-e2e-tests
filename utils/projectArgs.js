import { isProductionEnvironment } from "./environment.js";

const AUTHED_PROJECTS = {
  admin: {
    skipVar: "SKIP_ADMIN",
    urlVar: "ADMIN_URL",
    signedInText: /you are signed in/i,
  },
  "dev-hub": {
    skipVar: "SKIP_DEV_HUB",
    urlVar: "DEV_HUB_URL",
    signedInText: /your organisation/i,
  },
  myott: {
    skipVar: "SKIP_MYOTT",
    urlVar: "MYOTT_URL",
    signedInText: /your tariff watch lists/i,
  },
};

export function authFileFor(name) {
  return `playwright/.auth/${name}.json`;
}

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

export function authedProjectsToRun() {
  return Object.entries(AUTHED_PROJECTS)
    .filter(([name, { skipVar }]) =>
      runProject(name, { skipVars: [skipVar, "SKIP_PASSWORDLESS"] }),
    )
    .map(([name, { urlVar, signedInText }]) => ({
      name,
      url: process.env[urlVar],
      signedInText,
    }));
}
