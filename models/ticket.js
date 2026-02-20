import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const DataSchema = mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
    },
    attachment: String,
    attachmentId: String,
    title: String,
    body: String,
    reply: String,
    module: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      default: null,
    },
    status: {
      type: String,
      enum: ["open", "progress", "closed"],
      default: "open",
    },
  },
  { timestamps: true },
);

// function generator
const generateTicketId = async () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  const lastTicket = await mongoose
    .model("Ticket")
    .findOne({ ticketId: new RegExp(`^TCK-${date}`) })
    .sort({ ticketId: -1 });

  let sequence = 1;

  if (lastTicket) {
    const lastSequence = parseInt(lastTicket.ticketId.split("-")[2]);
    sequence = lastSequence + 1;
  }

  return `TCK-${date}-${String(sequence).padStart(4, "0")}`;
};

DataSchema.pre("save", async function (next) {
  if (!this.ticketId) {
    this.ticketId = await generateTicketId();
  }
  next();
});

DataSchema.plugin(mongoosePaginate);

export default mongoose.model("Ticket", DataSchema);
