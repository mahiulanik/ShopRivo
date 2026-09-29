import ErrorHandler from "../middlewares/errorMiddleware.js";
import database from "../config/db.js";


export const getAllCategories = async () => {

    const result = await database.query(
        `SELECT
            categories.id,
            categories.name,
            categories.created_at,
            COUNT(products.id) AS product_count
         FROM categories
         LEFT JOIN products
         ON products.category = categories.name
         GROUP BY categories.id
         ORDER BY categories.name ASC`
    );

    return result.rows.map((category) => ({
        ...category,
        product_count: Number(category.product_count),
    }));
};


export const createCategory = async (name) => {

    const categoryName = typeof name === "string" ? name.trim() : "";

    if (!categoryName) {
        throw new ErrorHandler("Category name is required.", 400);
    }

    const existingCategory = await database.query(
        `SELECT id
         FROM categories
         WHERE LOWER(name) = LOWER($1)
         LIMIT 1`,
        [categoryName]
    );

    if (existingCategory.rows.length > 0) {
        throw new ErrorHandler("Category already exists.", 409);
    }

    const result = await database.query(
        `INSERT INTO categories (name)
         VALUES ($1)
         RETURNING id, name, created_at`,
        [categoryName]
    );

    return result.rows[0];
};


export const updateCategory = async (category_id, name) => {

    const categoryName = typeof name === "string" ? name.trim() : "";

    if (!categoryName) {
        throw new ErrorHandler("Category name is required.", 400);
    }

    const existingCategory = await database.query(
        `SELECT id, name
         FROM categories
         WHERE id = $1
         LIMIT 1`,
        [category_id]
    );

    if (existingCategory.rows.length === 0) {
        throw new ErrorHandler("Category not found.", 404);
    }

    const duplicateCategory = await database.query(
        `SELECT id
         FROM categories
         WHERE LOWER(name) = LOWER($1)
         AND id <> $2
         LIMIT 1`,
        [categoryName, category_id]
    );

    if (duplicateCategory.rows.length > 0) {
        throw new ErrorHandler("Category already exists.", 409);
    }

    const previousName = existingCategory.rows[0].name;

    const result = await database.query(
        `UPDATE categories
         SET name = $1
         WHERE id = $2
         RETURNING id, name, created_at`,
        [categoryName, category_id]
    );

    if (previousName !== categoryName) {
        await database.query(
            `UPDATE products
             SET category = $1
             WHERE category = $2`,
            [categoryName, previousName]
        );
    }

    return result.rows[0];
};


export const deleteCategory = async (category_id) => {

    const existingCategory = await database.query(
        `SELECT id, name
         FROM categories
         WHERE id = $1
         LIMIT 1`,
        [category_id]
    );

    if (existingCategory.rows.length === 0) {
        throw new ErrorHandler("Category not found.", 404);
    }

    const categoryName = existingCategory.rows[0].name;

    const productsResult = await database.query(
        `SELECT COUNT(*) AS total
         FROM products
         WHERE category = $1`,
        [categoryName]
    );

    const productCount = Number(productsResult.rows[0].total);

    if (productCount > 0) {
        throw new ErrorHandler(
            `Cannot delete this category because ${productCount} product(s) are using it.`,
            400
        );
    }

    await database.query(
        `DELETE FROM categories
         WHERE id = $1`,
        [category_id]
    );
};