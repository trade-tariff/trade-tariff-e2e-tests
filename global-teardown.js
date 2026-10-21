import passwordlessLogout from "./utils/passwordlessLogout.js";
import { wafBypassHeaders } from "./utils/wafBypassHeaders.js";
import { needsLogin } from "./utils/projectArgs.js";

export default async function globalTeardown() {
  if (needsLogin()) {
    if (process.env.SKIP_PASSWORDLESS !== "true") {
      await passwordlessLogout(
        process.env.DEV_HUB_URL || process.env.ADMIN_URL,
        {
          headers: wafBypassHeaders(),
        },
      );
    }
  }
}
