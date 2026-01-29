import bcrypt from "bcrypt";
import Member from "../../models/member/member.js";
import MemberPending from "../../models/member/memberPending.js";
import MemberVoucher from "../../models/member/voucherMember.js";
import Order from "../../models/pos/order.js";
import { convertToE164 } from "../../lib/textSetting.js";

// GETTING ALL THE DATA
export const getAllMember = async (req, res) => {
    try {
        const { page, perPage, search } = req.query;
        let qMatch = {};
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }
        if (search) {
            qMatch = {
                ...qMatch,
                $or: [
                    { memberId: { $regex: search, $options: "i" } },
                    { cardId: { $regex: search, $options: "i" } },
                    { name: { $regex: search, $options: "i" } },
                    {
                        phone: {
                            $regex: isNaN(search)
                                ? search
                                : convertToE164(search),
                            $options: "i",
                        },
                    },
                    { email: { $regex: search, $options: "i" } },
                ], // option i for case insensitivity to match upper and lower cases.
            };
        }

        const options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
            sort: { name: 1 },
            select: "-password -otp -resetToken -resetTokenExpiry",
        };
        const listofData = await Member.paginate(qMatch, options);
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const getAllMemberPending = async (req, res) => {
    try {
        const { page, perPage, search } = req.query;
        let qMatch = {};
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }
        if (search) {
            qMatch = {
                ...qMatch,
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    {
                        phone: {
                            $regex: isNaN(search)
                                ? search
                                : convertToE164(search),
                            $options: "i",
                        },
                    },
                    { email: { $regex: search, $options: "i" } },
                ], // option i for case insensitivity to match upper and lower cases.
            };
        }

        const options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
            sort: { name: 1 },
            select: "-password -otp -resetToken -resetTokenExpiry",
        };
        const listofData = await MemberPending.paginate(qMatch, options);
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const getMemberById = async (req, res) => {
    try {
        const { id } = req.params;
        let qMatch = { _id: id };
        let qVoucher = {
            memberRef: id,
            isUsed: { $ne: true },
            expiry: { $gt: new Date() },
        };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
            qVoucher.tenantRef = req.userData?.tenantRef;
        }

        const [memberResult, voucherCount] = await Promise.all([
            Member.findOne(qMatch).lean(),
            MemberVoucher.countDocuments(qVoucher),
        ]);

        if (!memberResult) {
            return res.status(404).json({ message: "Member not found" });
        }

        return res.json({
            ...memberResult,
            voucher: voucherCount,
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const checkMember = async (req, res) => {
    try {
        const { search } = req.body;

        if (!search || typeof search !== "string") {
            return res.status(400).json({ message: "Invalid search qMatch" });
        }

        let qMatch = {
            $or: [
                { email: { $regex: `^${search}$`, $options: "i" } },
                { phone: convertToE164(search) },
            ],
        };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }

        const spesificData = await Member.findOne(qMatch)
            .select(
                "_id memberId cardId name firstName lastName phone email isVerified",
            )
            .lean();

        if (!spesificData) {
            if (req.query.onlyCheck) {
                return res
                    .status(200)
                    .json({ message: "Can register as a member" });
            }
            return res.status(400).json({ message: "Data not found" });
        }

        return res.json(spesificData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const getMemberBySearch = async (req, res) => {
    try {
        const { search } = req.query;

        if (!search || typeof search !== "string") {
            return res.status(400).json({ message: "Invalid search qMatch" });
        }

        const keyword = search.trim();
        const phoneSearch = isNaN(keyword) ? keyword : convertToE164(keyword);

        let qMatch = {
            $or: [
                { memberId: { $regex: `^${keyword}$`, $options: "i" } },
                { cardId: { $regex: `^${keyword}$`, $options: "i" } },
                { name: { $regex: `^${keyword}$`, $options: "i" } },
                { phone: { $regex: `^${phoneSearch}$`, $options: "i" } },
            ],
        };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }

        const member = await Member.findOne(qMatch).lean();

        if (!member) {
            return res.status(404).json({ message: "Data not found" });
        }

        let qVoucher = {
            memberRef: member._id,
            isUsed: { $ne: true },
            expiry: { $gt: new Date() },
        };
        if (req.userData) {
            qVoucher.tenantRef = req.userData?.tenantRef;
        }

        const voucherCount = await MemberVoucher.countDocuments(qVoucher);

        return res.json({
            ...member,
            voucher: voucherCount,
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// CREATE NEW DATA
export const addMember = async (req, res) => {
    try {
        let objData = req.body;
        let qCheck = { phone: objData.phone };

        if (req.userData) {
            objData.tenantRef = req.userData?.tenantRef;
            qCheck.tenantRef = req.userData?.tenantRef;
        }

        // Chek member
        const exist = await Member.findOne(qCheck);
        if (exist)
            return res.json({ status: 400, message: "Phone already exists" });

        if (typeof objData.password === "string") {
            if (objData.password.trim() === "") {
                delete objData.password;
            } else {
                const salt = await bcrypt.genSalt(10);
                objData.password = await bcrypt.hash(objData.password, salt);
            }
        }

        const data = new Member(objData);
        const newData = await data.save();
        return res.json(newData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// UPDATE A SPECIFIC DATA
export const editMember = async (req, res) => {
    try {
        let objData = req.body;
        const _memberId = req.params.id;
        let qCheck = {
            phone: objData.phone,
            _id: { $ne: _memberId },
        };

        if (req.userData) {
            qCheck.tenantRef = req.userData?.tenantRef;
        }

        // Cek apakah member ada
        const spesificData = await Member.findById(_memberId);
        if (!spesificData) {
            return res
                .status(404)
                .json({ status: 404, message: "Member not found" });
        }

        if (objData.phone) {
            const exist = await Member.findOne(qCheck);
            if (exist) {
                return res
                    .status(400)
                    .json({ status: 400, message: "Phone already exists" });
            }
        }

        if (typeof objData.password === "string") {
            if (objData.password.trim() === "") {
                delete objData.password;
            } else {
                const salt = await bcrypt.genSalt(10);
                objData.password = await bcrypt.hash(objData.password, salt);
            }
        }

        if (objData.clearAddresses) {
            await Member.findByIdAndUpdate(_memberId, {
                $set: { addresses: [] },
            });
            delete objData.clearAddresses;
        }

        const updatedData = await Member.findByIdAndUpdate(
            _memberId,
            { $set: objData },
            { new: true, fields: { password: 0, otp: 0 } },
        );

        const checkVoucher = await MemberVoucher.find({
            memberRef: _memberId,
            isUsed: { $ne: true },
            expiry: { $gt: new Date() },
        });

        if (updatedData?.memberId) {
            await Order.updateMany(
                { "customer.memberId": updatedData.memberId },
                {
                    $set: {
                        "customer.name": updatedData.name,
                        "customer.phone": updatedData.phone,
                        "customer.email": updatedData.email,
                    },
                },
            );
        }

        return res.json({
            ...updatedData.toObject(),
            voucher: checkVoucher.length || 0,
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// UPDATE PASSWORD
export const changeMemberPassword = async (req, res) => {
    try {
        // Chek member
        let qMatch = { _id: req.params.id };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }
        const exist = await Member.findOne(qMatch);
        if (!exist)
            return res.status(400).json({ message: "Member is not found" });

        if (req.body.oldPassword) {
            const validPassword = await bcrypt.compare(
                req.body.oldPassword,
                exist.password,
            );
            if (!validPassword)
                return res
                    .status(400)
                    .json({ message: "Old password incorrect" });
        }

        if (req.body.confirmPassword) {
            if (req.body.confirmPassword !== req.body.password) {
                return res
                    .status(400)
                    .json({ message: "Confirm password incorrect" });
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        const objPassword = {
            password: hashedPassword,
        };

        const updatedData = await Member.updateOne(qMatch, {
            $set: objPassword,
        });
        return res.json(updatedData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// DELETE A SPECIFIC DATA
export const deleteMember = async (req, res) => {
    try {
        let qMatch = { _id: req.params.id };
        if (req.userData) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }
        const deletedData = await Member.deleteOne(qMatch);
        return res.json(deletedData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
