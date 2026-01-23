import multer from "multer";
import Receipt from "../../models/setting/receipt.js";
import { cloudinary, imageUpload } from "../../lib/cloudinary.js";
import { errorResponse } from "../../utils/errorResponse.js";

// GETTING ALL THE DATA
export const getAllReceipt = async (req, res) => {
    try {
        let qMatch = {};

        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qMatch.outletRef = req.userData?.outletRef;
        }

        const listofData = await Receipt.findOne(qMatch);
        return res.json(listofData);
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};

// CREATE NEW DATA
export const saveReceipt = async (req, res) => {
    try {
        imageUpload.single("image")(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({
                    status: "Failed",
                    message: "Failed to upload image",
                });
            } else if (err) {
                return res.status(400).json({
                    status: "Failed",
                    message: err.message.message,
                });
            }

            let objData = req.body;

            if (req.userData) {
                objData.tenantRef = req.userData?.tenantRef;
                objData.outletRef = req.userData?.outletRef;
            }

            if (req.file) {
                const cloud = await cloudinary.uploader.upload(req.file.path, {
                    folder: process.env.FOLDER_PRODUCT,
                    format: "webp",
                    transformation: [
                        // { width: 100, height: 100, crop: "fit" }, // Adjust the width and height as needed
                        { quality: "auto:low" }, // Adjust the compression level if desired
                    ],
                });
                if (cloud.public_id) {
                    const exist = await Receipt.findOne({ _id: { $ne: null } });
                    if (exist?.imageId) {
                        await cloudinary.uploader.destroy(exist.imageId); // delete old
                    }

                    objData = {
                        ...objData,
                        image: cloud.secure_url,
                        imageId: cloud.public_id,
                    };
                }
            }

            const data = await Receipt.findOneAndUpdate(
                {
                    _id: { $ne: null },
                },
                objData,
                { new: true, upsert: true },
            );
            return res.json(data);
        });
    } catch (err) {
        return errorResponse(res, {
            statusCode: 500,
            code: "SERVER_ERROR",
            message: err.message || "Terjadi kesalahan pada server",
        });
    }
};
