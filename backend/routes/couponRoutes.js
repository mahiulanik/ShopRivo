import express from "express";

const router = express.Router()

import * as couponController from "../controllers/couponController.js"


router.post("/validate", couponController.validateCouponController);


export default router
