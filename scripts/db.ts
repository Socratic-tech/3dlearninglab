/**
 * Database CLI.
 *   npm run db:migrate                         apply migrations (DATABASE_URL, or local PGlite)
 *   npm run db:seed                            seed the demo organization if the database is empty
 *   npm run db:seed -- --reset-demo            delete and recreate the demo organization
 *   npm run db:seed -- --org "Name" --staff-domain district.org --student-domain students.district.org --admin you@district.org
 */
import path from "node:path";
import { parseArgs } from "node:util";

async function main() {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      "reset-demo": { type: "boolean" },
      org: { type: "string" },
      "staff-domain": { type: "string" },
      "student-domain": { type: "string" },
      admin: { type: "string" },
    },
  });
  const cmd = positionals[0];
  const url = process.env.DATABASE_URL;
  let db;
  let close = async () => {};
  if (url) {
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    const postgres = (await import("postgres")).default;
    const client = postgres(url, { prepare: false, max: 1 });
    const schema = await import("../src/server/db/schema");
    db = drizzle(client, { schema });
    close = () => client.end();
    if (cmd === "migrate") {
      await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
      console.log("Migrations applied.");
    }
  } else {
    const { createPgliteDb } = await import("../src/server/db/pglite");
    db = await createPgliteDb(process.env.PGLITE_DIR ?? ".data/pglite");
    if (cmd === "migrate") console.log("Migrations applied to local PGlite database.");
  }
  if (cmd === "seed") {
    const seed = await import("../src/server/db/seed");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyDb = db as any;
    if (values.org) {
      const org = await seed.createOrganization(anyDb, { name: values.org, staffDomain: values["staff-domain"], studentDomain: values["student-domain"], adminEmail: values.admin });
      console.log(`Created organization ${org.name} (${org.id}).`);
    } else if (values["reset-demo"]) {
      await seed.resetDemo(anyDb);
      console.log("Demo organization reset.");
    } else {
      await seed.ensureSeeded(anyDb);
      console.log("Seed complete (demo data is only added to an empty database).");
    }
  }
  await close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
