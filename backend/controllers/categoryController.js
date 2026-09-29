import asyncErrorsHandler from "../middlewares/asyncErrorsHandler.js";
import * as categoryService from "../services/categoryService.js";


export const getAllCategoriesController = asyncErrorsHandler(async (req, res) => {

    const categories = await categoryService.getAllCategories();

    return res.status(200).json({
        success: true,
        categories,
    });
});


export const createCategoryController = asyncErrorsHandler(async (req, res) => {

    const category = await categoryService.createCategory(req.body.name);

    return res.status(201).json({
        success: true,
        message: "Category created successfully.",
        category,
    });
});


export const updateCategoryController = asyncErrorsHandler(async (req, res) => {

    const category = await categoryService.updateCategory(
        req.params.id,
        req.body.name
    );

    return res.status(200).json({
        success: true,
        message: "Category updated successfully.",
        category,
    });
});


export const deleteCategoryController = asyncErrorsHandler(async (req, res) => {

    await categoryService.deleteCategory(req.params.id);

    return res.status(200).json({
        success: true,
        message: "Category deleted successfully.",
    });
});