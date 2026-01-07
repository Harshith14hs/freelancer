import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true,
    },
    recruiter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // The recruiter writing the review
        required: true,
    },
    application: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application',
    },
    title: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 100,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 500,
    },
}, { timestamps: true });

export const Review = mongoose.model("Review", reviewSchema);