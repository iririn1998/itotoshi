import * as http from "node:http";

/** ローカル開発時の既定ポート（`PORT` で上書き可能）。 */
const DEFAULT_PORT = 8787;
const PORT = Number(process.env.PORT ?? DEFAULT_PORT);

const server = http.createServer((req, res) => {
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true, service: "itotoshi-backend" }));
    return;
  }
  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`backend listening on http://localhost:${PORT}`);
});
