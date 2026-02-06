import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";

const DataSchema = mongoose.Schema(
  {
    name: {
      type: String,
      uppercase: true,
      trim: true,
      required: [true, "Name wajib diisi"],
      // BASIC, START UP, ENTERPRISE
    },

    price: {
      yearly: {
        type: Number,
        default: 0,
        min: 0,
      },
      monthly: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    discount: {
      yearly: {
        type: Number,
        default: 0,
        min: 0,
      },
      monthly: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    listNumber: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    /**
     * ===============================
     * Modul & Hak Akses Plan
     * ===============================
     */
    modules: {
      dashboard: { type: Boolean, default: false },
      pos: { type: Boolean, default: false },
      orders: { type: Boolean, default: false },
      pickup: { type: Boolean, default: false },
      scan_orders: { type: Boolean, default: false },
      sales_report: { type: Boolean, default: false },
      popular_product: { type: Boolean, default: false },
      payment_overview: { type: Boolean, default: false },
      category: { type: Boolean, default: false },
      subcategory: { type: Boolean, default: false },
      product: { type: Boolean, default: false },
      variant: { type: Boolean, default: false },
      promotion: { type: Boolean, default: false },
      user: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/**
 * ===============================
 * Virtual: Total Subscription
 * ===============================
 */
DataSchema.virtual("totalSubscriptions", {
  ref: "Subscriptions",
  localField: "_id",
  foreignField: "serviceRef",
  count: true,
});

DataSchema.index({ isActive: 1, listNumber: 1 });

DataSchema.plugin(mongoosePaginate);
DataSchema.plugin(mongooseLeanVirtuals);

export default mongoose.model("Services", DataSchema);
