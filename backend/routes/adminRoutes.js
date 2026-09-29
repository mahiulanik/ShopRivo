import express from "express";

const router = express.Router()


import * as adminController from "../controllers/adminController.js"
import * as categoryController from "../controllers/categoryController.js"
import * as mediaController from "../controllers/mediaController.js"
import * as couponController from "../controllers/couponController.js"
import {isAuthenticated, authorizedRoles} from "../middlewares/authMiddleware.js";


router.get("/get-all-users", isAuthenticated, authorizedRoles("Admin"), adminController.getAllUsersController);
router.delete("/delete/:id", isAuthenticated, authorizedRoles("Admin"), adminController.deleteUserController);
router.patch("/role/:id", isAuthenticated, authorizedRoles("Admin"), adminController.updateUserRoleController);
router.get("/fetch/dashboard-stats", isAuthenticated, authorizedRoles("Admin"), adminController.dashboardStatsController);

router.get("/category", isAuthenticated, authorizedRoles("Admin", "Uploader"), categoryController.getAllCategoriesController);
router.post("/category", isAuthenticated, authorizedRoles("Admin", "Uploader"), categoryController.createCategoryController);
router.patch("/category/:id", isAuthenticated, authorizedRoles("Admin", "Uploader"), categoryController.updateCategoryController);
router.delete("/category/:id", isAuthenticated, authorizedRoles("Admin", "Uploader"), categoryController.deleteCategoryController);

router.get("/media", isAuthenticated, authorizedRoles("Admin", "Uploader"), mediaController.getAllMediaController);
router.delete("/media/:id", isAuthenticated, authorizedRoles("Admin", "Uploader"), mediaController.deleteMediaController);

router.get("/reviews", isAuthenticated, authorizedRoles("Admin"), adminController.getAllReviewsController);
router.delete("/reviews/:id", isAuthenticated, authorizedRoles("Admin"), adminController.deleteReviewController);

router.get("/coupons", isAuthenticated, authorizedRoles("Admin"), couponController.getAllCouponsController);
router.post("/coupons", isAuthenticated, authorizedRoles("Admin"), couponController.createCouponController);
router.delete("/coupons/:id", isAuthenticated, authorizedRoles("Admin"), couponController.deleteCouponController);



export default router