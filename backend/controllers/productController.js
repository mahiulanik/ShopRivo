import asyncErrorsHandler from "../middlewares/asyncErrorsHandler.js";
import * as productService from "../services/productService.js";


export const createProductController = asyncErrorsHandler(async (req, res) => {

    const product = await productService.createProduct(
        req.user.user_id,
        req.body,
        req.files
    );

    return res.status(201).json({
        success: true,
        message: "Product created successfully.",
        product,
    });
});


export const fetchAllProductsController = asyncErrorsHandler(async (req, res) => {

    const result = await productService.fetchAllProducts(req.query);

    return res.status(200).json({
        success: true,
        ...result,
    });
});


export const updateProductController = asyncErrorsHandler(async (req, res) => {

    const product = await productService.updateProduct(
        req.params.productId,
        req.body,
        req.files
    );

    return res.status(200).json({
        success: true,
        message: "Product updated successfully.",
        product,
    });
});


export const deleteProductController = asyncErrorsHandler(async (req, res) => {

    await productService.deleteProduct(req.params.productId);

    return res.status(200).json({
        success: true,
        message: "Product deleted successfully.",
    });
});


export const fetchSingleProductController = asyncErrorsHandler(async (req, res) => {

    const product = await productService.fetchSingleProduct(req.params.productId);

    return res.status(200).json({
        success: true,
        message: "Product fetched successfully.",
        product,
    });
});


export const fetchAIFilteredProductsController = asyncErrorsHandler(async (req, res) => {

    const { products, fallback } = await productService.fetchAIFilteredProducts(
        req.body.userPrompt
    );

    return res.status(200).json({
        success: true,
        message: fallback
            ? "AI is busy right now - showing the closest matches instead."
            : products.length
                ? "AI recommended products fetched successfully."
                : "No products found matching your prompt.",
        products,
    });
});