// run the server for CLI
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parse } from "dotenv";
import { config as loadEnv } from "dotenv";
loadEnv()



// Le saque ese script
// "build": "npx -y bun scripts/build.mjs",

const configPath = fileURLToPath(
  new URL(
    process.argv.findLast((arg) => arg.endsWith(".json")) ??
      "./graphs/langgraph.json",
    import.meta.url,
  ),
);
const config = JSON.parse(await readFile(configPath, "utf-8"));

let env = {} as NodeJS.ProcessEnv;
if (typeof config.env === "string") {
  const targetEnvFile = resolve(dirname(configPath), config.env);
  env = parse(await readFile(targetEnvFile, "utf-8")) as NodeJS.ProcessEnv;
} else if (config.env != null) {
  env = config.env;
}

const { spawnServer } = (
  process.argv.includes("--dev")
    ? await import("../src/cli/spawn.mjs")
    : // @ts-ignore May not exist
      await import("../dist/cli/spawn.mjs")
) as typeof import("../src/cli/spawn.mjs");

await spawnServer(
  { port: process.env.PORT || "8080" , nJobsPerWorker: "10", host: "0.0.0.0" },
  { config, env, hostUrl: "https://smith.langchain.com" },
  { pid: process.pid, projectCwd: dirname(configPath) },
);
