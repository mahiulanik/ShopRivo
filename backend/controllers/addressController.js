import asyncErrorsHandler from "../middlewares/asyncErrorsHandler.js";
import * as addressService from "../services/addressService.js";


export const getAddressController = asyncErrorsHandler(async (req, res) => {

    const address = await addressService.getAddress(req.user.user_id);

    return res.status(200).json({
        success: true,
        address,
    });
});


export const createAddressController = asyncErrorsHandler(async (req, res) => {

    const address = await addressService.createAddress(
        req.user.user_id,
        req.body
    );

    return res.status(201).json({
        success: true,
        message: "Address saved successfully.",
        address,
    });
});


export const updateAddressController = asyncErrorsHandler(async (req, res) => {

    const address = await addressService.updateAddress(
        req.user.user_id,
        req.params.id,
        req.body
    );

    return res.status(200).json({
        success: true,
        message: "Address updated successfully.",
        address,
    });
});


export const deleteAddressController = asyncErrorsHandler(async (req, res) => {

    const address = await addressService.deleteAddress(
        req.user.user_id,
        req.params.id
    );

    return res.status(200).json({
        success: true,
        message: "Address deleted successfully.",
        address,
    });
});