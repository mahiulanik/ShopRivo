import express from "express";

const router = express.Router()

import * as productController from "../controllers/productController.js"
import { isAuthenticated, authorizedRoles } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/multer.js";

const productUpload = upload.fields([
    { name: "images", maxCount: 10 },
    { name: "color_images", maxCount: 20 },
]);


router.post("/admin/create", isAuthenticated, authorizedRoles("Admin", "Uploader"), productUpload, productController.createProductController);
router.get("/", productController.fetchAllProductsController);
router.get("/:productId", productController.fetchSingleProductController);
router.patch("/admin/update/:productId", isAuthenticated, authorizedRoles("Admin", "Uploader"), productUpload, productController.updateProductController);
router.delete("/admin/delete/:productId", isAuthenticated, authorizedRoles("Admin", "Uploader"), productController.deleteProductController);
router.post("/ai-search", productController.fetchAIFilteredProductsController);



export default router