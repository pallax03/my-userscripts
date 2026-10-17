import http from "http";
import fs from "fs";
import path from "path";

const PORT = 9876;
const LOG_DIR = path.resolve(".logs");
const LOG_FILE = path.join(LOG_DIR, "browser.log");

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Clear or initialize log file
fs.writeFileSync(LOG_FILE, `=== Log Server Started at ${new Date().toISOString()} ===\n`);

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/log") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        const time = new Date().toLocaleTimeString();
        const line = `[${time}] [${payload.level || "INFO"}] ${payload.message || ""}${payload.data ? " " + JSON.stringify(payload.data) : ""}\n`;
        process.stdout.write(line);
        fs.appendFileSync(LOG_FILE, line);
      } catch (_) {
        fs.appendFileSync(LOG_FILE, `[RAW] ${body}\n`);
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end('{"status":"ok"}');
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`📡 Log bridge listening on http://127.0.0.1:${PORT}`);
  console.log(`📝 Writing logs to ${LOG_FILE}`);
});
