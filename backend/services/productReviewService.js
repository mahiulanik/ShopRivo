import database from "../config/db.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { fetchSingleProduct } from "./productService.js";


export const postProductReview = async (user_id, product_id, data) => {

    const rating = Number(data.rating);
    const comment = data.comment?.trim();

    if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
        throw new ErrorHandler("Rating must be between 0 and 5.", 400);
    }

    if (!comment) {
        throw new ErrorHandler("Comment is required.", 400);
    }

    const productResult = await database.query(
        `SELECT id
         FROM products
         WHERE id = $1`,
        [product_id]
    );

    if (productResult.rows.length === 0) {
        throw new ErrorHandler("Product not found.", 404);
    }

    const purchaseResult = await database.query(
        `SELECT order_items.product_id
         FROM order_items
         JOIN orders
         ON orders.id = order_items.order_id
         JOIN payments
         ON payments.order_id = orders.id
         WHERE orders.buyer_id = $1
         AND order_items.product_id = $2
         AND payments.payment_status = 'Paid'
         LIMIT 1`,
        [
            user_id,
            product_id
        ]
    );

    if (purchaseResult.rows.length === 0) {
        throw new ErrorHandler("You can only review a product you've purchased.", 403);
    }

    const client = await database.connect();

    try {

        await client.query("BEGIN");

        const existingReview = await client.query(
            `SELECT id
             FROM reviews
             WHERE product_id = $1
             AND user_id = $2`,
            [
                product_id,
                user_id
            ]
        );

        let review;
        let isUpdated = false;

        if (existingReview.rows.length > 0) {

            const result = await client.query(
                `UPDATE reviews
                 SET rating = $1,
                     comment = $2
                 WHERE product_id = $3
                 AND user_id = $4
                 RETURNING *`,
                [
                    rating,
                    comment,
                    product_id,
                    user_id
                ]
            );

            review = result.rows[0];
            isUpdated = true;

        } else {

            const result = await client.query(
                `INSERT INTO reviews
                    (
                        product_id,
                        user_id,
                        rating,
                        comment
                    )
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [
                    product_id,
                    user_id,
                    rating,
                    comment
                ]
            );

            review = result.rows[0];
        }

        const ratingResult = await client.query(
            `SELECT COALESCE(AVG(rating), 0) AS average_rating
             FROM reviews
             WHERE product_id = $1`,
            [product_id]
        );

        await client.query(
            `UPDATE products
             SET ratings = $1
             WHERE id = $2`,
            [
                Number(ratingResult.rows[0].average_rating),
                product_id
            ]
        );

        await client.query("COMMIT");

        return {
            review,
            product: await fetchSingleProduct(product_id),
            isUpdated,
        };

    } catch (error) {

        await client.query("ROLLBACK");
        throw error;

    } finally {

        client.release();
    }
};


export const deleteReview = async (user_id, product_id) => {

    const client = await database.connect();

    try {

        await client.query("BEGIN");

        const reviewResult = await client.query(
            `DELETE FROM reviews
             WHERE product_id = $1
             AND user_id = $2
             RETURNING *`,
            [
                product_id,
                user_id
            ]
        );

        if (reviewResult.rows.length === 0) {
            throw new ErrorHandler(
                "Review not found.",
                404
            );
        }

        const ratingResult = await client.query(
            `SELECT COALESCE(AVG(rating), 0) AS average_rating
             FROM reviews
             WHERE product_id = $1`,
            [product_id]
        );

        await client.query(
            `UPDATE products
             SET ratings = $1
             WHERE id = $2`,
            [
                Number(ratingResult.rows[0].average_rating),
                product_id
            ]
        );

        await client.query("COMMIT");

        return {
            review: reviewResult.rows[0],
            product: await fetchSingleProduct(product_id),
        };

    } catch (error) {

        await client.query("ROLLBACK");
        throw error;

    } finally {

        client.release();
    }
};