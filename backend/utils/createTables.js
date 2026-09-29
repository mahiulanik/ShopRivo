import { createUserTable } from "../models/userTable.js";
import { createRefreshSessionTable } from "../models/refreshSessionsTable.js";
import { createOrderItemTable } from "../models/orderItemsTable.js";
import { createOrdersTable } from "../models/ordersTable.js";
import { createPaymentsTable } from "../models/paymentsTable.js";
import { createProductReviewsTable } from "../models/productReviewsTable.js";
import { createProductsTable } from "../models/productTable.js";
import { createCategoriesTable } from "../models/categoryTable.js";
import { createShippingInfoTable } from "../models/shippinginfoTable.js";
import { createMediaTable } from "../models/mediaTable.js";
import { createCouponsTable } from "../models/couponTable.js";

const createTables = async () => {
  try {
    await createUserTable();
    await createRefreshSessionTable();
    await createProductsTable();
    await createCategoriesTable();
    await createProductReviewsTable();
    await createOrdersTable();
    await createOrderItemTable();
    await createShippingInfoTable();
    await createPaymentsTable();
    await createMediaTable();
    await createCouponsTable();

  } catch (error) {
    console.error("Error creating tables:", error);
  }
};

export default createTables;