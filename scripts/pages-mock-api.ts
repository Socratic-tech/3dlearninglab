/**
 * Local stand-in for the Apps Script web app (runs apps-script/dist in-memory) for trying the Pages
 * edition without Google:  npx tsx scripts/pages-mock-api.ts   → http://localhost:8787
 * Seeds teacher@school.org (owner) and maya@school.org. Tokens are accepted without signature checks — dev only.
 */
import http from "node:http";
import { makeEnv } from "../tests/helpers/apps-script-env";

const env = makeEnv("teacher@school.org");
const p2 = env.call("teacher@school.org", "createClass", { name: "3D Design", section: "Period 2", pathId: "18-week" }).data.id;
const p5 = env.call("teacher@school.org", "createClass", { name: "STEAM Lab", section: "Period 5", pathId: "9-week" }).data.id;
env.call("teacher@school.org", "addStudents", { classId: p5, students: [{ email: "eli@school.org", name: "Eli Brooks" }] });
env.call("teacher@school.org", "addStudents", { classId: p2, students: [{ email: "maya@school.org", name: "Maya Okafor" }, { email: "luis@school.org", name: "Luis Hernández" }] });
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
