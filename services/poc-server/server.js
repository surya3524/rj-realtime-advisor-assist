const http = require("http");
const fs = require("fs");
const path = require("path");
const { createSuggestion } = require("../advisor-copilot/grounding");

const rootDir = path.resolve(__dirname, "../..");
const publicDir = path.join(rootDir, "apps", "advisor-sidebar", "public");
const knowledgeBase = readJson(path.join(rootDir, "data", "approved-knowledge.json"));
const demoScript = readJson(path.join(rootDir, "data", "demo-call-script.json"));

const port = Number(process.env.PORT || 4173);
const clients = new Set();
let activeRun = null;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function broadcast(eventName, payload) {
  const body = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients) {
    client.write(body);
  }
}

function startDemo() {
  stopDemo();
  const startedAt = new Date().toISOString();
  activeRun = { timers: [], startedAt };

  broadcast("demo-status", {
    state: "started",
    startedAt,
    message: "Simulated Zoom transcript started."
  });

  demoScript.forEach((line, index) => {
    const timer = setTimeout(() => {
      const transcriptEvent = {
        id: index + 1,
        speaker: line.speaker,
        text: line.text,
        timestamp: new Date().toISOString()
      };

      broadcast("transcript", transcriptEvent);

      if (transcriptEvent.speaker === "Client") {
        const suggestion = createSuggestion(transcriptEvent, knowledgeBase);
        if (suggestion.status === "grounded") {
          broadcast("suggestion", suggestion);
        }
      }

      if (index === demoScript.length - 1) {
        broadcast("demo-status", {
          state: "completed",
          completedAt: new Date().toISOString(),
          message: "Simulated Zoom transcript completed."
        });
        activeRun = null;
      }
    }, index * 2200);

    activeRun.timers.push(timer);
  });
}

function stopDemo() {
  if (!activeRun) return;
  activeRun.timers.forEach(clearTimeout);
  activeRun = null;
  broadcast("demo-status", {
    state: "stopped",
    stoppedAt: new Date().toISOString(),
    message: "Simulated Zoom transcript stopped."
  });
}

function serveStatic(req, res) {
  const requestedPath = req.url === "/" ? "/index.html" : req.url;
  const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(publicDir, safePath);

  if (!filePath.startsWith(publicDir)) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(res, 404, { error: "Not found" });
      return;
    }

    const ext = path.extname(filePath);
    const contentTypes = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".svg": "image/svg+xml"
    };

    res.writeHead(200, {
      "Content-Type": contentTypes[ext] || "application/octet-stream"
    });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  if (req.url === "/api/knowledge") {
    sendJson(res, 200, knowledgeBase);
    return;
  }

  if (req.url === "/api/demo/start" && req.method === "POST") {
    startDemo();
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.url === "/api/demo/stop" && req.method === "POST") {
    stopDemo();
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.url === "/events") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    });
    res.write("event: connected\ndata: {\"ok\":true}\n\n");
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }

  serveStatic(req, res);
});

server.listen(port, () => {
  console.log(`RJ Realtime Advisor Assist POC running at http://localhost:${port}`);
});
