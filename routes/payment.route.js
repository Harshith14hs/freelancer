import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
    createOrder,
    verifyPayment,
    getPaymentDetails,
    getUserPayments,
    handleFailedPayment,
    refundPayment,
    getPaymentStatus
} from "../controllers/payment.controller.js";

const router = express.Router();

// ✅ Create payment order
router.route("/create-order").post(isAuthenticated, createOrder);

// ✅ Verify payment after completion
router.route("/verify").post(isAuthenticated, verifyPayment);

// ✅ Get payment status
router.route("/status/:orderId").get(isAuthenticated, getPaymentStatus);

// ✅ Get payment details
router.route("/:paymentId").get(isAuthenticated, getPaymentDetails);

// ✅ Get all user payments
router.route("/").get(isAuthenticated, getUserPayments);

// ✅ Handle failed payment
router.route("/failed").post(isAuthenticated, handleFailedPayment);

// ✅ Request refund
router.route("/refund").post(isAuthenticated, refundPayment);

export default router;