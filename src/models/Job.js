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

const baseSalarySchema = new mongoose.Schema(
  {
    min: { type: Number },
    max: { type: Number },
    period: { type: String, default: "MONTHLY", trim: true }, // e.g. MONTHLY, YEARLY — matches schema.org unitText conventions
    label: { type: String, default: "", trim: true } // display string, e.g. "₹25,500 – ₹81,100 per month (Pay Level 4–7)"
  },
  { _id: false }
);

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true }
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
    // SEO fields — used for meta descriptions, JobPosting/FAQPage structured
    // data, and richer job-details content. All optional so existing jobs
    // and API consumers keep working if a listing doesn't set them yet.
    shortDescription: { type: String, default: "", trim: true },
    dateModified: { type: String, trim: true },
    baseSalary: { type: baseSalarySchema }, // left unset (not an empty object) when a job has no salary data
    faqs: { type: [faqSchema], default: [] },
    isPublished: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }
  },
  { timestamps: true }
);

// Text index to support ?search= across the fields job seekers care about most
jobSchema.index({ title: "text", department: "text", location: "text" });

module.exports = mongoose.model("Job", jobSchema);
