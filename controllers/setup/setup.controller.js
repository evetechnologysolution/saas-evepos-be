import Setting from "../../models/setting/settings.js";
import Tax from "../../models/setting/tax.js";
import Receipt from "../../models/setting/receipt.js";
import Balance from "../../models/cashBalance/cashBalance.js";
import Product from "../../models/library/product.js";
import Category from "../../models/library/category.js";
import Subcategory from "../../models/library/subcategory.js";
import { errorResponse } from "../../utils/errorResponse.js";

// GETTING ALL THE DATA
export const getAllSetup = async (req, res) => {
    try {
        const qMatch = {
            ...(req.userData?.tenantRef && {
                tenantRef: req.userData.tenantRef,
            }),
            ...(req.userData?.outletRef && {
                outletRef: req.userData.outletRef,
            }),
        };

        const [
            settingResult,
            taxResult,
            receiptResult,
            balanceResult,
            productResult,
            categoryResult,
            subcategoryResult,
        ] = await Promise.all([
            Setting.findOne(qMatch).lean(),
            Tax.findOne(qMatch).lean(),
            Receipt.findOne(qMatch).lean(),
            Balance.findOne({ ...qMatch, isOpen: true }).lean(),
            Product.find(qMatch).lean(),
            Category.find(qMatch).lean(),
            Subcategory.find(qMatch).lean(),
        ]);

        return res.json({
            setting: settingResult,
            tax: taxResult,
            receipt: receiptResult,
            existBalance: balanceResult,
            product: productResult,
            category: categoryResult,
            subcategory: subcategoryResult,
        });
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};
