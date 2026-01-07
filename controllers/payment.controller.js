import Razorpay from "razorpay";
import crypto from "crypto";
import { Payment } from "../models/payment.model.js";
import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ CREATE ORDER - Initial step for payment
export const createOrder = async (req, res) => {
    try {
        const { applicationId, jobId, amount } = req.body;
        const userId = req.id;

        // Validate input
        if (!applicationId || !jobId || !amount) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: applicationId, jobId, amount"
            });
        }

        // Validate amount (minimum 1 rupee)
        if (amount < 1) {
            return res.status(400).json({
                success: false,
                message: "Amount must be at least 1 rupee"
            });
        }

        // Check if application exists
        const application = await Application.findById(applicationId).populate('job applicant');
        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found"
            });
        }

        // Check if job exists
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        // Get user details
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if payment already exists for this application
        const existingPayment = await Payment.findOne({
            applicationId,
            status: { $in: ['pending', 'completed'] }
        });

        if (existingPayment && existingPayment.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: "Payment already completed for this application"
            });
        }

        // Create Razorpay order
        const orderOptions = {
            amount: amount * 100, // Convert to paise
            currency: 'INR',
            receipt: `receipt_${applicationId}_${Date.now()}`,
            payment_capture: 1, // Auto-capture payment
            notes: {
                applicationId: applicationId.toString(),
                jobId: jobId.toString(),
                userId: userId.toString(),
                jobTitle: job.title,
                companyName: job.postedBy?.fullname || 'Company',
            }
        };

        const razorpayOrder = await razorpay.orders.create(orderOptions);

        // Save payment record in database
        const payment = new Payment({
            orderId: razorpayOrder.id,
            userId,
            applicationId,
            jobId,
            amount,
            currency: 'INR',
            status: 'pending',
            description: `Payment for application to job: ${job.title}`,
            customerEmail: user.email,
            customerPhone: user.phoneNumber,
            notes: {
                jobTitle: job.title,
                applicantName: application.applicant?.fullname || 'Applicant',
                postedByName: job.postedBy?.fullname || 'Recruiter',
            },
            receipt: orderOptions.receipt
        });

        await payment.save();

        res.status(200).json({
            success: true,
            message: "Order created successfully",
            order: {
                orderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                keyId: process.env.RAZORPAY_KEY_ID,
                customerEmail: user.email,
                customerName: user.fullname,
                customerPhone: user.phoneNumber,
            }
        });

    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create payment order",
            error: error.message
        });
    }
};

// ✅ VERIFY PAYMENT - Called after payment is completed
export const verifyPayment = async (req, res) => {
    try {
        const { orderId, paymentId, signature } = req.body;
        const userId = req.id;

        // Validate input
        if (!orderId || !paymentId || !signature) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: orderId, paymentId, signature"
            });
        }

        // Create signature verification string
        const body = `${orderId}|${paymentId}`;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        // Verify signature
        const isSignatureValid = expectedSignature === signature;

        if (!isSignatureValid) {
            return res.status(400).json({
                success: false,
                message: "Payment signature verification failed"
            });
        }

        // Update payment record
        const payment = await Payment.findOne({ orderId });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment record not found"
            });
        }

        // Update payment status
        payment.paymentId = paymentId;
        payment.signature = signature;
        payment.status = 'completed';
        await payment.save();

        // Update application payment status
        const application = await Application.findById(payment.applicationId);
        if (application) {
            application.paymentStatus = 'completed';
            application.paymentDate = new Date();
            await application.save();
        }

        res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            payment: {
                orderId: payment.orderId,
                paymentId: payment.paymentId,
                amount: payment.amount,
                status: payment.status,
                applicationId: payment.applicationId,
                jobId: payment.jobId,
            }
        });

    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({
            success: false,
            message: "Failed to verify payment",
            error: error.message
        });
    }
};

// ✅ GET PAYMENT DETAILS
export const getPaymentDetails = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const userId = req.id;

        const payment = await Payment.findOne({ paymentId, userId })
            .populate('userId', 'fullname email')
            .populate('applicationId', 'status')
            .populate('jobId', 'title salary');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        res.status(200).json({
            success: true,
            payment
        });

    } catch (error) {
        console.error("Error fetching payment:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch payment details",
            error: error.message
        });
    }
};

// ✅ GET USER PAYMENTS - Get all payments for logged-in user
export const getUserPayments = async (req, res) => {
    try {
        const userId = req.id;

        const payments = await Payment.find({ userId })
            .populate('jobId', 'title salary')
            .populate('applicationId', 'status')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            payments,
            total: payments.length,
            completedCount: payments.filter(p => p.status === 'completed').length
        });

    } catch (error) {
        console.error("Error fetching user payments:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch user payments",
            error: error.message
        });
    }
};

// ✅ HANDLE FAILED PAYMENT
export const handleFailedPayment = async (req, res) => {
    try {
        const { orderId, reason } = req.body;
        const userId = req.id;

        const payment = await Payment.findOne({ orderId, userId });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment record not found"
            });
        }

        payment.status = 'failed';
        payment.errorMessage = reason || 'Payment failed';
        await payment.save();

        // Update application payment status
        const application = await Application.findById(payment.applicationId);
        if (application) {
            application.paymentStatus = 'failed';
            await application.save();
        }

        res.status(200).json({
            success: true,
            message: "Payment marked as failed"
        });

    } catch (error) {
        console.error("Error handling failed payment:", error);
        res.status(500).json({
            success: false,
            message: "Failed to handle payment error",
            error: error.message
        });
    }
};

// ✅ REFUND PAYMENT
export const refundPayment = async (req, res) => {
    try {
        const { paymentId, refundAmount, reason } = req.body;
        const userId = req.id;

        // Find payment
        const payment = await Payment.findOne({ paymentId, userId });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        if (payment.status === 'refunded') {
            return res.status(400).json({
                success: false,
                message: "Payment has already been refunded"
            });
        }

        if (payment.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: "Only completed payments can be refunded"
            });
        }

        // Create refund in Razorpay
        const refundOptions = {
            amount: (refundAmount || payment.amount) * 100, // Convert to paise
            notes: {
                reason: reason || 'Refund requested by user'
            }
        };

        const refund = await razorpay.payments.refund(paymentId, refundOptions);

        // Update payment record
        payment.status = 'refunded';
        payment.refundId = refund.id;
        payment.refundAmount = refundAmount || payment.amount;
        payment.refundDate = new Date();
        await payment.save();

        // Update application payment status
        const application = await Application.findById(payment.applicationId);
        if (application) {
            application.paymentStatus = 'pending';
            await application.save();
        }

        res.status(200).json({
            success: true,
            message: "Refund processed successfully",
            refund: {
                refundId: refund.id,
                amount: refundAmount || payment.amount,
                status: refund.status
            }
        });

    } catch (error) {
        console.error("Error processing refund:", error);
        res.status(500).json({
            success: false,
            message: "Failed to process refund",
            error: error.message
        });
    }
};

// ✅ GET PAYMENT STATUS
export const getPaymentStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.id;

        const payment = await Payment.findOne({ orderId, userId });

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        res.status(200).json({
            success: true,
            status: payment.status,
            payment: {
                orderId: payment.orderId,
                amount: payment.amount,
                paymentId: payment.paymentId,
                status: payment.status,
                createdAt: payment.createdAt
            }
        });

    } catch (error) {
        console.error("Error fetching payment status:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch payment status",
            error: error.message
        });
    }
};