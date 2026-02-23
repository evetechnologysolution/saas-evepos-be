import Ticket from "../models/ticket.js";
import multer from "multer";
import fs from "fs";
import { cloudinary, imageUpload } from "../lib/cloudinary.js";
import { errorResponse } from "../utils/errorResponse.js";

const generateTicketId = async () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  const lastTicket = await Ticket.findOne({
    ticketId: new RegExp(`^TCK-${date}`),
  }).sort({ ticketId: -1 });

  let sequence = 1;

  if (lastTicket) {
    const lastSequence = parseInt(lastTicket.ticketId.split("-")[2]);
    sequence = lastSequence + 1;
  }

  return `TCK-${date}-${String(sequence).padStart(4, "0")}`;
};

const uploadFile = async (file) => {
  const result = await cloudinary.uploader.upload(file.path, {
    folder: process.env.FOLDER_MAIN,
    resource_type: "auto",
  });

  fs.unlink(file.path, () => {});

  return {
    fileUrl: result.secure_url,
    fileId: result.public_id,
  };
};

export const addTicket = async (req, res) => {
  imageUpload.fields([{ name: "attachment", maxCount: 1 }])(
    req,
    res,
    async (err) => {
      if (err instanceof multer.MulterError)
        return res
          .status(400)
          .json({ status: "Failed", message: "Failed upload file" });

      try {
        let objData = req.body;

        if (req.userData) objData.user = req.userData._id;

        objData.ticketId = await generateTicketId();

        if (req.files?.attachment?.[0]) {
          const uploaded = await uploadFile(req.files.attachment[0]);
          objData.attachment = uploaded.fileUrl;
          objData.attachmentId = uploaded.fileId;
        }

        const data = new Ticket(objData);
        const newData = await data.save();

        return res.json(newData);
      } catch (err) {
        return errorResponse(res, {
          statusCode: 500,
          message: err.message,
        });
      }
    },
  );
};

export const getAllTicket = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, all } = req.query;

    const query = {};

    if (status) query.status = status;

    if (Number(all) === 0) {
      query.user = req.userData?._id;
    }

    if (search) {
      query.$or = [
        { ticketId: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
      ];
    }

    const data = await Ticket.paginate(query, {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: "user",
      lean: true,
    });

    return res.json(data);
  } catch (err) {
    return errorResponse(res, {
      statusCode: 500,
      message: err.message,
    });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const data = await Ticket.findById(req.params.id).populate("user").lean();

    if (!data)
      return res
        .status(404)
        .json({ status: "Failed", message: "Ticket not found" });

    return res.json(data);
  } catch (err) {
    return errorResponse(res, {
      statusCode: 500,
      message: err.message,
    });
  }
};

export const updateTicket = async (req, res) => {
  imageUpload.fields([{ name: "attachment", maxCount: 1 }])(
    req,
    res,
    async (err) => {
      if (err instanceof multer.MulterError)
        return res
          .status(400)
          .json({ status: "Failed", message: "Failed upload file" });

      try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket)
          return res
            .status(404)
            .json({ status: "Failed", message: "Ticket not found" });

        let objData = req.body;

        if (req.files?.attachment?.[0]) {
          // hapus file lama
          if (ticket.attachmentId)
            await cloudinary.uploader.destroy(ticket.attachmentId);

          const uploaded = await uploadFile(req.files.attachment[0]);
          objData.attachment = uploaded.fileUrl;
          objData.attachmentId = uploaded.fileId;
        }

        const updated = await Ticket.findByIdAndUpdate(req.params.id, objData, {
          new: true,
        });

        return res.json(updated);
      } catch (err) {
        return errorResponse(res, {
          statusCode: 500,
          message: err.message,
        });
      }
    },
  );
};

export const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket)
      return res
        .status(404)
        .json({ status: "Failed", message: "Ticket not found" });

    if (ticket.attachmentId)
      await cloudinary.uploader.destroy(ticket.attachmentId);

    await ticket.deleteOne();

    return res.json({ status: "Success", message: "Ticket deleted" });
  } catch (err) {
    return errorResponse(res, {
      statusCode: 500,
      message: err.message,
    });
  }
};
