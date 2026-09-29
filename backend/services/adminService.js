import ErrorHandler from "../middlewares/errorMiddleware.js";
import database from "../config/db.js";
import { deleteImage } from "./cloudinaryService.js";


export const getAllUsers = async (queryParams) => {

    const page = Number(queryParams.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    // Accept a single role or a comma-separated list, e.g. "Admin,Uploader"
    const requested = String(queryParams.role || "")
        .split(",")
        .map((r) => r.trim())
        .filter((r) => ["User", "Uploader", "Admin"].includes(r));

    const roles = requested.length > 0 ? requested : ["User"];

    const totalResult = await database.query(
        `SELECT COUNT(*) AS total
         FROM users
         WHERE role = ANY($1::varchar[])`,
        [roles]
    );

    const totalUsers = Number(totalResult.rows[0].total);

    const result = await database.query(
        `SELECT id, name, email, role, avatar, created_at
         FROM users
         WHERE role = ANY($1::varchar[])
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [roles, limit, offset]
    );

    return {
        users: result.rows,
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        currentPage: page,
        limit,
    };
};


export const deleteUser = async (user_id) => {

    const existingUser = await database.query(
        `SELECT id, avatar
         FROM users
         WHERE id = $1
         LIMIT 1`,
        [user_id]
    );

    if (existingUser.rows.length === 0) {
        throw new ErrorHandler("User not found.", 404);
    }

    const user = existingUser.rows[0];

    await database.query(
        `DELETE FROM users
         WHERE id = $1`,
        [user_id]
    );

    if (user.avatar?.public_id) {
        try {
            await deleteImage(user.avatar.public_id);
        } catch (error) {
            console.error("Failed to delete user avatar:", error.message);
        }
    }

    return user;
};


export const updateUserRole = async (user_id, role, admin_user_id) => {

    if (!["User", "Uploader", "Admin"].includes(role)) {
        throw new ErrorHandler("Invalid role.", 400);
    }

    if (user_id === admin_user_id) {
        throw new ErrorHandler("You cannot change your own role.", 400);
    }

    const result = await database.query(
        `UPDATE users
         SET role = $1
         WHERE id = $2
         RETURNING id, name, email, role`,
        [role, user_id]
    );

    if (result.rows.length === 0) {
        throw new ErrorHandler("User not found.", 404);
    }

    return result.rows[0];
};


export const getAllReviews = async (queryParams) => {

    const page = Number(queryParams.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const totalResult = await database.query(
        `SELECT COUNT(*) AS total FROM reviews`
    );

    const totalReviews = Number(totalResult.rows[0].total);

    const result = await database.query(
        `SELECT
            reviews.id,
            reviews.rating,
            reviews.comment,
            reviews.created_at,
            products.id AS product_id,
            products.name AS product_name,
            products.images AS product_images,
            users.id AS user_id,
            users.name AS user_name,
            users.avatar AS user_avatar
         FROM reviews
         JOIN products ON products.id = reviews.product_id
         JOIN users ON users.id = reviews.user_id
         ORDER BY reviews.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
    );

    const reviews = result.rows.map((review) => ({
        id: review.id,
        rating: Number(review.rating),
        comment: review.comment,
        created_at: review.created_at,
        product: {
            id: review.product_id,
            name: review.product_name,
            image: review.product_images?.[0]?.url || null,
        },
        reviewer: {
            id: review.user_id,
            name: review.user_name,
            avatar: review.user_avatar,
        },
    }));

    return {
        reviews,
        totalReviews,
        totalPages: Math.ceil(totalReviews / limit),
        currentPage: page,
        limit,
    };
};


export const deleteReview = async (review_id) => {

    const result = await database.query(
        `DELETE FROM reviews
         WHERE id = $1
         RETURNING product_id`,
        [review_id]
    );

    if (result.rows.length === 0) {
        throw new ErrorHandler("Review not found.", 404);
    }

    const product_id = result.rows[0].product_id;

    const ratingResult = await database.query(
        `SELECT COALESCE(AVG(rating), 0) AS average_rating
         FROM reviews
         WHERE product_id = $1`,
        [product_id]
    );

    const averageRating = Number(ratingResult.rows[0].average_rating);

    await database.query(
        `UPDATE products
         SET ratings = $1
         WHERE id = $2`,
        [averageRating, product_id]
    );

    return {
        id: review_id,
        product_id,
        product_rating: averageRating,
    };
};


export const dashboardStats = async () => {

    const revenueResult = await database.query(
        `SELECT
            COALESCE(SUM(total_price), 0) AS total_revenue,
            COALESCE(SUM(total_price) FILTER (
                WHERE created_at >= CURRENT_DATE
                AND created_at < CURRENT_DATE + INTERVAL '1 day'
            ), 0) AS today_revenue,
            COALESCE(SUM(total_price) FILTER (
                WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
                AND created_at < CURRENT_DATE
            ), 0) AS yesterday_revenue,
            COALESCE(SUM(total_price) FILTER (
                WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
                AND created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
            ), 0) AS current_month_revenue,
            COALESCE(SUM(total_price) FILTER (
                WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
                AND created_at < DATE_TRUNC('month', CURRENT_DATE)
            ), 0) AS previous_month_revenue
         FROM orders
         WHERE paid_at IS NOT NULL`
    );

    const revenue = revenueResult.rows[0];

    const totalRevenueAllTime = Number(revenue.total_revenue);
    const todayRevenue = Number(revenue.today_revenue);
    const yesterdayRevenue = Number(revenue.yesterday_revenue);
    const currentMonthSales = Number(revenue.current_month_revenue);
    const lastMonthRevenue = Number(revenue.previous_month_revenue);


    const usersResult = await database.query(
        `SELECT
            COUNT(*) AS total_users,
            COUNT(*) FILTER (
                WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
                AND created_at < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
            ) AS new_users
         FROM users
         WHERE role = $1`,
        ["User"]
    );

    const totalUsersCount = Number(usersResult.rows[0].total_users);
    const newUsersThisMonth = Number(usersResult.rows[0].new_users);


    const orderStatusResult = await database.query(
        `SELECT order_status, COUNT(*) AS total
         FROM orders
         GROUP BY order_status`
    );

    const orderStatusCounts = {
        Processing: 0,
        Shipped: 0,
        Delivered: 0,
        Cancelled: 0,
    };

    orderStatusResult.rows.forEach((order) => {
        orderStatusCounts[order.order_status] = Number(order.total);
    });


    const monthlySalesResult = await database.query(
        `SELECT
            TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month,
            DATE_TRUNC('month', created_at) AS month_date,
            COALESCE(SUM(total_price), 0) AS total_sales
         FROM orders
         WHERE paid_at IS NOT NULL
         GROUP BY DATE_TRUNC('month', created_at)
         ORDER BY month_date ASC`
    );

    const monthlySales = monthlySalesResult.rows.map((sale) => ({
        month: sale.month,
        totalSales: Number(sale.total_sales),
    }));


    const topSellingProductsResult = await database.query(
        `SELECT
            products.id,
            products.name,
            products.images->0->>'url' AS image,
            products.category,
            products.ratings,
            SUM(order_items.quantity)::INTEGER AS total_sold
         FROM order_items
         JOIN products ON products.id = order_items.product_id
         JOIN orders ON orders.id = order_items.order_id
         WHERE orders.paid_at IS NOT NULL
         GROUP BY products.id
         ORDER BY total_sold DESC
         LIMIT 5`
    );


    const lowStockProductsResult = await database.query(
        `SELECT id, name, stock
         FROM products
         WHERE stock <= 5
         ORDER BY stock ASC`
    );


    let revenueGrowth = "0%";

    if (lastMonthRevenue > 0) {
        const growth =
            ((currentMonthSales - lastMonthRevenue) / lastMonthRevenue) * 100;

        revenueGrowth = `${growth >= 0 ? "+" : ""}${growth.toFixed(2)}%`;
    }


    return {
        totalRevenueAllTime,
        todayRevenue,
        yesterdayRevenue,
        totalUsersCount,
        orderStatusCounts,
        monthlySales,
        currentMonthSales,
        topSellingProducts: topSellingProductsResult.rows,
        lowStockProducts: lowStockProductsResult.rows,
        revenueGrowth,
        newUsersThisMonth,
    };
};