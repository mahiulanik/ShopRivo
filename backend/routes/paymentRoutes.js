import express from "express";

const router = express.Router();


import {stripeWebhookController} from "../controllers/paymentController.js";


router.post("/webhook", express.raw({ type: "application/json" }), stripeWebhookController);


export default router;