import ErrorHandler from "../middlewares/errorMiddleware.js";
import database from "../config/db.js";


export const computeDiscount = (coupon, subtotal) => {

    let discount;

    if (coupon.discount_type === "fixed") {
        discount = Number(coupon.discount_value);
    } else {
        discount = Math.round(
            (subtotal * Number(coupon.discount_value)) / 100
        );
    }

    return Math.min(discount, subtotal);
};


export const getAllCoupons = async () => {

    const result = await database.query(
        `SELECT
            id,
            code,
            discount_type,
            discount_value,
            min_amount,
            expires_at,
            is_active,
            created_at
         FROM coupons
         ORDER BY created_at DESC`
    );

    return result.rows;
};


export const createCoupon = async (data, user_id) => {

    const {discount_type, discount_value, min_amount, expires_at} = data;

    const code =
        typeof data.code === "string"
            ? data.code.trim().toUpperCase()
            : "";

    if (!code || !/^[A-Z0-9]+$/.test(code)) {
        throw new ErrorHandler("Coupon code must contain only letters and numbers.", 400);
    }

    if (!["percentage", "fixed"].includes(discount_type)) {
        throw new ErrorHandler("Discount type must be either 'percentage' or 'fixed'.", 400);
    }

    const discountValue = Number(discount_value);

    if (!Number.isInteger(discountValue) || discountValue <= 0) {
        throw new ErrorHandler("Discount value must be a positive integer.", 400);
    }

    if (discount_type === "percentage" && discountValue > 100) {
        throw new ErrorHandler("Percentage discount cannot exceed 100.", 400);
    }

    const minimumAmount =
        min_amount === undefined ||
        min_amount === null ||
        min_amount === ""
            ? 0
            : Number(min_amount);

    if (!Number.isInteger(minimumAmount) || minimumAmount < 0) {
        throw new ErrorHandler("Minimum shopping amount must be 0 or more.", 400);
    }

    if (expires_at && Number.isNaN(new Date(expires_at).getTime())) {
        throw new ErrorHandler("Invalid expiry date.", 400);
    }

    const existingCoupon = await database.query(
        `SELECT id
         FROM coupons
         WHERE code = $1
         LIMIT 1`,
        [code]
    );

    if (existingCoupon.rows.length > 0) {
        throw new ErrorHandler(`Coupon code "${code}" already exists.`, 409);
    }

    const result = await database.query(
        `INSERT INTO coupons
            (
                code,
                discount_type,
                discount_value,
                min_amount,
                expires_at,
                created_by
            )
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING
            id,
            code,
            discount_type,
            discount_value,
            min_amount,
            expires_at,
            is_active,
            created_at`,
        [
            code,
            discount_type,
            discountValue,
            minimumAmount,
            expires_at || null,
            user_id
        ]
    );

    return result.rows[0];
};


export const deleteCoupon = async (coupon_id) => {

    const result = await database.query(
        `DELETE FROM coupons
         WHERE id = $1
         RETURNING id`,
        [coupon_id]
    );

    if (result.rows.length === 0) {
        throw new ErrorHandler("Coupon not found.", 404);
    }
};


export const validateCoupon = async (code, subtotal) => {

    const couponCode =
        typeof code === "string"
            ? code.trim().toUpperCase()
            : "";

    if (!couponCode) {
        throw new ErrorHandler("Coupon code is required.", 400);
    }

    if (!Number.isFinite(subtotal) || subtotal < 0) {
        throw new ErrorHandler("Invalid subtotal.", 400);
    }

    const result = await database.query(
        `SELECT
            id,
            code,
            discount_type,
            discount_value,
            min_amount,
            expires_at,
            is_active
         FROM coupons
         WHERE code = $1
         LIMIT 1`,
        [couponCode]
    );

    if (result.rows.length === 0) {
        throw new ErrorHandler("Invalid coupon code.", 404);
    }

    const coupon = result.rows[0];

    if (!coupon.is_active) {
        throw new ErrorHandler("This coupon is no longer active.", 400);
    }

    if (
        coupon.expires_at &&
        new Date(coupon.expires_at) < new Date(new Date().toDateString())
    ) {
        throw new ErrorHandler("This coupon has expired.", 400);
    }

    if (subtotal < Number(coupon.min_amount)) {
        throw new ErrorHandler(
            `A minimum shopping amount of ৳${Number(coupon.min_amount)} is required to use this coupon.`,
            400
        );
    }

    const discount = computeDiscount(
        coupon,
        subtotal
    );

    return {
        coupon,
        discount,
    };
};