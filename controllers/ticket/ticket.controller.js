import Ticket from "../../models/ticket/ticket.js";
import multer from "multer";
import fs from "fs";
import { cloudinary, imageUpload } from "../../lib/cloudinary.js";
import { errorResponse } from "../../utils/errorResponse.js";

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

    const [data, statusCountRaw] = await Promise.all([
      Ticket.paginate(query, {
        page,
        limit,
        sort: { createdAt: -1 },
        lean: true,

        populate: {
          path: "user",
          populate: {
            path: "tenantRef",
          },
        },
      }),

      Ticket.aggregate([
        { $match: query },
        {
          $group: {
            _id: "$status",
            total: { $sum: 1 },
          },
        },
      ]),
    ]);

    const statusCount = {
      open: 0,
      progress: 0,
      closed: 0,
    };

    statusCountRaw.forEach((item) => {
      statusCount[item._id] = item.total;
    });

    return res.json({
      ...data,
      statusCount,
    });
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

        let objData = { ...req.body };

        const update = {};

        if (req.body.message) {
          objData.message = JSON.parse(req.body.message);
        }

        // =========================
        // ATTACHMENT TICKET
        // =========================
        if (req.files?.attachment?.[0]) {
          if (ticket.attachmentId)
            await cloudinary.uploader.destroy(ticket.attachmentId);

          const uploaded = await uploadFile(req.files.attachment[0]);

          update.$set = {
            ...update.$set,
            attachment: uploaded.fileUrl,
            attachmentId: uploaded.fileId,
          };
        }

        // =========================
        // APPEND MESSAGE (CHAT)
        // =========================
        if (objData.message?.text) {
          update.$push = update.$push || {};

          update.$push.messages = {
            text: objData.message.text,
            isAdmin: Boolean(objData.message.isAdmin),
            isTenant: Boolean(objData.message.isTenant),
            createdAt: new Date(),
          };
        }

        // =========================
        // UPDATE FIELD BIASA
        // =========================
        const allowedFields = ["title", "module", "status"];

        const normalFields = {};

        allowedFields.forEach((field) => {
          if (objData[field] !== undefined) {
            normalFields[field] = objData[field];
          }
        });

        if (Object.keys(normalFields).length) {
          update.$set = {
            ...update.$set,
            ...normalFields,
          };
        }

        const updated = await Ticket.findByIdAndUpdate(req.params.id, update, {
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
