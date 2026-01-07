import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { 
    submitReview, 
    getJobReviews, 
    getApplicationReview, 
    deleteReview, 
    updateReview 
} from "../controllers/review.controller.js";

const router = express.Router();

// Submit a new review
router.route("/submit").post(isAuthenticated, submitReview);

// Get all reviews for a job
router.route("/job/:jobId").get(getJobReviews);

// Get review for a specific application
router.route("/application/:applicationId").get(getApplicationReview);

// Update a review
router.route("/update/:reviewId").put(isAuthenticated, updateReview);

// Delete a review
router.route("/delete/:reviewId").delete(isAuthenticated, deleteReview);

export default router;