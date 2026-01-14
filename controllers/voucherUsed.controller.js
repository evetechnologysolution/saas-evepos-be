import Used from "../models/voucherUsed.js";
import Member from "../models/member.js";

// GETTING ALL THE DATA
export const getAllUsed = async (req, res) => {
    try {
        const { page, perPage, search } = req.query;
        let query = {};
        if (search) {
            const members = await Member.find({
                $or: [
                    { memberId: { $regex: search, $options: "i" } },
                    { cardId: { $regex: search, $options: "i" } },
                    { name: { $regex: search, $options: "i" } },
                    { phone: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } }
                ]
            });
            const filteredMember = members.map((item) => item._id);

            query = {
                ...query,
                $or: [
                    { _id: { $regex: search, $options: "i" } },
                    { voucher: { $regex: search, $options: "i" } },
                    { memberRef: { $in: filteredMember } },
                ],  // option i for case insensitivity to match upper and lower cases.
            };
        };
        const options = {
            populate: [
                {
                    path: "member",
                    select: ["memberId", "cardId", "name", "phone", "email"],
                },
            ],
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
            sort: { date: -1 },
        }
        const listofData = await Used.paginate(query, options);
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const getUsedById = async (req, res) => {
    try {
        const spesificData = await Used.findById(req.params.id);
        return res.json(spesificData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const checkUsed = async (req, res) => {
    try {
        const { member, voucher } = req.body;

        if (!member || !voucher) {
            return res.status(400).json({ message: "Member and voucher are required." });
        }

        const spesificData = await Used.findOne({ member, voucher });

        return res.json({
            used: !!spesificData // Simplified to convert truthy value to boolean
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const checkUsedByPhone = async (req, res) => {
    try {
        const { phone, voucher } = req.body;

        if (!phone || !voucher) {
            return res.status(400).json({ message: "Phone and voucher are required." });
        }

        const spesificData = await Used.findOne({ phone, voucher });

        return res.json({
            used: !!spesificData // Simplified to convert truthy value to boolean
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
