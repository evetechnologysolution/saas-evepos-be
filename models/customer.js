import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";
import { capitalizeFirstLetter, convertToE164 } from "../lib/textSetting.js";
import { generateRandomId } from "../lib/generateRandom.js";

const DataSchema = new mongoose.Schema({
  customerId: {
    type: String,
    // required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: false,
    default: "",
  },
  email: {
    type: String,
    required: false,
    default: "",
  },
  address: {
    type: String,
    required: false,
    default: "",
  },
  addressNotes: {
    type: String,
    required: false,
    default: "",
  },
  notes: {
    type: String,
    required: false,
    default: "",
  },
  voucherCode: {
    type: String,
    default: "",
    uppercase: true,
  },
  ismemberRef: {
    type: Boolean,
    default: false,
  },
  memberRef: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    ref: "Members",
  },
  tenantRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenants",
    default: null,
  },
  outletRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Outlets",
    default: null,
  },
}, { timestamps: true });

DataSchema.pre("save", async function (next) {
  if (this.name) {
    this.name = capitalizeFirstLetter(this.name);
  }
  if (this.phone) {
    this.phone = convertToE164(this.phone);
  }
  // Generate customerId jika belum ada
  if (!this.customerId) {
    const currYear = new Date().getFullYear();
    const number = generateRandomId();
    this.customerId = `CU${currYear}${number}`;
  }
  next();
});

DataSchema.pre("updateOne", async function (next) {
  const update = this.getUpdate();
  if (update.$set && update.$set.name) {
    update.$set.name = capitalizeFirstLetter(update.$set.name);
  }
  if (update.$set && update.$set.phone) {
    update.$set.phone = convertToE164(update.$set.phone);
  }
  next();
});

DataSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  if (update.$set && update.$set.name) {
    update.$set.name = capitalizeFirstLetter(update.$set.name);
  }
  if (update.$set && update.$set.phone) {
    update.$set.phone = convertToE164(update.$set.phone);
  }

  // Check the existing document 
  const check = await this.model.findOne(this.getFilter());
  if (!check) {
    // Jika dokumen belum ada, generate customerId baru
    const currYear = new Date().getFullYear();
    const number = generateRandomId();
    update.$set = {
      ...update.$set,
      customerId: `CU${currYear}${number}`,
    };
  }

  next();
});

DataSchema.index({ tenantRef: 1, outletRef: 1 });
DataSchema.plugin(mongoosePaginate);
DataSchema.plugin(mongooseLeanVirtuals);

export default mongoose.model("Customers", DataSchema);
