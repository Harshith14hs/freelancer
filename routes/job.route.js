import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { getFreelancerJobs, getAllJobs, getJobById, postJob, updateJob, deleteJob, aiMatchJobs } from "../controllers/job.controller.js";
import { resumeUpload } from "../middlewares/mutler.js"; // Corrected import if needed, but usage is key

const router = express.Router();

router.route("/post").post(isAuthenticated, resumeUpload, postJob);
router.route("/get").get(getAllJobs); // Public - anyone can browse jobs
router.route("/mine").get(isAuthenticated, getFreelancerJobs);
router.route("/ai-match").post(aiMatchJobs); // Public - anyone can use AI matching
router.route("/get/:id").get(getJobById); // Public - anyone can view job details
router.route("/update/:id").put(isAuthenticated, resumeUpload, updateJob);
router.route("/delete/:id").delete(isAuthenticated, deleteJob);

export default router;
