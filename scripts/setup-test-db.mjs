import { spawnSync } from "node:child_process";
import { testEnvironment } from "./test-env.mjs";

for (const suite of ["integration"]) {
  const result = spawnSync("npx", ["prisma", "db", "push"], {
    env: { ...process.env, ...testEnvironment(suite) }, stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
