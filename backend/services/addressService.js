import ErrorHandler from "../middlewares/errorMiddleware.js";
import database from "../config/db.js";


export const getAddress = async (user_id) => {

    const result = await database.query(
        `SELECT
            id,
            contact_name,
            phone,
            address,
            area,
            district,
            city,
            pincode,
            country,
            created_at
         FROM shipping_info
         WHERE user_id = $1
         AND order_id IS NULL
         LIMIT 1`,
        [user_id]
    );

    return result.rows[0] || null;
};


export const createAddress = async (user_id, data) => {

    const {contact_name, phone, address, area, district, city, pincode, country} = data;

    if (!contact_name || !phone || !address || !district || !city || !pincode || !country) {
        throw new ErrorHandler("Please provide all required fields.", 400);
    }

    const existingAddress = await database.query(
        `SELECT id
         FROM shipping_info
         WHERE user_id = $1
         AND order_id IS NULL
         LIMIT 1`,
        [user_id]
    );

    if (existingAddress.rows.length > 0) {
        throw new ErrorHandler("You already have a saved address. Please update it instead.", 400);
    }

    const result = await database.query(
        `INSERT INTO shipping_info
            (user_id, contact_name, phone, address, area, district, city, pincode, country)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING
            id,
            contact_name,
            phone,
            address,
            area,
            district,
            city,
            pincode,
            country,
            created_at`,
        [
            user_id,
            contact_name.trim(),
            phone.trim(),
            address.trim(),
            area?.trim() || null,
            district.trim(),
            city.trim(),
            pincode.trim(),
            country.trim()
        ]
    );

    return result.rows[0];
};


export const updateAddress = async (user_id, address_id, data) => {

    const {contact_name, phone, address, area, district, city, pincode, country} = data;

    if (!contact_name || !phone || !address || !district || !city || !pincode || !country) {
        throw new ErrorHandler("Please provide all required fields.", 400);
    }

    const result = await database.query(
        `UPDATE shipping_info
         SET contact_name = $1,
             phone = $2,
             address = $3,
             area = $4,
             district = $5,
             city = $6,
             pincode = $7,
             country = $8
         WHERE id = $9
         AND user_id = $10
         AND order_id IS NULL
         RETURNING
            id,
            contact_name,
            phone,
            address,
            area,
            district,
            city,
            pincode,
            country,
            created_at`,
        [
            contact_name.trim(),
            phone.trim(),
            address.trim(),
            area?.trim() || null,
            district.trim(),
            city.trim(),
            pincode.trim(),
            country.trim(),
            address_id,
            user_id
        ]
    );

    if (result.rows.length === 0) {
        throw new ErrorHandler("Address not found.", 404);
    }

    return result.rows[0];
};


export const deleteAddress = async (user_id, address_id) => {

    const result = await database.query(
        `DELETE FROM shipping_info
         WHERE id = $1
         AND user_id = $2
         AND order_id IS NULL
         RETURNING id`,
        [address_id, user_id]
    );

    if (result.rows.length === 0) {
        throw new ErrorHandler("Address not found.", 404);
    }

    return result.rows[0];
};