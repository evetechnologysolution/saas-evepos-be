import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import mongooseLeanVirtuals from "mongoose-lean-virtuals";

/* ===============================
 * Sub Schemas
 * =============================== */
const ModuleSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    qty: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const DataSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      uppercase: true,
      trim: true,
      required: [true, "Name wajib diisi"],
    },

    price: {
      yearly: { type: Number, default: 0, min: 0 },
      monthly: { type: Number, default: 0, min: 0 },
    },

    discount: {
      yearly: { type: Number, default: 0, min: 0 },
      monthly: { type: Number, default: 0, min: 0 },
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

    /* ===============================
     * Target Customer
     * =============================== */
    selectedCustomer: {
      allCustomer: { type: Boolean, default: false },
      newCustomer: { type: Boolean, default: false },
      oldCustomer: { type: Boolean, default: false },
      autoRenewalCustomer: { type: Boolean, default: false },
    },

    /* ===============================
     * Modul & Hak Akses
     * =============================== */
    modules: {
      dashboard: ModuleSchema,
      dashboardB: ModuleSchema,
      dashboardC: ModuleSchema,
      dashboardD: ModuleSchema,
      dashboardE: ModuleSchema,

      pos: ModuleSchema,
      orders: ModuleSchema,
      pickup: ModuleSchema,
      scan_orders: ModuleSchema,

      sales_report: ModuleSchema,
      popular_product: ModuleSchema,
      payment_overview: ModuleSchema,

      category: ModuleSchema,
      subcategory: ModuleSchema,
      product: ModuleSchema,
      variant: ModuleSchema,
      promotion: ModuleSchema,

      user: ModuleSchema,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/* ===============================
 * Virtuals & Index
 * =============================== */
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
