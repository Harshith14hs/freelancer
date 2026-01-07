import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { applyJob, getApplicants, getAppliedJobs, updateStatus, getApplicationById, markPaymentCompleted, getRecruiterHiredApplicants, deleteApplication } from "../controllers/application.controller.js";
 
const router = express.Router();

router.route("/apply/:id").get(isAuthenticated, applyJob);
router.route("/get/appliedjobs").get(isAuthenticated, getAppliedJobs);
router.route("/get/application/:id").get(isAuthenticated, getApplicationById);
router.route("/:id/applicants").get(isAuthenticated, getApplicants);
router.route("/status/:id/update").post(isAuthenticated, updateStatus);
router.route("/payment/:id/completed").post(isAuthenticated, markPaymentCompleted);
router.route("/recruiter/hired-applicants").get(isAuthenticated, getRecruiterHiredApplicants);
router.route("/delete/:id").delete(isAuthenticated, deleteApplication);
 

export default router;
