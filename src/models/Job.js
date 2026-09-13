const mongoose = require("mongoose");

const feesSchema = new mongoose.Schema(
  {
    general: { type: Number, default: 0, min: 0 },
    obcEws: { type: Number, default: 0, min: 0 },
    scStPwd: { type: Number, default: 0, min: 0 },
    female: { type: Number, default: 0, min: 0 },
    paymentMode: { type: String, default: "", trim: true }
  },
  { _id: false }
);

const ageLimitSchema = new mongoose.Schema(
  {
    min: { type: Number },
    max: { type: Number },
    relaxation: { type: String, default: "", trim: true }
  },
  { _id: false }
);

const importantDatesSchema = new mongoose.Schema(
  {
    notificationDate: { type: String, trim: true },
    applicationStart: { type: String, trim: true },
    applicationEnd: { type: String, required: [true, "Application end date is required"], trim: true },
    lastDateFeePayment: { type: String, trim: true },
    tier1ExamDate: { type: String, trim: true },
    admitCardDate: { type: String, trim: true }
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema(
  {
    // URL-friendly unique identifier, e.g. "ssc-cgl-2026" — this is what the
    // frontend uses in job-details.html?id=...
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    title: { type: String, required: [true, "Title is required"], trim: true },
    department: { type: String, required: [true, "Department is required"], trim: true },
    category: { type: String, required: [true, "Category is required"], trim: true },
    location: { type: String, required: [true, "Location is required"], trim: true },
    vacancies: { type: Number, required: [true, "Vacancies is required"], min: 0 },
    postNames: { type: [String], default: [] },
    fees: { type: feesSchema, default: () => ({}) },
    ageLimit: { type: ageLimitSchema, default: () => ({}) },
    importantDates: { type: importantDatesSchema, required: true },
    eligibility: { type: [String], default: [] },
    howToApply: { type: [String], default: [] },
    description: { type: String, required: [true, "Description is required"], trim: true },
    applyLink: { type: String, required: [true, "Apply link is required"], trim: true },
    officialWebsite: { type: String, required: [true, "Official website is required"], trim: true },
    notificationPdf: { type: String, default: "", trim: true },
    selectionProcess: { type: [String], default: [] },
    examPattern: { type: String, default: "", trim: true },
    isPublished: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }
  },
  { timestamps: true }
);

// Text index to support ?search= across the fields job seekers care about most
jobSchema.index({ title: "text", department: "text", location: "text" });

module.exports = mongoose.model("Job", jobSchema);
