import asyncErrorsHandler from "../middlewares/asyncErrorsHandler.js";
import * as couponService from "../services/couponService.js";


export const getAllCouponsController = asyncErrorsHandler(async (req, res) => {

    const coupons = await couponService.getAllCoupons();

    return res.status(200).json({
        success: true,
        coupons,
    });
});


export const createCouponController = asyncErrorsHandler(async (req, res) => {

    const coupon = await couponService.createCoupon(
        req.body,
        req.user.user_id
    );

    return res.status(201).json({
        success: true,
        message: "Coupon created successfully.",
        coupon,
    });
});


export const deleteCouponController = asyncErrorsHandler(async (req, res) => {

    await couponService.deleteCoupon(req.params.id);

    return res.status(200).json({
        success: true,
        message: "Coupon deleted successfully.",
    });
});


export const validateCouponController = asyncErrorsHandler(async (req, res) => {

    const { coupon, discount } = await couponService.validateCoupon(
        req.body.code,
        Number(req.body.subtotal)
    );

    return res.status(200).json({
        success: true,
        message: "Coupon is valid.",
        coupon,
        discount,
    });
});