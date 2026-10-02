/**
 * Local stand-in for the Apps Script web app (runs apps-script/dist in-memory) for trying the Pages
 * edition without Google:  npx tsx scripts/pages-mock-api.ts   → http://localhost:8787
 * Seeds teacher@school.org (owner) and maya@school.org. Tokens are accepted without signature checks — dev only.
 */
import http from "node:http";
import { makeEnv } from "../tests/helpers/apps-script-env";

const env = makeEnv("teacher@school.org");
env.call("teacher@school.org", "addStudents", { students: [{ email: "maya@school.org", name: "Maya Okafor" }, { email: "luis@school.org", name: "Luis Hernández" }] });
http
  .createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (req.method !== "POST") return res.end(JSON.stringify({ ok: true }));
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      res.setHeader("Content-Type", "application/json");
      res.end(env.raw(body));
    });
  })
  .listen(8787, () => console.log("Mock Apps Script API on http://localhost:8787"));
