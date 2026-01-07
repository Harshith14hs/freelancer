import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    paymentId: {
        type: String,
        default: null
    },
    signature: {
        type: String,
        default: null
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    applicationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application',
        required: true
    },
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'netbanking', 'upi', 'wallet', 'emi'],
        default: null
    },
    description: {
        type: String,
        required: true
    },
    customerEmail: {
        type: String,
        required: true
    },
    customerPhone: {
        type: String,
        required: true
    },
    notes: {
        type: Map,
        of: String,
        default: {}
    },
    receipt: {
        type: String,
        default: null
    },
    refundId: {
        type: String,
        default: null
    },
    refundAmount: {
        type: Number,
        default: null
    },
    refundDate: {
        type: Date,
        default: null
    },
    errorMessage: {
        type: String,
        default: null
    }
}, { timestamps: true });

paymentSchema.index({ userId: 1 });
paymentSchema.index({ applicationId: 1 });
paymentSchema.index({ status: 1 });

export const Payment = mongoose.model("Payment", paymentSchema);