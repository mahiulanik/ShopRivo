import express from "express";

const router = express.Router();


import * as orderController from "../controllers/orderController.js"
import { isAuthenticated, authorizedRoles } from "../middlewares/authMiddleware.js";


router.post("/new", isAuthenticated, orderController.placeNewOrderController);
router.get("/my-orders", isAuthenticated, orderController.fetchMyOrdersController);
router.get("/admin/all", isAuthenticated, authorizedRoles("Admin"), orderController.fetchAllOrdersController);
router.post("/:orderId/confirm", isAuthenticated, orderController.confirmOrderPaymentController);
router.delete("/:orderId", isAuthenticated, orderController.abandonOrderController);
router.get("/:orderId", isAuthenticated, orderController.fetchSingleOrderController);
router.put("/admin/update/:orderId", isAuthenticated, authorizedRoles("Admin"), orderController.updateOrderStatusController);


export default router;