import bcrypt from "bcrypt";
import multer from "multer";
import User from "../models/core/user.js";
import Counter from "../models/counter.js";
import { imageUpload } from "../lib/fileUpload.js";
import { cloudinary } from "../lib/cloudinary.js";

// GETTING ALL THE DATA
export const getAllUser = async (req, res) => {
  try {
    const { page, perPage, search, status, role } = req.query;
    let query = {};
    if (search) {
      query = {
        ...query,
        $or: [
          { userId: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } },
          { fullname: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ], // option i for case insensitivity to match upper and lower cases.
      };
    }

    if (status === "active") {
      query = {
        ...query,
        isActive: { $eq: true },
      };
    }

    if (
      status === "inactive" ||
      status === "nonactive" ||
      status === "notactive"
    ) {
      query = {
        ...query,
        isActive: { $ne: true },
      };
    }

    if (role) {
      query.role = role;
    }

    const options = {
      page: parseInt(page, 10) || 1,
      limit: parseInt(perPage, 10) || 10,
      sort: { fullname: 1 },
      select: "-password",
    };
    const listofData = await User.paginate(query, options);
    return res.json(listofData);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const spesificData = await User.findById(req.params.id);
    return res.json(spesificData);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// CREATE NEW DATA
export const addUser = async (req, res) => {
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
          message: err.message,
        });
      }

      let objData = req.body;

      // Check user
      const userExist = await User.findOne({ username: objData.username });
      if (userExist)
        return res.json({ status: 400, message: "Username already exists" });

      if (!objData.userId) {
        // generate auto increment
        const currYear = new Date().getFullYear();
        const count = await Counter.findOneAndUpdate(
          {
            $and: [{ name: "Admin" }, { year: currYear }],
          },
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        );

        const str = "" + count.seq;
        const pad = "000000";
        const number = pad.substring(0, pad.length - str.length) + str;

        objData = Object.assign(objData, {
          userId: `EV${currYear}${number}`,
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);

      objData = Object.assign(objData, { password: hashedPassword });

      if (req.file) {
        try {
          const cloud = await cloudinary.uploader.upload(req.file.path, {
            folder: process.env.FOLDER_MAIN,
            format: "webp",
            transformation: [{ quality: "auto:low" }],
          });
          objData = Object.assign(objData, {
            image: cloud.secure_url,
            imageId: cloud.public_id,
          });
        } catch (uploadErr) {
          return res.status(400).json({
            status: "Failed",
            message: "Image upload failed",
          });
        }
      }

      const data = new User(objData);
      const newData = await data.save();
      return res.json(newData);
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// UPDATE A SPECIFIC DATA
export const editUser = async (req, res) => {
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
          message: err.message,
        });
      }

      let objData = req.body;

      const spesificData = await User.findById(req.params.id);

      // Check username
      const usernameExist = await User.findOne({ username: objData.username });
      if (objData.username !== spesificData.username && usernameExist)
        return res.json({ status: 400, message: "Username already exists" });

      if (objData.password) {
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(objData.password, salt);
        const objPassword = {
          password: hashedPassword,
        };
        objData = Object.assign(objData, objPassword);
      }

      if (req.file) {
        try {
          // Remove old image from cloudinary if exists
          if (spesificData.imageId) {
            await cloudinary.uploader.destroy(spesificData.imageId);
          }

          const cloud = await cloudinary.uploader.upload(req.file.path, {
            folder: process.env.FOLDER_MAIN,
            format: "webp",
            transformation: [{ quality: "auto:low" }],
          });
          objData = Object.assign(objData, {
            image: cloud.secure_url,
            imageId: cloud.public_id,
          });
        } catch (uploadErr) {
          console.log(uploadErr);
          return res.status(400).json({
            status: "Failed",
            message: "Image upload failed",
          });
        }
      }

      const updatedData = await User.updateOne(
        { _id: req.params.id },
        {
          $set: objData,
        }
      );
      return res.json(updatedData);
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// UPDATE PASSWORD
export const changeUserPassword = async (req, res) => {
  try {
    // Chek user
    const userExist = await User.findById(req.params.id);
    if (!userExist)
      return res.status(400).json({ message: "User is not found" });

    if (req.body.oldPassword) {
      const validPassword = await bcrypt.compare(
        req.body.oldPassword,
        userExist.password
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

    const updatedData = await User.updateOne(
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
export const deleteUser = async (req, res) => {
  try {
    const deletedData = await User.deleteOne({ _id: req.params.id });
    return res.json(deletedData);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
