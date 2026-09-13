const asyncHandler = require("express-async-handler");
const Job = require("../models/Job");
const slugify = require("../utils/slugify");

const REQUIRED_FIELDS = [
  "title",
  "department",
  "category",
  "location",
  "vacancies",
  "description",
  "applyLink",
  "officialWebsite"
];

function validateJobPayload(body) {
  const missing = REQUIRED_FIELDS.filter(field => {
    const value = body[field];
    return value === undefined || value === null || value === "";
  });
  if (!body.importantDates || !body.importantDates.applicationEnd) {
    missing.push("importantDates.applicationEnd");
  }
  return missing;
}

// @desc    Get all jobs (public) — supports filtering, search, sorting, pagination
// @route   GET /api/jobs?category=&search=&sort=latest|closing|vacancies&page=&limit=
// @access  Public
const getJobs = asyncHandler(async (req, res) => {
  const { category, search, sort = "latest", page = 1, limit = 50 } = req.query;

  const query = { isPublished: true };
  if (category && category !== "All") query.category = category;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { department: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } }
    ];
  }

  const sortMap = {
    latest: { "importantDates.notificationDate": -1 },
    closing: { "importantDates.applicationEnd": 1 },
    vacancies: { vacancies: -1 }
  };

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);

  const [jobs, total] = await Promise.all([
    Job.find(query)
      .sort(sortMap[sort] || sortMap.latest)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Job.countDocuments(query)
  ]);

  res.json({
    success: true,
    count: jobs.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: jobs
  });
});

// @desc    Get all jobs for the admin dashboard (includes unpublished)
// @route   GET /api/jobs/admin/all
// @access  Private
const getJobsForAdmin = asyncHandler(async (req, res) => {
  const jobs = await Job.find({}).sort({ createdAt: -1 });
  res.json({ success: true, count: jobs.length, data: jobs });
});

// @desc    Get a single job by its slug id
// @route   GET /api/jobs/:id
// @access  Public
const getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findOne({ id: req.params.id.toLowerCase() });
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }
  res.json({ success: true, data: job });
});

// @desc    Create a new job
// @route   POST /api/jobs
// @access  Private (admin)
const createJob = asyncHandler(async (req, res) => {
  const missing = validateJobPayload(req.body);
  if (missing.length > 0) {
    res.status(400);
    throw new Error(`Missing required field(s): ${missing.join(", ")}`);
  }

  let slug = req.body.id ? slugify(req.body.id) : slugify(req.body.title);
  if (!slug) {
    res.status(400);
    throw new Error("Could not generate a valid id/slug from the title provided");
  }

  // Ensure uniqueness — append a numeric suffix if the slug is already taken
  let candidate = slug;
  let suffix = 1;
  while (await Job.exists({ id: candidate })) {
    candidate = `${slug}-${suffix++}`;
  }

  const job = await Job.create({
    ...req.body,
    id: candidate,
    createdBy: req.admin._id
  });

  res.status(201).json({ success: true, data: job });
});

// @desc    Update an existing job (partial update)
// @route   PUT /api/jobs/:id
// @access  Private (admin)
const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findOne({ id: req.params.id.toLowerCase() });
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  // Prevent the slug id from being changed via this route to avoid breaking
  // links already shared/indexed — creating a new job is the intended path
  // if a genuinely new id is needed.
  const { id, ...updates } = req.body;

  Object.assign(job, updates);
  await job.save();

  res.json({ success: true, data: job });
});

// @desc    Delete a job
// @route   DELETE /api/jobs/:id
// @access  Private (admin)
const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findOneAndDelete({ id: req.params.id.toLowerCase() });
  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }
  res.json({ success: true, data: { id: job.id, message: "Job deleted" } });
});

module.exports = {
  getJobs,
  getJobsForAdmin,
  getJobById,
  createJob,
  updateJob,
  deleteJob
};
