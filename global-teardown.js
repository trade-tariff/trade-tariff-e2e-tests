import fs from "node:fs/promises";
import path from "node:path";
import adminLogout from "./utils/adminLogout.js";
import { runAdmin } from "./utils/projectArgs.js";
import { wafBypassHeaders } from "./utils/wafBypassHeaders.js";

const authStatePath = path.resolve(
  import.meta.dirname,
  "../",
  "playwright",
  ".auth",
);

export default async function globalTeardown() {
  if (!runAdmin()) return;

  await adminLogout(process.env.ADMIN_URL, {
    headers: wafBypassHeaders(),
  });

  try {
    if (process.env.KEEP_AUTH) return;
    await fs.rm(path.join(authStatePath, "admin.json"), { force: true });
  } catch (error) {
    console.warn("Could not remove auth state:", error);
  }
}
