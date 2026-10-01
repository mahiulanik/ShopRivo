import ErrorHandler from "../middlewares/errorMiddleware.js";
import database from "../config/db.js";
import { uploadImage, deleteImage } from "./cloudinaryService.js";
import { filterKeywords } from "../utils/filterKeywords.js";
import { getAIRecommendation } from "../utils/getAIRecommendation.js";


const registerMedia = async (images = []) => {

    for (const image of images) {

        if (!image?.public_id || !image?.url) continue;

        try {

            await database.query(
                `INSERT INTO media (public_id, url)
                 VALUES ($1, $2)
                 ON CONFLICT (public_id) DO NOTHING`,
                [
                    image.public_id,
                    image.url
                ]
            );

        } catch (error) {

            console.error(
                "Failed to register media:",
                error.message
            );
        }
    }
};


const parseOptionList = (value) => {

    if (!value) return [];

    if (Array.isArray(value)) {
        return value;
    }

    if (typeof value === "string") {

        try {

            const parsed = JSON.parse(value);

            return Array.isArray(parsed)
                ? parsed
                : [];

        } catch {
            return [];
        }
    }

    return [];
};


const normalizeImage = (image) => {

    if (!image || typeof image !== "object") {
        return null;
    }

    const url = String(image.url || "").trim();

    if (!url) {
        return null;
    }

    return {
        public_id:
            typeof image.public_id === "string"
                ? image.public_id
                : "",
        url,
    };
};


const validateColors = (colors) => {

    return colors.map((color) => {

        const name =
            String(color?.name || "").trim();

        const price =
            Number(color?.price);

        if (!name) {
            throw new ErrorHandler(
                "Color name cannot be empty.",
                400
            );
        }

        if (!Number.isInteger(price) || price < 0) {
            throw new ErrorHandler(
                "Each color price must be a non-negative integer.",
                400
            );
        }

        return {
            name,
            price,
            image: normalizeImage(color?.image),
            hasNewImage:
                color?.hasNewImage === true ||
                color?.hasNewImage === "true",
        };
    });
};


const validateVariants = (variants) => {

    return variants.map((variant) => {

        const label =
            String(variant?.label || "").trim();

        const price =
            Number(variant?.price);

        if (!label) {
            throw new ErrorHandler(
                "Variant label cannot be empty.",
                400
            );
        }

        if (!Number.isInteger(price) || price < 0) {
            throw new ErrorHandler(
                "Each variant price must be a non-negative integer.",
                400
            );
        }

        return {
            label,
            price,
        };
    });
};


export const createProduct = async (
    user_id,
    data,
    files
) => {

    const {
        name,
        description,
        price,
        category,
        stock,
        color,
        colors,
        variants
    } = data;

    if (
        !name ||
        !description ||
        price === undefined ||
        !category ||
        stock === undefined
    ) {
        throw new ErrorHandler(
            "Please provide all required product details.",
            400
        );
    }

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const trimmedCategory = category.trim();

    if (
        !trimmedName ||
        !trimmedDescription ||
        !trimmedCategory
    ) {
        throw new ErrorHandler(
            "Please provide valid product details.",
            400
        );
    }

    const numericPrice = Number(price);
    const numericStock = Number(stock);

    if (
        !Number.isInteger(numericPrice) ||
        numericPrice < 0
    ) {
        throw new ErrorHandler(
            "Price must be a valid non-negative integer.",
            400
        );
    }

    if (
        !Number.isInteger(numericStock) ||
        numericStock < 0
    ) {
        throw new ErrorHandler(
            "Stock must be a valid non-negative integer.",
            400
        );
    }

    const imageFiles =
        Array.isArray(files)
            ? files
            : files?.images || [];

    const colorImageFiles =
        Array.isArray(files)
            ? []
            : files?.color_images || [];

    if (imageFiles.length > 10) {
        throw new ErrorHandler(
            "Maximum 10 product images are allowed.",
            400
        );
    }

    const parsedColors =
        validateColors(
            parseOptionList(colors)
        );

    const parsedVariants =
        validateVariants(
            parseOptionList(variants)
        );

    if (
        imageFiles.length === 0 &&
        !parsedColors.some(
            (color) =>
                color.image ||
                color.hasNewImage
        )
    ) {
        throw new ErrorHandler(
            "Please provide at least one product image or color picture.",
            400
        );
    }

    const productColor =
        parsedColors.length > 0
            ? parsedColors[0].name
            : color?.trim() || null;

    const uploadedImages = [];
    const uploadedColorImages = [];

    try {

        // Product Images
        for (const image of imageFiles) {

            const uploaded = await uploadImage(
                image.buffer,
                "ecommerce/products"
            );

            uploadedImages.push({
                public_id: uploaded.public_id,
                url:
                    uploaded.secure_url ||
                    uploaded.secured_url,
            });
        }


        // Color Images
        let colorImageIndex = 0;

        for (const color of parsedColors) {

            if (color.hasNewImage) {

                const file =
                    colorImageFiles[colorImageIndex++];

                if (!file) {
                    throw new ErrorHandler(
                        "Missing color image attachment.",
                        400
                    );
                }

                const uploaded = await uploadImage(
                    file.buffer,
                    "ecommerce/products"
                );

                const image = {
                    public_id: uploaded.public_id,
                    url:
                        uploaded.secure_url ||
                        uploaded.secured_url,
                };

                uploadedColorImages.push(image);

                color.image = image;
            }

            delete color.hasNewImage;
        }


        // If there are no normal product images,
        // use color images as product images.
        const productImages =
            uploadedImages.length > 0
                ? uploadedImages
                : parsedColors
                    .map((color) => color.image)
                    .filter(Boolean);


        const result = await database.query(
            `INSERT INTO products
                (
                    name,
                    description,
                    price,
                    category,
                    color,
                    colors,
                    variants,
                    stock,
                    images,
                    created_by
                )
             VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9, $10
             )
             RETURNING *`,
            [
                trimmedName,
                trimmedDescription,
                numericPrice,
                trimmedCategory,
                productColor,
                JSON.stringify(parsedColors),
                JSON.stringify(parsedVariants),
                numericStock,
                JSON.stringify(productImages),
                user_id
            ]
        );

        await registerMedia([
            ...uploadedImages,
            ...uploadedColorImages,
        ]);

        return result.rows[0];

    } catch (error) {

        const uploaded = [
            ...uploadedImages,
            ...uploadedColorImages,
        ];

        for (const image of uploaded) {

            try {
                await deleteImage(
                    image.public_id
                );
            } catch (deleteError) {
                console.error(
                    "Failed to cleanup uploaded image:",
                    deleteError.message
                );
            }
        }

        throw error;
    }
};


export const fetchAllProducts = async (queryParams) => {

    const {
        availability,
        price,
        category,
        ratings,
        search
    } = queryParams;

    const page = Math.max(
        Number.parseInt(queryParams.page, 10) || 1,
        1
    );

    const limit = 9;
    const offset = (page - 1) * limit;

    const conditions = [];
    const values = [];

    let parameterIndex = 1;


    // Availability
    if (availability === "in-stock") {
        conditions.push(
            `products.stock > 5`
        );

    } else if (availability === "limited") {
        conditions.push(
            `products.stock BETWEEN 1 AND 5`
        );

    } else if (availability === "out-of-stock") {
        conditions.push(
            `products.stock = 0`
        );
    }


    // Price
    if (price) {

        const [minPrice, maxPrice] =
            price.split("-").map(Number);

        if (
            Number.isInteger(minPrice) &&
            Number.isInteger(maxPrice) &&
            minPrice >= 0 &&
            maxPrice >= minPrice
        ) {

            conditions.push(
                `products.price BETWEEN $${parameterIndex} AND $${parameterIndex + 1}`
            );

            values.push(
                minPrice,
                maxPrice
            );

            parameterIndex += 2;
        }
    }


    // Category
    if (category?.trim()) {

        conditions.push(
            `products.category ILIKE $${parameterIndex}`
        );

        values.push(
            `%${category.trim()}%`
        );

        parameterIndex++;
    }


    // Rating
    if (ratings !== undefined) {

        const rating = Number(ratings);

        if (
            Number.isFinite(rating) &&
            rating >= 0 &&
            rating <= 5
        ) {

            conditions.push(
                `products.ratings >= $${parameterIndex}`
            );

            values.push(rating);

            parameterIndex++;
        }
    }


    // Search
    if (search?.trim()) {

        const tokens =
            search
                .trim()
                .toLowerCase()
                .split(/\s+/)
                .filter(Boolean);

        for (const token of tokens) {

            conditions.push(
                `(REPLACE(LOWER(products.name), ' ', '') LIKE $${parameterIndex}
                OR REPLACE(LOWER(products.description), ' ', '') LIKE $${parameterIndex})`
            );

            values.push(`%${token}%`);

            parameterIndex++;
        }
    }


    const whereClause =
        conditions.length > 0
            ? `WHERE ${conditions.join(" AND ")}`
            : "";


    // Pagination parameters
    const productValues = [...values];

    productValues.push(limit);
    const limitParameter = `$${parameterIndex++}`;

    productValues.push(offset);
    const offsetParameter = `$${parameterIndex}`;


    // Run independent queries in parallel
    const [
        totalResult,
        productsResult,
        newProductsResult,
        topRatedProductsResult,
        priceBoundsResult
    ] = await Promise.all([

        // Total products
        database.query(
            `SELECT COUNT(*) AS total
             FROM products
             ${whereClause}`,
            values
        ),


        // Paginated products
        database.query(
            `SELECT
                products.*,
                COUNT(reviews.id)::INTEGER AS review_count
             FROM products
             LEFT JOIN reviews
             ON products.id = reviews.product_id
             ${whereClause}
             GROUP BY products.id
             ORDER BY products.created_at DESC
             LIMIT ${limitParameter}
             OFFSET ${offsetParameter}`,
            productValues
        ),


        // New products
        database.query(
            `SELECT
                products.*,
                COUNT(reviews.id)::INTEGER AS review_count
             FROM products
             LEFT JOIN reviews
             ON products.id = reviews.product_id
             WHERE products.created_at >= NOW() - INTERVAL '30 days'
             GROUP BY products.id
             ORDER BY products.created_at DESC
             LIMIT 8`
        ),


        // Top rated products
        database.query(
            `SELECT
                products.*,
                COUNT(reviews.id)::INTEGER AS review_count
             FROM products
             LEFT JOIN reviews
             ON products.id = reviews.product_id
             WHERE products.ratings >= 4.5
             GROUP BY products.id
             ORDER BY
                products.ratings DESC,
                products.created_at DESC
             LIMIT 8`
        ),


        // Maximum product price
        database.query(
            `SELECT COALESCE(MAX(price), 0) AS max_price
             FROM products`
        )
    ]);


    const totalProducts =
        Number(totalResult.rows[0].total);

    const maxPrice =
        Number(priceBoundsResult.rows[0].max_price) || 0;


    return {
        products: productsResult.rows,
        totalProducts,
        totalPages:
            Math.ceil(totalProducts / limit),
        currentPage: page,
        limit,
        maxPrice,
        newProducts:
            newProductsResult.rows,
        topRatedProducts:
            topRatedProductsResult.rows,
    };
};


export const updateProduct = async (
    product_id,
    data = {},
    files = []
) => {

    const {
        name,
        description,
        price,
        category,
        stock,
        color,
        colors,
        variants
    } = data;


    // Find existing product
    const existingProduct = await database.query(
        `SELECT *
         FROM products
         WHERE id = $1
         LIMIT 1`,
        [product_id]
    );

    if (existingProduct.rows.length === 0) {
        throw new ErrorHandler(
            "Product not found.",
            404
        );
    }

    const product =
        existingProduct.rows[0];


    // Normal product images
    const imageFiles =
        Array.isArray(files)
            ? files
            : files?.images || [];


    // Color specific images
    const colorImageFiles =
        Array.isArray(files)
            ? []
            : files?.color_images || [];


    // Existing images selected by frontend
    const hasKeepList =
        data.existing_images !== undefined;

    const keepList =
        hasKeepList
            ? parseOptionList(
                data.existing_images
            ).map(String)
            : [];


    // Current values
    let updatedName = product.name;
    let updatedDescription = product.description;
    let updatedPrice = product.price;
    let updatedCategory = product.category;
    let updatedStock = product.stock;
    let updatedColor = product.color;
    let updatedColors = product.colors || [];
    let updatedVariants = product.variants || [];
    let updatedImages = product.images || [];


    // Name
    if (name !== undefined) {

        updatedName = name.trim();

        if (!updatedName) {
            throw new ErrorHandler(
                "Product name cannot be empty.",
                400
            );
        }
    }


    // Description
    if (description !== undefined) {

        updatedDescription =
            description.trim();

        if (!updatedDescription) {
            throw new ErrorHandler(
                "Product description cannot be empty.",
                400
            );
        }
    }


    // Category
    if (category !== undefined) {

        updatedCategory =
            category.trim();

        if (!updatedCategory) {
            throw new ErrorHandler(
                "Product category cannot be empty.",
                400
            );
        }
    }


    // Price
    if (price !== undefined) {

        const value = Number(price);

        if (
            !Number.isInteger(value) ||
            value < 0
        ) {
            throw new ErrorHandler(
                "Price must be a valid non-negative integer.",
                400
            );
        }

        updatedPrice = value;
    }


    // Stock
    if (stock !== undefined) {

        const value = Number(stock);

        if (
            !Number.isInteger(value) ||
            value < 0
        ) {
            throw new ErrorHandler(
                "Stock must be a valid non-negative integer.",
                400
            );
        }

        updatedStock = value;
    }


    // Legacy single color
    if (color !== undefined) {
        updatedColor =
            color?.trim() || null;
    }


    // Colors
    if (colors !== undefined) {

        updatedColors =
            validateColors(
                parseOptionList(colors)
            );

        updatedColor =
            updatedColors[0]?.name || null;
    }


    // Variants
    if (variants !== undefined) {

        updatedVariants =
            validateVariants(
                parseOptionList(variants)
            );
    }


    /*
     * Keep existing images.
     *
     * Cloudinary:
     * public_id is used.
     *
     * Seeded / external images:
     * URL is used because public_id is null.
     */
    const keptImages =
        hasKeepList
            ? updatedImages.filter((image) => {

                const imageIdentifier =
                    image.public_id || image.url;

                return (
                    imageIdentifier &&
                    keepList.includes(
                        String(imageIdentifier)
                    )
                );
            })
            : null;


    // Maximum image validation
    if (
        keptImages &&
        keptImages.length + imageFiles.length > 10
    ) {
        throw new ErrorHandler(
            "Maximum 10 product images are allowed.",
            400
        );
    }


    if (imageFiles.length > 10) {
        throw new ErrorHandler(
            "Maximum 10 product images are allowed.",
            400
        );
    }


    const uploadedImages = [];
    const uploadedColorImages = [];


    try {

        // Upload normal product images
        for (const image of imageFiles) {

            const uploaded =
                await uploadImage(
                    image.buffer,
                    "ecommerce/products"
                );

            uploadedImages.push({
                public_id:
                    uploaded.public_id,
                url:
                    uploaded.secure_url ||
                    uploaded.secured_url,
            });
        }


        /*
         * If frontend sent existing_images,
         * keep selected old images + new uploads.
         */
        if (keptImages !== null) {

            updatedImages = [
                ...keptImages,
                ...uploadedImages
            ];

        } else if (uploadedImages.length > 0) {

            updatedImages =
                uploadedImages;
        }


        // Color images
        if (colors !== undefined) {

            let colorImageIndex = 0;

            for (const color of updatedColors) {

                if (color.hasNewImage) {

                    const file =
                        colorImageFiles[
                            colorImageIndex++
                        ];

                    if (!file) {
                        throw new ErrorHandler(
                            "Missing color image attachment.",
                            400
                        );
                    }


                    const uploaded =
                        await uploadImage(
                            file.buffer,
                            "ecommerce/products"
                        );


                    const image = {
                        public_id:
                            uploaded.public_id,

                        url:
                            uploaded.secure_url ||
                            uploaded.secured_url,
                    };


                    uploadedColorImages.push(
                        image
                    );

                    color.image = image;
                }


                delete color.hasNewImage;

                color.image =
                    color.image || null;
            }
        }


        /*
         * If there are no normal product images,
         * use available color images.
         */
        if (updatedImages.length === 0) {

            updatedImages =
                updatedColors
                    .map(
                        (color) =>
                            color.image
                    )
                    .filter(Boolean);
        }


        // Update database
        const result = await database.query(
            `UPDATE products
             SET name = $1,
                 description = $2,
                 price = $3,
                 category = $4,
                 stock = $5,
                 color = $6,
                 colors = $7,
                 variants = $8,
                 images = $9
             WHERE id = $10
             RETURNING *`,
            [
                updatedName,
                updatedDescription,
                updatedPrice,
                updatedCategory,
                updatedStock,
                updatedColor,
                JSON.stringify(updatedColors),
                JSON.stringify(updatedVariants),
                JSON.stringify(updatedImages),
                product_id
            ]
        );


        // Register newly uploaded media
        await registerMedia([
            ...uploadedImages,
            ...uploadedColorImages,
        ]);


        return result.rows[0];

    } catch (error) {

        /*
         * Database/update failure হলে
         * newly uploaded Cloudinary images cleanup
         */
        const uploaded = [
            ...uploadedImages,
            ...uploadedColorImages,
        ];


        for (const image of uploaded) {

            if (!image.public_id) {
                continue;
            }

            try {

                await deleteImage(
                    image.public_id
                );

            } catch (deleteError) {

                console.error(
                    "Failed to cleanup uploaded image:",
                    deleteError.message
                );
            }
        }


        throw error;
    }
};


export const deleteProduct = async (
    product_id
) => {

    const result = await database.query(
        `DELETE FROM products
         WHERE id = $1
         RETURNING id`,
        [product_id]
    );

    if (result.rows.length === 0) {
        throw new ErrorHandler(
            "Product not found.",
            404
        );
    }

    /*
     * Images are not deleted from Cloudinary.
     * They remain in the media library until
     * an admin deletes them permanently.
     */

    return result.rows[0];
};


export const fetchSingleProduct = async (
    product_id
) => {

    const result = await database.query(
        `SELECT
            products.*,
            COALESCE(
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'review_id', reviews.id,
                        'rating', reviews.rating,
                        'comment', reviews.comment,
                        'reviewer',
                        JSON_BUILD_OBJECT(
                            'id', users.id,
                            'name', users.name,
                            'avatar', users.avatar
                        )
                    )
                ) FILTER (
                    WHERE reviews.id IS NOT NULL
                ),
                '[]'
            ) AS reviews
         FROM products
         LEFT JOIN reviews
         ON products.id = reviews.product_id
         LEFT JOIN users
         ON reviews.user_id = users.id
         WHERE products.id = $1
         GROUP BY products.id`,
        [product_id]
    );

    if (result.rows.length === 0) {
        throw new ErrorHandler(
            "Product not found.",
            404
        );
    }

    return result.rows[0];
};


export const fetchAIFilteredProducts = async (
    userPrompt
) => {

    if (!userPrompt?.trim()) {
        throw new ErrorHandler(
            "Provide a valid prompt.",
            400
        );
    }

    const keywords =
        filterKeywords(
            userPrompt.trim()
        );

    if (keywords.length === 0) {
        return { products: [], fallback: false };
    }

    const result = await database.query(
        `SELECT products.*
         FROM products
         WHERE products.name ILIKE ANY($1::text[])
         OR products.description ILIKE ANY($1::text[])
         OR products.category ILIKE ANY($1::text[])
         LIMIT 100`,
        [keywords]
    );

    if (result.rows.length === 0) {
        return { products: [], fallback: false };
    }

    let recommendedProductIds = null;

    try {
        recommendedProductIds =
            await getAIRecommendation(
                userPrompt,
                result.rows
            );
    } catch (error) {
        console.warn(
            "AI recommendation failed, falling back to keyword matches:",
            error?.message
        );
    }

    // AI unavailable (overloaded model, unparseable reply, missing key):
    // rank the keyword matches locally so the search still returns results.
    if (!Array.isArray(recommendedProductIds)) {

        const needles = keywords.map((keyword) =>
            keyword.replace(/%/g, "").toLowerCase()
        );

        const relevance = (product) => {
            const name = String(product.name || "").toLowerCase();
            const category = String(product.category || "").toLowerCase();
            const description = String(product.description || "").toLowerCase();

            let score = 0;

            for (const needle of needles) {
                if (name.includes(needle)) score += 5;
                if (category.includes(needle)) score += 3;
                if (description.includes(needle)) score += 1;
            }

            if (Number(product.stock) > 0) score += 0.5;
            score += Number(product.ratings) || 0;

            return score;
        };

        const fallbackProducts = [...result.rows]
            .sort((a, b) => relevance(b) - relevance(a))
            .slice(0, 12);

        return { products: fallbackProducts, fallback: true };
    }

    if (recommendedProductIds.length === 0) {
        return { products: [], fallback: false };
    }

    return {
        products: result.rows.filter(
            (product) =>
                recommendedProductIds.includes(
                    product.id
                )
        ),
        fallback: false,
    };
};