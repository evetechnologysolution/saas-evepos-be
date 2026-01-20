import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";
import bcrypt from "bcrypt";
import { capitalizeFirstLetter, convertToE164, splitName } from "../../lib/textSetting.js";
import { generateRandomId } from "../../lib/generateRandom.js";

const defaultPass = "123456";

const AddressSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  label: { type: String, default: "" },
  province: { type: String, default: "" },
  city: { type: String, default: "" },
  district: { type: String, default: "" },
  subdistrict: { type: String, default: "" },
  address: { type: String, required: false },
  addressNotes: { type: String, required: false },
  location: {
    placeId: String,
    lat: Number,
    lng: Number,
  },
  isDefault: { type: Boolean, default: false },
});

const DataSchema = new mongoose.Schema({
  memberId: { type: String, required: false, unique: true, trim: true },
  cardId: { type: String, required: false, trim: true, default: "" },
  name: { type: String, required: false, trim: true },
  firstName: { type: String, required: false, trim: true },
  lastName: { type: String, required: false, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: false, unique: false, trim: true },
  password: { type: String, required: false },

  province: { type: String, default: "" },
  city: { type: String, default: "" },
  district: { type: String, default: "" },
  subdistrict: { type: String, default: "" },
  address: { type: String, required: false },
  addressNotes: { type: String, required: false },
  location: { placeId: String, lat: Number, lng: Number },

  addresses: [AddressSchema],

  memberLevel: {
    type: String,
    lowercase: true,
    default: "bronze",
    enum: ["bronze", "silver", "gold"],
  },
  spendMoney: { type: Number, default: 0 },
  point: { type: Number, default: 0 },
  wallet: { type: Number, default: 0 },
  otp: { type: String, required: false },
  isGmail: { type: Boolean, default: false },
  isOpeningVoucher: { type: Boolean, default: false },
  resetToken: { type: String, default: "" },
  resetTokenExpiry: { type: Date },
  isVerified: { type: Boolean, default: false },
  tenantRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenants",
    default: null,
    set: val => val === "" ? null : val
  },
}, { timestamps: true });

DataSchema.pre("save", async function (next) {
  // Jika name diubah → isi firstName & lastName otomatis
  if (this.name && (!this.firstName || !this.lastName)) {
    const { firstName, lastName } = splitName(this.name);
    this.firstName = capitalizeFirstLetter(firstName);
    this.lastName = capitalizeFirstLetter(lastName);
    this.name = capitalizeFirstLetter(this.name);
  }
  // Jika firstName/lastName diubah → isi name otomatis
  if ((this.firstName || this.lastName) && (!this.name)) {
    this.firstName = capitalizeFirstLetter(this.firstName);
    this.lastName = capitalizeFirstLetter(this.lastName);
    this.name = `${this.firstName}${this.lastName ? " " + this.lastName : ""}`;
  }
  if (this.phone) {
    this.phone = convertToE164(this.phone);
  }
  if (!this.memberId) {
    const currYear = new Date().getFullYear();
    const number = generateRandomId();
    this.memberId = `EM${currYear}${number}`;
  }
  if (!this.password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPass, salt);
    this.password = hashedPassword;
  }
  if (this.email && this.email.trim() !== "") {
    this.isVerified = true;
  }
  next();
});

["updateOne", "findByIdAndUpdate", "findOneAndUpdate"].forEach((method) => {
  DataSchema.pre(method, async function (next) {
    const update = this.getUpdate();
    if (!update || !update.$set) return next();

    const set = update.$set;

    // Jika name diubah → isi firstName & lastName otomatis
    if (set.name && (!set.firstName || !set.lastName)) {
      const { firstName, lastName } = splitName(set.name);
      set.firstName = capitalizeFirstLetter(firstName);
      set.lastName = capitalizeFirstLetter(lastName);
      set.name = capitalizeFirstLetter(set.name);
    }

    // Jika firstName/lastName diubah → isi name otomatis
    if ((set.firstName || set.lastName) && !set.name) {
      set.firstName = capitalizeFirstLetter(set.firstName);
      set.lastName = capitalizeFirstLetter(set.lastName);
      set.name = `${set.firstName}${set.lastName ? " " + set.lastName : ""}`;
    }

    if (set.phone) {
      set.phone = convertToE164(set.phone);
    }

    if (set.email && set.email.trim() !== "") {
      set.isVerified = true;
    }

    // handle jika record belum ada
    if (method === "findOneAndUpdate") {
      const check = await this.model.findOne(this.getFilter());
      if (!check) {
        const currYear = new Date().getFullYear();
        const number = generateRandomId();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(defaultPass, salt);

        set.memberId = `EM${currYear}${number}`;
        set.password = hashedPassword;
      }
    }

    next();
  });
});

DataSchema.index({ tenantRef: 1, outletRef: 1 });
DataSchema.plugin(mongoosePaginate);
DataSchema.plugin(mongooseLeanVirtuals);

export default mongoose.model("Members", DataSchema);
