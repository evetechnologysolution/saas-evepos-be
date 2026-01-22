import mongoose from "mongoose";
import multer from "multer";
import Convers from "../models/conversation.js";
import Message from "../models/message.js";
import Member from "../models/member.js";
import { cloudinary, imageUpload } from "../lib/cloudinary.js";
import { messageNotif } from "../lib/pusher.js";

// GETTING ALL THE DATA
export const getAllConvers = async (req, res) => {
    try {
        const { page, perPage, search, start, end } = req.query;

        let query = {};

        if (search) {
            const members = await Member.find({
                $or: [
                    { memberId: { $regex: search, $options: "i" } },
                    { cardId: { $regex: search, $options: "i" } },
                    { name: { $regex: search, $options: "i" } },
                    { phone: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                ]
            });
            const filteredMember = members.map((item) => item._id);

            const messages = await Message.find({
                text: { $regex: search, $options: "i" },
            });
            const filteredMessages = messages.map((item) => item._id);

            query = {
                ...query,
                $or: [
                    { memberRef: { $in: filteredMember }, },
                    { lastMessage: { $in: filteredMessages }, },
                ],  // option i for case insensitivity to match upper and lower cases.
            };
        };

        if (start) {
            const dStart = new Date(start);
            dStart.setHours(0, 0, 0, 0);
            const fixStart = new Date(dStart.toISOString()); // Konversi ke UTC string

            const dEnd = new Date(end || start);
            dEnd.setHours(23, 59, 59, 999); // Tetapkan ke akhir hari waktu lokal
            const fixEnd = new Date(dEnd.toISOString());

            query = {
                ...query,
                updatedAt: {
                    $gte: fixStart,
                    $lte: fixEnd
                }
            }
        }

        const options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
            sort: { updatedAt: -1 },
            populate: [
                {
                    path: "member",
                    select: "memberId cardId name firstName lastName phone email",
                },
                {
                    path: "lastMessage",
                    select: "date text image isRead isAdmin",
                },
            ],
        }
        const listofData = await Convers.paginate(query, options);
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const getAllConversByMember = async (req, res) => {
    try {
        const { page, perPage, search, start, end } = req.query;

        let query = { memberRef: req.params.id };


        if (search) {
            const messages = await Message.find({
                text: { $regex: search, $options: "i" },
            });
            const filteredMessages = messages.map((item) => item._id);

            query = {
                ...query,
                lastMessage: { $in: filteredMessages },
            };
        };

        if (start) {
            const dStart = new Date(start);
            dStart.setHours(0, 0, 0, 0);
            const fixStart = new Date(dStart.toISOString()); // Konversi ke UTC string

            const dEnd = new Date(end || start);
            dEnd.setHours(23, 59, 59, 999); // Tetapkan ke akhir hari waktu lokal
            const fixEnd = new Date(dEnd.toISOString());

            query = {
                ...query,
                updatedAt: {
                    $gte: fixStart,
                    $lte: fixEnd
                }
            }
        }

        const options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
            sort: { updatedAt: -1 },
            populate: [
                {
                    path: "member",
                    select: "memberId cardId name firstName lastName phone email",
                },
                {
                    path: "lastMessage",
                    select: "date text image isRead isAdmin",
                },
            ],
        }
        const listofData = await Convers.paginate(query, options);
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const getAllMessages = async (req, res) => {
    try {
        const { page, perPage, search, start, end } = req.query;

        let query = {}

        if (search) {
            const members = await Member.find({
                $or: [
                    { memberId: { $regex: search, $options: "i" } },
                    { cardId: { $regex: search, $options: "i" } },
                    { name: { $regex: search, $options: "i" } },
                    { phone: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                ]
            });
            const filteredMember = members.map((item) => item._id);

            query = {
                ...query,
                $or: [
                    { memberRef: { $in: filteredMember }, },
                    { text: { $regex: search, $options: "i" } }
                ]// option i for case insensitivity to match upper and lower cases.
            };
        };

        if (start) {
            const dStart = new Date(start);
            dStart.setHours(0, 0, 0, 0);
            const fixStart = new Date(dStart.toISOString()); // Konversi ke UTC string

            const dEnd = new Date(end || start);
            dEnd.setHours(23, 59, 59, 999); // Tetapkan ke akhir hari waktu lokal
            const fixEnd = new Date(dEnd.toISOString());

            query = {
                ...query,
                updatedAt: {
                    $gte: fixStart,
                    $lte: fixEnd
                }
            }
        }

        const options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 30,
            sort: { createdAt: -1 },
            populate: [
                // {
                //     path: "member",
                //     select: "memberId cardId name firstName lastName phone email",
                // },
                {
                    path: "reply",
                    select: "text isRead",
                },
            ],
        }
        const listofData = await Message.paginate(query, options);
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const getAllMessagesByMember = async (req, res) => {
    try {
        const { page, perPage, search, start, end, latestId } = req.query;

        let query = { memberRef: req.params.id };

        if (search) {
            query = {
                ...query,
                text: { $regex: search, $options: "i" }, // option i for case insensitivity to match upper and lower cases.
            };
        };

        if (start) {
            const dStart = new Date(start);
            dStart.setHours(0, 0, 0, 0);
            const fixStart = new Date(dStart.toISOString()); // Konversi ke UTC string

            const dEnd = new Date(end || start);
            dEnd.setHours(23, 59, 59, 999); // Tetapkan ke akhir hari waktu lokal
            const fixEnd = new Date(dEnd.toISOString());

            query = {
                ...query,
                updatedAt: {
                    $gte: fixStart,
                    $lte: fixEnd
                }
            }
        }

        if (latestId) {
            const objectId = mongoose.Types.ObjectId.isValid(latestId) ? new mongoose.Types.ObjectId(latestId) : null;
            if (objectId) {
                query = {
                    ...query,
                    _id: {
                        $lt: objectId
                    }
                }
            }
        }

        const options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 30,
            sort: { createdAt: -1 },
            populate: [
                // {
                //     path: "member",
                //     select: "memberId cardId name firstName lastName phone email",
                // },
                {
                    path: "reply",
                    select: "text isRead",
                },
            ],
        }
        const listofData = await Message.paginate(query, options);
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// GETTING A SPECIFIC DATA BY ID
export const getConversById = async (req, res) => {
    try {
        const spesificData = await Convers.findById(req.params.id);
        return res.json(spesificData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// GETTING A SPECIFIC DATA BY ID
export const getMessageById = async (req, res) => {
    try {
        const spesificData = await Message.findById(req.params.id);
        return res.json(spesificData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// CREATE MESSAGE
export const createMessage = async (req, res) => {
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

            const _messageId = new mongoose.Types.ObjectId();

            let objData = { _id: _messageId, ...req.body };

            if (objData.admin) {
                objData.isAdmin = true;
            }

            if (req.file) {
                const cloud = await cloudinary.uploader.upload(req.file.path, {
                    folder: process.env.FOLDER_PRODUCT,
                    format: "webp",
                    transformation: [
                        { quality: "auto:low" } // Adjust the compression level if desired
                    ]
                });
                objData = { ...objData, image: cloud.secure_url, imageId: cloud.public_id };
            }

            const dataConvers = await Convers.findOneAndUpdate(
                { memberRef: req.body.member },
                {
                    $set: {
                        lastMessage: _messageId
                    }
                },
                { new: true, upsert: true }
            );

            if (dataConvers) {
                objData.conversation = dataConvers._id;
            }

            const data = new Message(objData);
            const newData = await data.save();

            if (newData) {
                const channel = newData.isAdmin ? `chat-${newData.member}` : "chat-admin";
                const event = "chat-received";
                await messageNotif(channel, event, { ...newData.toObject(), message: "Pesan Baru!" });
            }

            return res.json(newData);
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// UPDATE MESSAGE
export const editMessage = async (req, res) => {
    try {
        const updatedData = await Message.findOneAndUpdate(
            { _id: req.params.id },
            { $set: req.body },
            { new: true, upsert: false }
        );
        return res.json(updatedData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// UPDATE MESSAGE STATUS
export const editMessageStatusForAdmin = async (req, res) => {
    try {
        const updatedData = await Message.updateMany(
            { memberRef: req.params.id, isAdmin: false, isRead: false }, // update status pesan yang dikirim member
            {
                $set: { isRead: true }
            }
        );
        return res.json(updatedData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// UPDATE MESSAGE STATUS
export const editMessageStatusForMember = async (req, res) => {
    try {
        const updatedData = await Message.updateMany(
            { memberRef: req.params.id, isAdmin: true, isRead: false }, // update status pesan yang dikirim admin
            {
                $set: { isRead: true }
            }
        );
        return res.json(updatedData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// DELETE A SPECIFIC DATA
export const deleteConvers = async (req, res) => {
    try {
        await Message.deleteMany({ conversation: req.params.id });
        const deletedData = await Convers.deleteOne({ _id: req.params.id });
        return res.json(deletedData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// DELETE A SPECIFIC DATA
export const deleteMessage = async (req, res) => {
    try {
        // Chek image & delete image
        const check = await Message.findById(req.params.id);
        if (check.imageId) {
            await cloudinary.uploader.destroy(check.imageId);
        }
        const deletedData = await Message.deleteOne({ _id: req.params.id });
        return res.json(deletedData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};