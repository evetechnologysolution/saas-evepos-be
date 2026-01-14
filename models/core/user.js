import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { capitalizeFirstLetter } from "../../lib/textSetting.js";
import { generateRandomId } from "../../lib/generateRandom.js";

const DataSchema = mongoose.Schema({
  userId: {
    type: String,
    trim: true,
    default: "",
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  fullname: {
    type: String,
    trim: true,
    default: ""
  },
  phone: {
    type: String,
    trim: true,
    default: ""
  },
  email: {
    type: String,
    trim: true,
    default: ""
  },
  address: {
    type: String,
    trim: true,
    default: ""
  },
  password: {
    type: String,
    required: true,
    minLength: 6,
  },
  image: {
    type: String,
    default: "",
    required: false,
  },
  imageId: {
    type: String,
    default: "",
    required: false,
  },
  role: {
    type: String,
    lowercase: true,
    trim: true,
    required: true,
    default: "admin"
  },
  isActive: {
    type: Boolean,
    default: true,
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

DataSchema.pre("save", function (next) {
  if (!this.userId) {
    const currYear = new Date().getFullYear();
    const number = generateRandomId();
    this.userId = `TU${currYear}${number}`;
  }
  next();
  if (this.fullname) {
    this.fullname = capitalizeFirstLetter(this.fullname);
  }
  next();
});

DataSchema.pre("updateOne", function (next) {
  const update = this.getUpdate();
  if (update.$set && update.$set.fullname) {
    update.$set.fullname = capitalizeFirstLetter(update.$set.fullname);
  }
  next();
});

DataSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.$set && update.$set.fullname) {
    update.$set.fullname = capitalizeFirstLetter(update.$set.fullname);
  }
  next();
});

DataSchema.plugin(mongoosePaginate);

export default mongoose.model("Users", DataSchema);
