import express from "express";

const router = express.Router()

import * as productReviewController from "../controllers/productReviewController.js"
import { isAuthenticated } from "../middlewares/authMiddleware.js";


router.put("/post-new/review/:productId", isAuthenticated, productReviewController.postProductReviewController);
router.delete("/delete/review/:productId", isAuthenticated, productReviewController.deleteReviewController);


export default router