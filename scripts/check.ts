import { config } from "dotenv";
config({ path: ".env.local" });
(async () => {
  const { sql } = await import("../lib/db");
  if (!sql) { console.log("no sql"); return; }
  const presp = await sql`SELECT COUNT(*)::int AS n FROM pulse_responses`;
  const saud = await sql`SELECT COUNT(*)::int AS n FROM stress_test_audits WHERE created_by = 'public-link'`;
  const inv = await sql`SELECT token, status, used_at FROM stress_test_invites ORDER BY created_at DESC LIMIT 5`;
  console.log("Pulse responses:", presp);
  console.log("Stress public audits:", saud);
  console.log("Stress invites:", inv);
})();
