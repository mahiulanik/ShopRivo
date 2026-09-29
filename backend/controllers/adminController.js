import asyncErrorsHandler from "../middlewares/asyncErrorsHandler.js";
import * as adminService from "../services/adminService.js";


export const getAllUsersController = asyncErrorsHandler(async (req, res) => {

    const result = await adminService.getAllUsers(req.query);

    return res.status(200).json({
        success: true,
        ...result,
    });
});


export const deleteUserController = asyncErrorsHandler(async (req, res) => {

    await adminService.deleteUser(req.params.id);

    return res.status(200).json({
        success: true,
        message: "User deleted successfully.",
    });
});


export const updateUserRoleController = asyncErrorsHandler(async (req, res) => {

    const user = await adminService.updateUserRole(
        req.params.id,
        req.body.role,
        req.user.user_id
    );

    return res.status(200).json({
        success: true,
        message: `${user.name}'s role is now ${user.role}.`,
        user,
    });
});


export const getAllReviewsController = asyncErrorsHandler(async (req, res) => {

    const result = await adminService.getAllReviews(req.query);

    return res.status(200).json({
        success: true,
        ...result,
    });
});


export const deleteReviewController = asyncErrorsHandler(async (req, res) => {

    await adminService.deleteReview(req.params.id);

    return res.status(200).json({
        success: true,
        message: "Review deleted successfully.",
    });
});


export const dashboardStatsController = asyncErrorsHandler(async (req, res) => {

    const stats = await adminService.dashboardStats();

    return res.status(200).json({
        success: true,
        message: "Dashboard stats fetched successfully.",
        ...stats,
    });
});