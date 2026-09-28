import passwordlessLogout from "./utils/passwordlessLogout.js";
import { wafBypassHeaders } from "./utils/wafBypassHeaders.js";

export default async function globalTeardown() {
  if (process.env.SKIP_PASSWORDLESS !== "true") {
    await passwordlessLogout(process.env.DEV_HUB_URL, {
      headers: wafBypassHeaders(),
    });
  }
}
