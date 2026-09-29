import express from "express";

const router = express.Router()

import * as addressController from "../controllers/addressController.js"
import { isAuthenticated } from "../middlewares/authMiddleware.js";


router.get("/", isAuthenticated, addressController.getAddressController);
router.post("/", isAuthenticated, addressController.createAddressController);
router.patch("/:id", isAuthenticated, addressController.updateAddressController);
router.delete("/:id", isAuthenticated, addressController.deleteAddressController);

export default router
