import "dotenv/config";
import database from "../config/db.js";


// DummyJSON category → Our category
const categoryMap = {
    "home-appliances": "Appliances",
    "kitchen-accessories": "Appliances",

    "laptops": "Gadgets",
    "tablets": "Gadgets",
    "mobile-accessories": "Gadgets",

    "smartphones": "Phones",

    "mens-watches": "Watches",
    "womens-watches": "Watches",
};


const seedProducts = async () => {

    try {

        // Find Admin/Uploader
        const userResult = await database.query(
            `SELECT id
             FROM users
             WHERE role IN ('Admin', 'Uploader')
             LIMIT 1`
        );


        if (userResult.rows.length === 0) {
            throw new Error(
                "No Admin or Uploader user found."
            );
        }


        const userId = userResult.rows[0].id;


        // Fetch all products from DummyJSON
        const response = await fetch(
            "https://dummyjson.com/products?limit=0"
        );


        if (!response.ok) {
            throw new Error(
                "Failed to fetch products from DummyJSON."
            );
        }


        const data = await response.json();


        // Keep only required categories
        const products = data.products.filter(
            (product) =>
                categoryMap[product.category]
        );


        let inserted = 0;


        for (const product of products) {

            // Convert image format
            const images = (
                product.images || []
            )
                .slice(0, 10)
                .map((url) => ({
                    public_id: null,
                    url,
                }));


            // Use thumbnail if images are missing
            if (
                images.length === 0 &&
                product.thumbnail
            ) {

                images.push({
                    public_id: null,
                    url: product.thumbnail,
                });
            }


            // Convert USD-style price to BDT integer
            const price = Math.round(
                Number(product.price) * 120
            );


            await database.query(
                `
                INSERT INTO products
                (
                    name,
                    description,
                    price,
                    category,
                    color,
                    colors,
                    variants,
                    ratings,
                    images,
                    stock,
                    created_by
                )
                VALUES
                (
                    $1, $2, $3, $4, $5,
                    $6, $7, $8, $9, $10, $11
                )
                `,
                [
                    product.title.trim(),
                    product.description.trim(),

                    price,

                    categoryMap[
                        product.category
                    ],

                    null,

                    JSON.stringify([]),

                    JSON.stringify([]),

                    Number(
                        product.rating
                    ) || 0,

                    JSON.stringify(
                        images
                    ),

                    Number(
                        product.stock
                    ) || 0,

                    userId,
                ]
            );


            inserted++;
        }


        console.log(
            `✅ ${inserted} products seeded successfully.`
        );


    } catch (error) {

        console.error(
            "❌ Product seeding failed:",
            error
        );

    } finally {

        await database.end();

    }
};


seedProducts();