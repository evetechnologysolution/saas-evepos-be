import bcrypt from "bcrypt";
import Member from "../models/member.js";
import MemberPending from "../models/memberPending.js";
import MemberVoucher from "../models/voucherMember.js";
import Order from "../models/order.js";
import { convertToE164 } from "../lib/textSetting.js";

// GETTING ALL THE DATA
export const getAllMember = async (req, res) => {
  try {
    const { page, perPage, search } = req.query;
    let query = {};
    if (search) {
      query = {
        ...query,
        $or: [
          { memberId: { $regex: search, $options: "i" } },
          { cardId: { $regex: search, $options: "i" } },
          { name: { $regex: search, $options: "i" } },
          {
            phone: {
              $regex: isNaN(search) ? search : convertToE164(search),
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
    const listofData = await Member.paginate(query, options);
    return res.json(listofData);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getAllMemberPending = async (req, res) => {
  try {
    const { page, perPage, search } = req.query;
    let query = {};
    if (search) {
      query = {
        ...query,
        $or: [
          { name: { $regex: search, $options: "i" } },
          {
            phone: {
              $regex: isNaN(search) ? search : convertToE164(search),
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
    const listofData = await MemberPending.paginate(query, options);
    return res.json(listofData);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getMemberById = async (req, res) => {
  try {
    const checkVoucher = await MemberVoucher.find({
      member: req.params.id,
      isUsed: { $ne: true },
      expiry: { $gt: new Date() },
    });
    const spesificData = await Member.findById(req.params.id);
    return res.json({
      ...spesificData.toObject(),
      voucher: checkVoucher.length || 0,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const checkMember = async (req, res) => {
  try {
    const { search } = req.body;

    if (!search || typeof search !== "string") {
      return res.status(400).json({ message: "Invalid search query" });
    }

    const spesificData = await Member.findOne({
      $or: [
        { email: { $regex: `^${search}$`, $options: "i" } },
        { phone: convertToE164(search) },
      ],
    }).select("_id memberId cardId name firstName lastName phone email isVerified");

    if (!spesificData) {
      if (req.query.onlyCheck) {
        return res.status(200).json({ message: "Can register as a member" });
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
      return res.status(400).json({ message: "Invalid search query" });
    }

    const spesificData = await Member.findOne({
      $or: [
        { memberId: { $regex: `^${search}$`, $options: "i" } },
        { cardId: { $regex: `^${search}$`, $options: "i" } },
        { name: { $regex: `^${search}$`, $options: "i" } },
        {
          phone: {
            $regex: `^${isNaN(search) ? search : convertToE164(search)}$`,
            $options: "i",
          },
        },
      ],
    });

    if (!spesificData) {
      return res.status(400).json({ message: "Data not found" });
    }

    const checkVoucher = await MemberVoucher.find({
      member: spesificData._id,
      isUsed: { $ne: true },
      expiry: { $gt: new Date() },
    });
    return res.json({
      ...spesificData.toObject(),
      voucher: checkVoucher.length || 0,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// CREATE NEW DATA
export const addMember = async (req, res) => {
  try {
    let objData = req.body;

    // Chek member
    // const exist = await Member.findOne({ email: objData.email });
    // if (exist) return res.json({ status: 400, message: "Email already exists" });
    const exist = await Member.findOne({ phone: objData.phone });
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
    const memberId = req.params.id;

    // Cek apakah member ada
    const spesificData = await Member.findById(memberId);
    if (!spesificData) {
      return res.status(404).json({ status: 404, message: "Member not found" });
    }

    if (objData.phone) {
      const exist = await Member.findOne({
        phone: objData.phone,
        _id: { $ne: memberId },
      });
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
      await Member.findByIdAndUpdate(memberId, { $set: { addresses: [] } });
      delete objData.clearAddresses;
    }

    const updatedData = await Member.findByIdAndUpdate(
      memberId,
      { $set: objData },
      { new: true, fields: { password: 0, otp: 0 } }
    );

    const checkVoucher = await MemberVoucher.find({
      member: memberId,
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
          }
        }
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
    const exist = await Member.findById(req.params.id);
    if (!exist) return res.status(400).json({ message: "Member is not found" });

    if (req.body.oldPassword) {
      const validPassword = await bcrypt.compare(
        req.body.oldPassword,
        exist.password
      );
      if (!validPassword)
        return res.status(400).json({ message: "Old password incorrect" });
    }

    if (req.body.confirmPassword) {
      if (req.body.confirmPassword !== req.body.password) {
        return res.status(400).json({ message: "Confirm password incorrect" });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    const objPassword = {
      password: hashedPassword,
    };

    const updatedData = await Member.updateOne(
      { _id: req.params.id },
      {
        $set: objPassword,
      }
    );
    return res.json(updatedData);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// DELETE A SPECIFIC DATA
export const deleteMember = async (req, res) => {
  try {
    const deletedData = await Member.deleteOne({ _id: req.params.id });
    return res.json(deletedData);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
