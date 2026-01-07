import { Review } from "../models/review.model.js";
import { Job } from "../models/job.model.js";

export const submitReview = async (req, res) => {
    try {
        const recruiterId = req.id;
        const userRole = req.userRole; // Get user role from middleware
        const { jobId, rating, comment, title } = req.body;

        // Validate required fields
        if (!jobId || !rating || !comment || !title) {
            return res.status(400).json({
                message: "All fields are required (jobId, rating, comment, title)",
                success: false
            });
        }

        // Check if user is a recruiter
        if (userRole !== 'recruiter') {
            return res.status(403).json({
                message: "Only recruiters can write reviews",
                success: false
            });
        }

        // Validate rating
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                message: "Rating must be between 1 and 5",
                success: false
            });
        }

        // Validate comment length
        if (comment.length < 10 || comment.length > 500) {
            return res.status(400).json({
                message: "Comment must be between 10 and 500 characters",
                success: false
            });
        }

        // Validate title length
        if (title.length < 5 || title.length > 100) {
            return res.status(400).json({
                message: "Title must be between 5 and 100 characters",
                success: false
            });
        }

        // Find job and verify it exists
        const job = await Job.findById(jobId);
        
        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false
            });
        }

        // Check if review already exists for this job
        const existingReview = await Review.findOne({ job: jobId, recruiter: recruiterId });
        if (existingReview) {
            return res.status(400).json({
                message: "You have already written a review for this job",
                success: false
            });
        }

        // Create new review
        const review = await Review.create({
            job: jobId,
            recruiter: recruiterId,
            title,
            rating,
            comment
        });

        return res.status(201).json({
            message: "Review submitted successfully",
            success: true,
            review
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error submitting review",
            success: false
        });
    }
};

export const getJobReviews = async (req, res) => {
    try {
        const jobId = req.params.jobId;

        // Find all reviews for the job
        const reviews = await Review.find({ job: jobId })
            .populate({
                path: 'recruiter',
                select: 'fullname profile'
            })
            .sort({ createdAt: -1 });

        if (!reviews || reviews.length === 0) {
            return res.status(200).json({
                message: "No reviews found for this job",
                reviews: [],
                success: true
            });
        }

        return res.status(200).json({
            reviews,
            success: true
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error fetching reviews",
            success: false
        });
    }
};

export const getApplicationReview = async (req, res) => {
    try {
        const applicationId = req.params.applicationId;

        const review = await Review.findOne({ application: applicationId })
            .populate({
                path: 'recruiter',
                select: 'fullname profile'
            });

        if (!review) {
            return res.status(200).json({
                message: "No review found for this application",
                review: null,
                success: true
            });
        }

        return res.status(200).json({
            review,
            success: true
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error fetching review",
            success: false
        });
    }
};

export const updateReview = async (req, res) => {
    try {
        const recruiterId = req.id;
        const reviewId = req.params.reviewId;
        const { rating, comment, title } = req.body;

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({
                message: "Review not found",
                success: false
            });
        }

        // Check if reviewer is the one who wrote the review
        if (review.recruiter.toString() !== recruiterId.toString()) {
            return res.status(403).json({
                message: "Only the reviewer can update this review",
                success: false
            });
        }

        // Validate inputs
        if (rating && (rating < 1 || rating > 5)) {
            return res.status(400).json({
                message: "Rating must be between 1 and 5",
                success: false
            });
        }

        // Update fields
        if (rating) review.rating = rating;
        if (comment) review.comment = comment;
        if (title) review.title = title;

        await review.save();

        return res.status(200).json({
            message: "Review updated successfully",
            success: true,
            review
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error updating review",
            success: false
        });
    }
};

export const deleteReview = async (req, res) => {
    try {
        const recruiterId = req.id;
        const reviewId = req.params.reviewId;

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({
                message: "Review not found",
                success: false
            });
        }

        // Check if reviewer is the one who wrote the review
        if (review.recruiter.toString() !== recruiterId.toString()) {
            return res.status(403).json({
                message: "Only the reviewer can delete this review",
                success: false
            });
        }

        await Review.findByIdAndDelete(reviewId);

        return res.status(200).json({
            message: "Review deleted successfully",
            success: true
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error deleting review",
            success: false
        });
    }
};