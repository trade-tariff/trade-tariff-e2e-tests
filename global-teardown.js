import passwordlessLogout from "./utils/passwordlessLogout.js";
import { wafBypassHeaders } from "./utils/wafBypassHeaders.js";
import { authedProjectsToRun } from "./utils/projectArgs.js";

export default async function globalTeardown() {
  for (const { name, url } of authedProjectsToRun()) {
    await passwordlessLogout(name, url, { headers: wafBypassHeaders() });
  }
}
