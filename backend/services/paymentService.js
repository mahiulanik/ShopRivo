import database from "../config/db.js";
import stripe from "../config/stripe.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";


export const generatePaymentIntent = async (
    client,
    order_id,
    total_price
) => {

    const paymentIntent = await stripe.paymentIntents.create({
        amount: total_price * 100,
        currency: "bdt",
        metadata: {
            orderId: order_id,
        },
    });

    await client.query(
        `INSERT INTO payments
            (
                order_id,
                payment_type,
                payment_status,
                payment_intent_id
            )
         VALUES ($1, $2, $3, $4)`,
        [
            order_id,
            "Online",
            "Pending",
            paymentIntent.id,
        ]
    );

    return paymentIntent.client_secret;
};


export const createCODPayment = async (
    client,
    order_id
) => {

    await client.query(
        `INSERT INTO payments
            (
                order_id,
                payment_type,
                payment_status
            )
         VALUES ($1, $2, $3)`,
        [
            order_id,
            "Cash on Delivery",
            "Pending",
        ]
    );
};


export const handlePaymentSucceeded = async (paymentIntent) => {

    const client = await database.connect();

    try {

        await client.query("BEGIN");

        // Lock payment and check current state
        const paymentResult = await client.query(
            `SELECT order_id, payment_status
             FROM payments
             WHERE payment_intent_id = $1
             FOR UPDATE`,
            [paymentIntent.id]
        );

        if (paymentResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return;
        }

        const payment = paymentResult.rows[0];

        // Already processed
        if (payment.payment_status === "Paid") {
            await client.query("COMMIT");
            return;
        }

        // Only pending payment can become paid
        if (payment.payment_status !== "Pending") {
            await client.query("ROLLBACK");
            return;
        }

        const order_id = payment.order_id;

        const itemsResult = await client.query(
            `SELECT
                product_id,
                SUM(quantity)::INTEGER AS quantity,
                MAX(title) AS title
             FROM order_items
             WHERE order_id = $1
             GROUP BY product_id`,
            [order_id]
        );

        // Deduct stock only after successful online payment
        for (const item of itemsResult.rows) {

            const stockResult = await client.query(
                `UPDATE products
                 SET stock = stock - $1
                 WHERE id = $2
                 AND stock >= $1
                 RETURNING id`,
                [
                    item.quantity,
                    item.product_id
                ]
            );

            if (stockResult.rows.length === 0) {
                throw new ErrorHandler(
                    `Insufficient stock for ${item.title}.`,
                    400
                );
            }
        }

        await client.query(
            `UPDATE payments
             SET payment_status = 'Paid',
                 updated_at = CURRENT_TIMESTAMP
             WHERE payment_intent_id = $1`,
            [paymentIntent.id]
        );

        await client.query(
            `UPDATE orders
             SET paid_at = COALESCE(paid_at, NOW()),
                 order_status = 'Processing'
             WHERE id = $1`,
            [order_id]
        );

        await client.query("COMMIT");

    } catch (error) {

        await client.query("ROLLBACK");
        throw error;

    } finally {

        client.release();
    }
};


export const handlePaymentFailed = async (paymentIntent) => {

    await database.query(
        `UPDATE payments
         SET payment_status = 'Failed',
             updated_at = CURRENT_TIMESTAMP
         WHERE payment_intent_id = $1
         AND payment_status = 'Pending'`,
        [paymentIntent.id]
    );
};


export const handlePaymentCanceled = async (paymentIntent) => {

    const client = await database.connect();

    try {

        await client.query("BEGIN");

        const paymentResult = await client.query(
            `UPDATE payments
             SET payment_status = 'Canceled',
                 updated_at = CURRENT_TIMESTAMP
             WHERE payment_intent_id = $1
             AND payment_status = 'Pending'
             RETURNING order_id`,
            [paymentIntent.id]
        );

        if (paymentResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return;
        }

        const order_id =
            paymentResult.rows[0].order_id;

        await client.query(
            `UPDATE orders
             SET order_status = 'Cancelled'
             WHERE id = $1
             AND paid_at IS NULL`,
            [order_id]
        );

        // No stock restore is needed.
        // Online stock is deducted only after successful payment.

        await client.query("COMMIT");

    } catch (error) {

        await client.query("ROLLBACK");
        throw error;

    } finally {

        client.release();
    }
};


export const handleStripeWebhook = async (
    body,
    signature
) => {

    let event;

    try {

        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );

    } catch (error) {

        throw new ErrorHandler(
            `Webhook Error: ${error.message}`,
            400
        );
    }

    switch (event.type) {

        case "payment_intent.succeeded":
            await handlePaymentSucceeded(
                event.data.object
            );
            break;

        case "payment_intent.payment_failed":
            await handlePaymentFailed(
                event.data.object
            );
            break;

        case "payment_intent.canceled":
            await handlePaymentCanceled(
                event.data.object
            );
            break;

        default:
            break;
    }
};


export const confirmOrderPayment = async (
    user_id,
    order_id
) => {

    const result = await database.query(
        `SELECT
            orders.id,
            orders.buyer_id,
            payments.payment_type,
            payments.payment_status,
            payments.payment_intent_id
         FROM orders
         JOIN payments
         ON payments.order_id = orders.id
         WHERE orders.id = $1
         LIMIT 1`,
        [order_id]
    );

    if (
        result.rows.length === 0 ||
        result.rows[0].buyer_id !== user_id
    ) {
        throw new ErrorHandler(
            "Order not found.",
            404
        );
    }

    const order = result.rows[0];

    if (order.payment_type !== "Online") {
        throw new ErrorHandler(
            "Only online orders can be confirmed.",
            400
        );
    }

    if (order.payment_status !== "Paid") {

        if (!order.payment_intent_id) {
            throw new ErrorHandler(
                "Payment not found.",
                404
            );
        }

        const paymentIntent =
            await stripe.paymentIntents.retrieve(
                order.payment_intent_id
            );

        if (paymentIntent.status !== "succeeded") {
            throw new ErrorHandler(
                "Payment is not completed yet.",
                400
            );
        }

        await handlePaymentSucceeded(
            paymentIntent
        );
    }

    const orderResult = await database.query(
        `SELECT *
         FROM orders
         WHERE id = $1`,
        [order_id]
    );

    return orderResult.rows[0];
};


export const abandonOrder = async (
    user_id,
    order_id
) => {

    const result = await database.query(
        `SELECT
            orders.id,
            orders.buyer_id,
            payments.payment_type,
            payments.payment_status,
            payments.payment_intent_id
         FROM orders
         JOIN payments
         ON payments.order_id = orders.id
         WHERE orders.id = $1
         LIMIT 1`,
        [order_id]
    );

    if (
        result.rows.length === 0 ||
        result.rows[0].buyer_id !== user_id
    ) {
        throw new ErrorHandler(
            "Order not found.",
            404
        );
    }

    const order = result.rows[0];

    if (order.payment_type !== "Online") {
        throw new ErrorHandler(
            "Only unpaid online orders can be removed.",
            400
        );
    }

    if (order.payment_status !== "Pending") {
        throw new ErrorHandler(
            "This order is already processed and cannot be removed.",
            400
        );
    }

    if (order.payment_intent_id) {

        const paymentIntent =
            await stripe.paymentIntents.retrieve(
                order.payment_intent_id
            );

        // Payment succeeded but webhook has not processed it yet
        if (paymentIntent.status === "succeeded") {

            await handlePaymentSucceeded(
                paymentIntent
            );

            return {
                removed: false,
                confirmed: true,
            };
        }

        const cancelableStatuses = [
            "requires_payment_method",
            "requires_confirmation",
            "requires_action",
            "requires_capture",
        ];

        if (cancelableStatuses.includes(paymentIntent.status)) {

            await stripe.paymentIntents.cancel(
                order.payment_intent_id,
                {
                    cancellation_reason:
                        "requested_by_customer",
                }
            );
        }
    }

    // payments, order_items and shipping_info
    // are removed through ON DELETE CASCADE
    await database.query(
        `DELETE FROM orders
         WHERE id = $1
         AND buyer_id = $2`,
        [
            order_id,
            user_id
        ]
    );

    return {
        removed: true,
        confirmed: false,
    };
};