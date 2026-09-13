const express = require("express");
const {
  getJobs,
  getJobsForAdmin,
  getJobById,
  createJob,
  updateJob,
  deleteJob
} = require("../controllers/jobController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Public
router.get("/", getJobs);

// Private — placed before "/:id" so "admin" isn't swallowed as a job id
router.get("/admin/all", protect, getJobsForAdmin);

router.get("/:id", getJobById);

// Private (admin only)
router.post("/", protect, createJob);
router.put("/:id", protect, updateJob);
router.delete("/:id", protect, deleteJob);

module.exports = router;
