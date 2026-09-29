import asyncErrorsHandler from "../middlewares/asyncErrorsHandler.js";
import * as orderService from "../services/orderService.js";
import * as paymentService from "../services/paymentService.js";


export const placeNewOrderController = asyncErrorsHandler(async (req, res) => {

    const order = await orderService.placeNewOrder(
        req.user.user_id,
        req.body
    );

    return res.status(201).json({
        success: true,
        message: "Order placed successfully. Please proceed to payment.",
        order,
    });
});


export const fetchSingleOrderController = asyncErrorsHandler(async (req, res) => {

    const order = await orderService.fetchSingleOrder(
        req.params.orderId,
        req.user.user_id,
        req.user.role
    );

    return res.status(200).json({
        success: true,
        message: "Order fetched successfully.",
        order,
    });
});


export const fetchMyOrdersController = asyncErrorsHandler(async (req, res) => {

    const orders = await orderService.fetchMyOrders(req.user.user_id);

    return res.status(200).json({
        success: true,
        message: "Your orders fetched successfully.",
        orders,
    });
});


export const fetchAllOrdersController = asyncErrorsHandler(async (req, res) => {

    const orders = await orderService.fetchAllOrders();

    return res.status(200).json({
        success: true,
        message: "All orders fetched successfully.",
        orders,
    });
});


export const updateOrderStatusController = asyncErrorsHandler(async (req, res) => {

    const order = await orderService.updateOrderStatus(
        req.params.orderId,
        req.body.status
    );

    return res.status(200).json({
        success: true,
        message: "Order status updated successfully.",
        order,
    });
});


export const confirmOrderPaymentController = asyncErrorsHandler(async (req, res) => {

    const order = await paymentService.confirmOrderPayment(
        req.user.user_id,
        req.params.orderId
    );

    return res.status(200).json({
        success: true,
        message: "Payment confirmed.",
        order,
    });
});


export const abandonOrderController = asyncErrorsHandler(async (req, res) => {

    const result = await paymentService.abandonOrder(
        req.user.user_id,
        req.params.orderId
    );

    return res.status(200).json({
        success: true,
        message: result.removed
            ? "Unpaid order removed."
            : "Payment was successful, order kept.",
        ...result,
    });
});