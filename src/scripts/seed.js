/**
 * Seed script — run with: npm run seed
 * Populates the database with:
 *  1. The sample jobs from src/data/jobs.seed.json
 *  2. One admin account, using ADMIN_USERNAME / ADMIN_PASSWORD / ADMIN_NAME from .env
 *
 * Safe to re-run: jobs are upserted by their slug `id`, and the admin is
 * only created if a matching username doesn't already exist — it will
 * NOT overwrite an existing admin's password.
 *
 * Run `npm run seed:destroy` to wipe all jobs (admins are left untouched).
 */

require("dotenv").config();
const path = require("path");
const connectDB = require("../config/db");
const Job = require("../models/Job");
const Admin = require("../models/Admin");
const jobs = require(path.join(__dirname, "..", "data", "jobs.seed.json"));

async function seedJobs() {
  let created = 0;
  let updated = 0;

  for (const job of jobs) {
    const result = await Job.findOneAndUpdate(
      { id: job.id },
      { $set: job },
      { upsert: true, new: true, rawResult: true, setDefaultsOnInsert: true }
    );
    if (result.lastErrorObject && result.lastErrorObject.updatedExisting) {
      updated++;
    } else {
      created++;
    }
  }

  console.log(`[seed] Jobs — created: ${created}, updated: ${updated}`);
}

async function seedAdmin() {
  const username = (process.env.ADMIN_USERNAME || "").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Admin";

  if (!username || !password) {
    console.warn("[seed] ADMIN_USERNAME / ADMIN_PASSWORD not set — skipping admin creation");
    return;
  }

  const existing = await Admin.findOne({ username });
  if (existing) {
    console.log(`[seed] Admin "${username}" already exists — leaving password unchanged`);
    return;
  }

  await Admin.create({ username, password, name });
  console.log(`[seed] Created admin account "${username}"`);
}

async function destroyJobs() {
  const result = await Job.deleteMany({});
  console.log(`[seed] Deleted ${result.deletedCount} job(s)`);
}

(async () => {
  await connectDB();

  if (process.argv.includes("--destroy")) {
    await destroyJobs();
  } else {
    await seedJobs();
    await seedAdmin();
  }

  process.exit(0);
})().catch(err => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
