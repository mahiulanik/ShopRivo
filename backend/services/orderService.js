import database from "../config/db.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { generatePaymentIntent, createCODPayment } from "./paymentService.js";
import { validateCoupon } from "./couponService.js";
import stripe from "../config/stripe.js";


export const placeNewOrder = async (user_id, data) => {

    const {
        city,
        country,
        address,
        pincode,
        phone,
        payment_type,
        orderedItems,
        coupon_code,
    } = data;

    const contact_name =
        data.contact_name?.trim() ||
        data.full_name?.trim() ||
        "";

    const district =
        data.district?.trim() ||
        data.state?.trim() ||
        "";

    const area =
        data.area?.trim() ||
        data.landmark?.trim() ||
        null;

    if (
        !contact_name ||
        !district ||
        !city ||
        !country ||
        !address ||
        !pincode ||
        !phone
    ) {
        throw new ErrorHandler(
            "Please provide complete shipping details.",
            400
        );
    }

    if (!["Online", "Cash on Delivery"].includes(payment_type)) {
        throw new ErrorHandler("Invalid payment type.", 400);
    }

    let items;

    try {
        items = Array.isArray(orderedItems)
            ? orderedItems
            : JSON.parse(orderedItems);
    } catch {
        throw new ErrorHandler("Invalid ordered items.", 400);
    }

    if (!items?.length) {
        throw new ErrorHandler("No items in cart.", 400);
    }

    for (const item of items) {

        if (!item?.product?.id) {
            throw new ErrorHandler(
                "Invalid product information.",
                400
            );
        }

        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
            throw new ErrorHandler(
                "Invalid product quantity.",
                400
            );
        }
    }

    const productIds = [
        ...new Set(
            items.map((item) => item.product.id)
        )
    ];

    const client = await database.connect();

    try {

        await client.query("BEGIN");

        const productResult = await client.query(
            `SELECT
                id,
                name,
                price,
                stock,
                images,
                colors,
                variants
             FROM products
             WHERE id = ANY($1::uuid[])
             ORDER BY id
             FOR UPDATE`,
            [productIds]
        );

        const products = productResult.rows;

        if (products.length !== productIds.length) {
            throw new ErrorHandler(
                "One or more products were not found.",
                404
            );
        }

        const quantityByProduct = {};

        for (const item of items) {
            quantityByProduct[item.product.id] =
                (quantityByProduct[item.product.id] || 0) +
                item.quantity;
        }

        for (const product of products) {

            if (quantityByProduct[product.id] > product.stock) {
                throw new ErrorHandler(
                    `Only ${product.stock} units available for ${product.name}.`,
                    400
                );
            }
        }

        let subtotal = 0;
        const orderItems = [];

        for (const item of items) {

            const product = products.find(
                (product) => product.id === item.product.id
            );

            const basePrice = Number(product.price);

            const selectedColor =
                item.color?.trim() || null;

            const selectedVariant =
                item.variant?.trim() || null;

            let unitPrice = basePrice;

            if (selectedColor) {

                const color = (product.colors || []).find(
                    (color) => color.name === selectedColor
                );

                if (!color) {
                    throw new ErrorHandler(
                        `Invalid color "${selectedColor}" for ${product.name}.`,
                        400
                    );
                }

                unitPrice = Number(color.price);
            }

            if (selectedVariant) {

                const variant = (product.variants || []).find(
                    (variant) => variant.label === selectedVariant
                );

                if (!variant) {
                    throw new ErrorHandler(
                        `Invalid variant "${selectedVariant}" for ${product.name}.`,
                        400
                    );
                }

                unitPrice =
                    Number(variant.price) +
                    (unitPrice - basePrice);
            }

            subtotal += unitPrice * item.quantity;

            orderItems.push({
                product_id: product.id,
                quantity: item.quantity,
                price: unitPrice,
                color: selectedColor,
                variant: selectedVariant,
                image:
                    product.images?.[0]?.url ||
                    product.colors?.find(
                        (color) => color.image?.url
                    )?.image?.url ||
                    "",
                title: product.name,
            });
        }

        const shipping_price = subtotal > 3000 ? 0 : 80;

        let discount = 0;
        let appliedCouponCode = null;

        const requestedCoupon =
            coupon_code?.trim() || null;

        if (requestedCoupon) {

            const coupon = await validateCoupon(
                requestedCoupon,
                subtotal
            );

            discount = coupon.discount;
            appliedCouponCode = coupon.coupon.code;
        }

        const total_price = Math.max(
            subtotal + shipping_price - discount,
            0
        );

        const orderResult = await client.query(
            `INSERT INTO orders
                (
                    buyer_id,
                    total_price,
                    shipping_price,
                    coupon_code,
                    discount,
                    order_status
                )
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                user_id,
                total_price,
                shipping_price,
                appliedCouponCode,
                discount,
                "Processing",
            ]
        );

        const order = orderResult.rows[0];

        const values = [];
        const placeholders = [];

        orderItems.forEach((item, index) => {

            const position = index * 8;

            values.push(
                order.id,
                item.product_id,
                item.quantity,
                item.price,
                item.color,
                item.variant,
                item.image,
                item.title
            );

            placeholders.push(
                `(
                    $${position + 1},
                    $${position + 2},
                    $${position + 3},
                    $${position + 4},
                    $${position + 5},
                    $${position + 6},
                    $${position + 7},
                    $${position + 8}
                )`
            );
        });

        await client.query(
            `INSERT INTO order_items
                (
                    order_id,
                    product_id,
                    quantity,
                    price,
                    color,
                    variant,
                    image,
                    title
                )
             VALUES ${placeholders.join(", ")}`,
            values
        );

        await client.query(
            `INSERT INTO shipping_info
                (
                    order_id,
                    user_id,
                    contact_name,
                    phone,
                    address,
                    area,
                    district,
                    city,
                    pincode,
                    country
                )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
                order.id,
                user_id,
                contact_name,
                phone.trim(),
                address.trim(),
                area,
                district,
                city.trim(),
                pincode.trim(),
                country.trim(),
            ]
        );

        let clientSecret = null;

        if (payment_type === "Cash on Delivery") {

            for (const product_id of productIds) {

                const stockResult = await client.query(
                    `UPDATE products
                     SET stock = stock - $1
                     WHERE id = $2
                     AND stock >= $1
                     RETURNING id`,
                    [
                        quantityByProduct[product_id],
                        product_id
                    ]
                );

                if (stockResult.rows.length === 0) {
                    throw new ErrorHandler(
                        "Insufficient product stock.",
                        400
                    );
                }
            }

            await createCODPayment(
                client,
                order.id
            );
        }

        if (payment_type === "Online") {

            clientSecret = await generatePaymentIntent(
                client,
                order.id,
                total_price
            );
        }

        await client.query("COMMIT");

        return {
            order,
            payment_type,
            clientSecret,
        };

    } catch (error) {

        await client.query("ROLLBACK");
        throw error;

    } finally {

        client.release();
    }
};


export const fetchSingleOrder = async (order_id, user_id, role) => {

    let query = `
        SELECT
            orders.*,
            json_build_object(
                'payment_type', payments.payment_type,
                'payment_status', payments.payment_status
            ) AS payment,
            COALESCE(
                json_agg(
                    json_build_object(
                        'order_item_id', order_items.id,
                        'product_id', order_items.product_id,
                        'quantity', order_items.quantity,
                        'price', order_items.price,
                        'image', order_items.image,
                        'title', order_items.title,
                        'color', order_items.color,
                        'variant', order_items.variant
                    )
                ) FILTER (
                    WHERE order_items.id IS NOT NULL
                ),
                '[]'
            ) AS order_items,
            json_build_object(
                'contact_name', shipping_info.contact_name,
                'area', shipping_info.area,
                'district', shipping_info.district,
                'state', shipping_info.district,
                'city', shipping_info.city,
                'country', shipping_info.country,
                'address', shipping_info.address,
                'pincode', shipping_info.pincode,
                'phone', shipping_info.phone
            ) AS shipping_info
         FROM orders
         LEFT JOIN order_items
         ON orders.id = order_items.order_id
         LEFT JOIN shipping_info
         ON orders.id = shipping_info.order_id
         LEFT JOIN payments
         ON orders.id = payments.order_id
         WHERE orders.id = $1
    `;

    const values = [order_id];

    if (role !== "Admin") {
        query += ` AND orders.buyer_id = $2`;
        values.push(user_id);
    }

    query += `
        GROUP BY
            orders.id,
            shipping_info.id,
            payments.id
    `;

    const result = await database.query(
        query,
        values
    );

    if (result.rows.length === 0) {
        throw new ErrorHandler("Order not found.", 404);
    }

    return result.rows[0];
};


export const fetchMyOrders = async (user_id) => {

    const result = await database.query(
        `SELECT
            orders.*,
            json_build_object(
                'payment_type', payments.payment_type,
                'payment_status', payments.payment_status
            ) AS payment,
            COALESCE(
                json_agg(
                    json_build_object(
                        'order_item_id', order_items.id,
                        'product_id', order_items.product_id,
                        'quantity', order_items.quantity,
                        'price', order_items.price,
                        'image', order_items.image,
                        'title', order_items.title,
                        'color', order_items.color,
                        'variant', order_items.variant
                    )
                ) FILTER (
                    WHERE order_items.id IS NOT NULL
                ),
                '[]'
            ) AS order_items,
            json_build_object(
                'contact_name', shipping_info.contact_name,
                'area', shipping_info.area,
                'district', shipping_info.district,
                'state', shipping_info.district,
                'city', shipping_info.city,
                'country', shipping_info.country,
                'address', shipping_info.address,
                'pincode', shipping_info.pincode,
                'phone', shipping_info.phone
            ) AS shipping_info
         FROM orders
         LEFT JOIN order_items
         ON orders.id = order_items.order_id
         LEFT JOIN shipping_info
         ON orders.id = shipping_info.order_id
         LEFT JOIN payments
         ON orders.id = payments.order_id
         WHERE orders.buyer_id = $1
         AND (
            payments.payment_type = 'Cash on Delivery'
            OR (
                payments.payment_type = 'Online'
                AND payments.payment_status = 'Paid'
            )
         )
         GROUP BY
            orders.id,
            shipping_info.id,
            payments.id
         ORDER BY orders.created_at DESC`,
        [user_id]
    );

    return result.rows;
};


export const fetchAllOrders = async () => {

    const result = await database.query(
        `SELECT
            orders.*,
            json_build_object(
                'payment_type', payments.payment_type,
                'payment_status', payments.payment_status,
                'payment_intent_id', payments.payment_intent_id
            ) AS payment,
            COALESCE(
                json_agg(
                    json_build_object(
                        'order_item_id', order_items.id,
                        'order_id', order_items.order_id,
                        'product_id', order_items.product_id,
                        'quantity', order_items.quantity,
                        'price', order_items.price,
                        'image', order_items.image,
                        'title', order_items.title,
                        'color', order_items.color,
                        'variant', order_items.variant
                    )
                ) FILTER (
                    WHERE order_items.id IS NOT NULL
                ),
                '[]'
            ) AS order_items,
            json_build_object(
                'contact_name', shipping_info.contact_name,
                'area', shipping_info.area,
                'district', shipping_info.district,
                'state', shipping_info.district,
                'city', shipping_info.city,
                'country', shipping_info.country,
                'address', shipping_info.address,
                'pincode', shipping_info.pincode,
                'phone', shipping_info.phone
            ) AS shipping_info
         FROM orders
         LEFT JOIN order_items
         ON orders.id = order_items.order_id
         LEFT JOIN shipping_info
         ON orders.id = shipping_info.order_id
         LEFT JOIN payments
         ON orders.id = payments.order_id
         GROUP BY
            orders.id,
            shipping_info.id,
            payments.id
         ORDER BY orders.created_at DESC`
    );

    return result.rows;
};


export const updateOrderStatus = async (order_id, status) => {

    const allowedStatuses = [
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled"
    ];

    if (!allowedStatuses.includes(status)) {
        throw new ErrorHandler(
            "Invalid order status.",
            400
        );
    }

    const client = await database.connect();

    let paymentIntentToCancel = null;

    try {

        await client.query("BEGIN");

        const orderResult = await client.query(
            `SELECT *
             FROM orders
             WHERE id = $1
             FOR UPDATE`,
            [order_id]
        );

        if (orderResult.rows.length === 0) {
            throw new ErrorHandler(
                "Invalid order ID.",
                404
            );
        }

        const paymentResult = await client.query(
            `SELECT *
             FROM payments
             WHERE order_id = $1
             FOR UPDATE`,
            [order_id]
        );

        if (paymentResult.rows.length === 0) {
            throw new ErrorHandler(
                "Payment information not found.",
                404
            );
        }

        const order = orderResult.rows[0];
        const payment = paymentResult.rows[0];

        if (order.order_status === status) {
            await client.query("COMMIT");
            return order;
        }

        if (order.order_status === "Delivered") {
            throw new ErrorHandler(
                "Delivered order status cannot be changed.",
                400
            );
        }

        if (order.order_status === "Cancelled") {
            throw new ErrorHandler(
                "Cancelled order status cannot be changed.",
                400
            );
        }


        // Cancel Order
        if (status === "Cancelled") {

            if (payment.payment_status === "Paid") {
                throw new ErrorHandler(
                    "Paid orders cannot be cancelled directly. Please process a refund.",
                    400
                );
            }

            if (payment.payment_type === "Cash on Delivery") {

                await client.query(
                    `UPDATE payments
                     SET payment_status = 'Canceled',
                         updated_at = CURRENT_TIMESTAMP
                     WHERE order_id = $1
                     AND payment_status = 'Pending'`,
                    [order_id]
                );

                await client.query(
                    `UPDATE products
                     SET stock = products.stock + order_items.quantity
                     FROM order_items
                     WHERE order_items.order_id = $1
                     AND products.id = order_items.product_id`,
                    [order_id]
                );

                const result = await client.query(
                    `UPDATE orders
                     SET order_status = 'Cancelled'
                     WHERE id = $1
                     RETURNING *`,
                    [order_id]
                );

                await client.query("COMMIT");

                return result.rows[0];
            }

            if (!payment.payment_intent_id) {
                throw new ErrorHandler(
                    "Payment intent not found.",
                    400
                );
            }

            paymentIntentToCancel =
                payment.payment_intent_id;

            await client.query("COMMIT");

            const paymentIntent =
                await stripe.paymentIntents.retrieve(
                    paymentIntentToCancel
                );

            const cancelableStatuses = [
                "requires_payment_method",
                "requires_confirmation",
                "requires_action",
                "requires_capture",
            ];

            if (!cancelableStatuses.includes(paymentIntent.status)) {
                throw new ErrorHandler(
                    `Payment cannot be cancelled while Stripe status is ${paymentIntent.status}.`,
                    400
                );
            }

            await stripe.paymentIntents.cancel(
                paymentIntentToCancel,
                {
                    cancellation_reason:
                        "requested_by_customer",
                }
            );

            // Stripe webhook will cancel the order
            // and restore stock if required.

            const result = await database.query(
                `SELECT *
                 FROM orders
                 WHERE id = $1`,
                [order_id]
            );

            return result.rows[0];
        }


        // Deliver Order
        if (status === "Delivered") {

            if (payment.payment_type === "Cash on Delivery") {

                await client.query(
                    `UPDATE payments
                     SET payment_status = 'Paid',
                         updated_at = CURRENT_TIMESTAMP
                     WHERE order_id = $1
                     AND payment_status = 'Pending'`,
                    [order_id]
                );

                const result = await client.query(
                    `UPDATE orders
                     SET order_status = 'Delivered',
                         paid_at = COALESCE(paid_at, NOW())
                     WHERE id = $1
                     RETURNING *`,
                    [order_id]
                );

                await client.query("COMMIT");

                return result.rows[0];
            }

            if (payment.payment_status !== "Paid") {
                throw new ErrorHandler(
                    "Online order cannot be delivered before payment is completed.",
                    400
                );
            }

            const result = await client.query(
                `UPDATE orders
                 SET order_status = 'Delivered'
                 WHERE id = $1
                 RETURNING *`,
                [order_id]
            );

            await client.query("COMMIT");

            return result.rows[0];
        }


        // Processing / Shipped
        if (
            payment.payment_type === "Online" &&
            payment.payment_status !== "Paid"
        ) {
            throw new ErrorHandler(
                "Online order cannot be processed before payment is completed.",
                400
            );
        }

        const result = await client.query(
            `UPDATE orders
             SET order_status = $1
             WHERE id = $2
             RETURNING *`,
            [status, order_id]
        );

        await client.query("COMMIT");

        return result.rows[0];

    } catch (error) {

        await client.query("ROLLBACK");
        throw error;

    } finally {

        client.release();
    }
};