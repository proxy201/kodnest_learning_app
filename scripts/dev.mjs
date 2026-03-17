import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const services = [
  {
    name: "backend",
    args: ["--workspace", "backend", "run", "dev"]
  },
  {
    name: "frontend",
    args: ["--workspace", "frontend", "run", "dev"]
  }
];

let shuttingDown = false;

const writePrefixed = (name, chunk, stream) => {
  const text = chunk.toString();
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    if (!line) {
      continue;
    }

    stream.write(`[${name}] ${line}\n`);
  }
};

const children = services.map((service) => {
  const child = spawn(npmCommand, service.args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: ["inherit", "pipe", "pipe"]
  });

  child.stdout.on("data", (chunk) => writePrefixed(service.name, chunk, process.stdout));
  child.stderr.on("data", (chunk) => writePrefixed(service.name, chunk, process.stderr));

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;

    for (const sibling of children) {
      if (sibling.pid && sibling.pid !== child.pid) {
        sibling.kill("SIGTERM");
      }
    }

    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });

  return child;
});

const shutdown = (signal) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    if (child.pid) {
      child.kill(signal);
    }
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
