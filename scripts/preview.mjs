import { spawn } from "node:child_process";

const port = String(process.env.PORT || "3000");
const host = String(process.env.HOST || "0.0.0.0");

const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
const child = spawn(npxCmd, ["vite", "preview", "--host", host, "--port", port], {
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (typeof code === "number") process.exit(code);
  if (signal) process.exit(1);
  process.exit(1);
});
