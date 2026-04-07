// untuk crud service atau subscription plan saas, ex: basic, pro, enterprise
const Service = {
  _id: ObjectId,
  createdAt: Date,
  name: String,
  price: {
    yearly: Number,
    monthly: Number,
  },
  discount: {
    yearly: Number,
    monthly: Number,
  },
  description: String,
  listNumber: Number,
  isActive: Boolean,
}

// schema tenant
const Tenant = {
  _id: ObjectId,
  createdAt: Date,
  tenantId: String,
  ownerName: String,
  businessName: String,
  businessType: String,
  legalStatus: String,
  operatingSince: String,
  image: String,
  imageId: String,
  description: String,
  website: String,
  socialMedia: [ // array
    {
      platform: String,
      account: String,
    },
  ],
  phone: String,
  phone2: String,
  phone3: String,
  email: String,
  address: String,
  province: String,
  city: String,
  district: String,
  subdistrict: String,
  zipCode: String,
  location: { placeId: String, lat: Number, lng: Number },
  status: String,
  statusReason: String,
  isEvewash: Boolean,
}

// schema subscription
const subscription = {
  _id: ObjectId,
  createdAt: Date,
  subsId: String,
  serviceRef: ObjectId, // relasi ke service
  tenantRef: ObjectId, // relasi ke tenant
  invoiceRef: ObjectId, // relasi ke invoice
  serviceName: String,
  subsType: String,
  startDate: Date,
  endDate: Date,
  status: String,
}

// schema invoice
const Invoice = {
  _id: ObjectId,
  createdAt: Date,
  invoiceId: String,
  tenantRef: ObjectId, // relasi ke tenant
  serviceRef: ObjectId, // relasi ke service
  serviceName: String,
  subsType: String,
  startDate: Date,
  endDate: Date,
  qty: Number,
  price: Number,
  discount: Number,
  adminFee: Number,
  tax: Number,
  billedAmount: Number,
  payment: {
    createdAt: Date,
    paidAt: Date,
    channel: String,
    invoiceUrl: String,
  },
  notes: String,
  status: String,
}

// schema outlet
const Outlet = {
  _id: ObjectId,
  createdAt: Date,
  name: String,
  phone: String,
  email: String,
  address: String,
  province: String,
  city: String,
  district: String,
  subdistrict: String,
  zipCode: String,
  location: { placeId: String, lat: Number, lng: Number },
  isPrimary: Boolean,
  tenantRef: ObjectId, // relasi ke tenant
}

// schema user
const User = {
  _id: ObjectId,
  createdAt: Date,
  userId: String,
  username: String,
  fullname: String,
  phone: String,
  phone2: String,
  phone3: String,
  email: String,
  address: String,
  province: String,
  city: String,
  district: String,
  subdistrict: String,
  zipCode: String,
  password: String,
  image: String,
  imageId: String,
  ktp: {
    number: String,
    image: String,
    imageId: String,
  },
  npwp: {
    number: String,
    image: String,
    imageId: String,
  },
  role: String,
  resetToken: String,
  resetTokenExpiry: Date,
  isActive: Boolean,
  tenantRef: ObjectId, // relasi ke tenant
  outletRef: ObjectId, // relasi ke outlet
}

// schema userMaster untuk master atau product owner saas (internal)
const UserMaster = {
  _id: ObjectId,
  createdAt: Date,
  userId: String,
  username: String,
  fullname: String,
  phone: String,
  email: String,
  address: String,
  password: String,
  image: String,
  imageId: String,
  role: String,
  resetToken: String,
  resetTokenExpiry: Date,
  isActive: Boolean,
}

// schema product
const Product = {
  _id: ObjectId,
  createdAt: Date,
  name: String,
  image: String,
  imageId: String,
  price: Number,
  productionPrice: Number,
  productionNotes: String,
  promotionRef: ObjectId, // relasi ke promotion
  category: ObjectId, // relasi ke category
  subcategory: ObjectId, // relasi ke subcategory
  description: String,
  unit: String,
  isAvailable: Boolean,
  extraNotes: Boolean,
  listNumber: Number,
  amountKg: Number,
  variant: [ // array
    {
      variantRef: ObjectId, // relasi ke variant
      isMandatory: Boolean,
      isMultiple: Boolean,
    },
  ],
  isRecommended: Boolean,
  tenantRef: ObjectId, // relasi ke tenant
  outletRef: [ObjectId], // relasi ke outlet, array
  minimumOrderQty: Number,
  masterStatus: [ObjectId], // relasi ke progress label, array
}

// schema category
const Category = {
  _id: ObjectId,
  createdAt: Date,
  name: String,
  listNumber: Number,
  image: String,
  imageId: String,
  tenantRef: ObjectId, // relasi ke tenant
  outletRef: [ObjectId], // array, relasi ke outlet
}

// schema subcategory
const Subcategory = {
  _id: ObjectId,
  createdAt: Date,
  name: String,
  listNumber: Number,
  image: String,
  imageId: String,
  tenantRef: ObjectId, // relasi ke tenant
  outletRef: [ObjectId], // array, relasi ke outlet
}

// schema promotion
const Promotion = {
  _id: ObjectId,
  createdAt: Date,
  promotionId: String,
  name: String,
  image: String,
  imageId: String,
  type: Number, // 1 discount 2 package 3 bundle
  amount: Number,
  qtyMin: Number,
  qtyFree: Number,
  validUntil: Boolean,
  startDate: Date,
  endDate: Date,
  selectedDay: [Number], // array
  products: [ObjectId], // array, relasi ke product
  isAvailable: Boolean,
  conditional: {
    label: String,
    notes: String,
    otherNotes: String,
    isActive: Boolean,
  },
  tenantRef: ObjectId, // relasi ke tenant
  outletRef: [ObjectId], // array, relasi ke outlet
}

// schema variant
const Variant = {
  _id: ObjectId,
  createdAt: Date,
  name: String,
  caption: String,
  options: [ // array
    {
      name: String,
      price: Number,
      productionPrice: Number,
      notes: String,
      productionNotes: String,
      isMultiple: Boolean,
      isDefault: Boolean,
    },
  ],
  suboptions: [ // array
    {
      name: String,
      price: Number,
      productionPrice: Number,
      notes: String,
      productionNotes: String,
      isMultiple: Boolean,
      isDefault: Boolean,
    },
  ],
  isPerfume: Boolean,
  showOnWeb: Boolean,
  tenantRef: ObjectId, // relasi ke tenant
  outletRef: [ObjectId], // array, relasi ke outlet
}

// schema voucher (evewash)
const Voucher = {
  _id: ObjectId,
  createdAt: Date,
  start: Date,
  end: Date,
  name: String,
  imageId: String,
  image: String,
  description: String,
  voucherType: Number, // 1 diskon, 2 hadiah, 3 postcard
  option: String,
  product: [ObjectId], // array, relasi ke product
  qtyProduct: Number,
  quota: Number,
  quotaUsed: Number,
  worthPoint: Number,
  isLimited: Boolean,
  isAvailable: Boolean,
  tenantRef: ObjectId, // relasi ke tenant
}

// schema member
const Member = {
  _id: ObjectId,
  createdAt: Date,
  memberId: String,
  name: String,
  firstName: String,
  lastName: String,
  phone: String,
  email: String,
  password: String,
  addresses: [ // array
    {
      label: String,
      province: String,
      city: String,
      district: String,
      subdistrict: String,
      address: String,
      addressNotes: String,
      location: {
        placeId: String,
        lat: Number,
        lng: Number,
      },
      isDefault: Boolean,
    }
  ],
  point: Number,
  otp: String,
  isGmail: Boolean,
  isOpeningVoucher: Boolean,
  resetToken: String,
  resetTokenExpiry: { type: Date },
  isVerified: Boolean,
  tenantRef: ObjectId, // relasi ke tenant
}

// schema voucher member (evewash)
const VoucherMember = {
  _id: ObjectId,
  createdAt: Date,
  expiry: Date,
  scanDate: Date,
  usedAt: Date,
  voucherCode: String,
  voucherRef: ObjectId, // relasi ke voucher
  memberRef: ObjectId, // relasi ke member
  name: String,
  image: String,
  description: String,
  voucherType: Number, // 1 diskon, 2 hadiah, 3 postcard
  product: [ObjectId], // array, relasi ke product
  qtyProduct: Number,
  orderRef: ObjectId, // relasi ke order
  isUsed: Boolean,
  isPrinted: Boolean,
  tenantRef: ObjectId, // relasi ke tenant
}

// schema conversation (evewash)
const Conversation = {
  _id: ObjectId,
  createdAt: Date,
  memberRef: ObjectId, // relasi ke member
  lastMessage: ObjectId, // relasi ke message
  tenantRef: ObjectId, // relasi ke tenant
}

// schema message (evewash)
const Message = {
  _id: ObjectId,
  createdAt: Date,
  conversationRef: ObjectId, // relasi ke conversation
  reply: ObjectId, // relasi ke message
  memberRef: ObjectId, // relasi ke member
  adminRef: ObjectId, // relasi ke user
  text: String,
  image: String,
  imageId: String,
  isAdmin: Boolean,
  isRead: Boolean,
  tenantRef: ObjectId, // relasi ke tenant
}

// schema pointHistory (evewash)
const PointHistory = {
  _id: ObjectId,
  createdAt: Date,
  memberRef: ObjectId, // relasi ke member
  orderRef: ObjectId, // relasi ke order
  orderPendingRef: ObjectId, // relasi ke order
  point: Number,
  pointRemaining: Number,
  pointPendingUsed: Number,
  pointExpiry: Date,
  description: String,
  status: String, // in or out
  tenantRef: ObjectId, // relasi ke tenant
}

// cart (evewash)
const Cart = {
  _id: ObjectId,
  createdAt: Date,
  memberRef: ObjectId, // relasi ke member
  items: [
    {
      id: ObjectId,
      name: String,
      price: Number,
      realPrice: Number,
      productionPrice: Number,
      qty: Number,
      image: String,
      notes: String,
      category: String,
      unit: String,
      promotionType: Number,
      promotionLabel: String,
      promotionQtyMin: Number,
      discountAmount: Number,
      variant: [ // array
        {
          name: String,
          option: String,
          price: Number,
          productionPrice: Number,
          qty: Number
        },
      ],
      amountKg: Number,
    },
  ],
  tenantRef: ObjectId, // relasi ke tenant
  outletRef: ObjectId, // relasi ke outlet
}

// schema order
const Order = {
  _id: ObjectId,
  createdAt: Date,
  tempId: String,
  orderId: String,
  bookingDate: Date,
  paymentDate: Date,
  pickupDateTime: Date,
  deliveryDate: Date,
  staff: String,
  customer: {
    memberId: String,
    cardId: String,
    name: String,
    phone: String,
    email: String,
    province: String,
    city: String,
    district: String,
    subdistrict: String,
    address: String,
    addressNotes: String,
    location: {
      placeId: String,
      lat: Number,
      lng: Number,
    },
    notes: String,
  },
  orders: [
    {
      id: ObjectId, // relasi ke product
      name: String,
      image: String,
      price: Number,
      productionPrice: Number,
      qty: Number,
      splitQty: Number,
      refundQty: Number,
      category: String,
      unit: String,
      promotionType: Number,
      promotionLabel: String,
      promotionQtyMin: Number,
      discountAmount: Number,
      isDailyPromotion: Boolean,
      variant: [
        {
          name: String,
          option: String,
          price: Number,
          productionPrice: Number,
          qty: Number,
        },
      ],
      notes: String,
      isPickedUp: Boolean,
      pickupData: {
        date: Date,
        by: String,
      },
    },
  ],
  orderType: String,
  status: String, // backlog, awaiting payment, unpaid, paid, half paid, refund, cancel
  dp: Number,
  deliveryPrice: Number,
  voucherDiscPrice: Number,
  discount: Number,
  discountPrice: Number,
  taxPercentage: Number,
  tax: Number,
  serviceChargePercentage: Number,
  serviceCharge: Number,
  havePaid: Number,
  billedAmount: Number,
  roundingAmount: Number,
  productionAmount: Number,
  payment: String,
  cardBankName: String,
  cardAccountName: String,
  cardNumber: String,
  notes: String,
  refundType: Number,// 1 full, 2 sebagian
  refundNotes: String,
  refundReason: String,
  voucherCode: [String],
  printCount: Number,
  printLaundry: Number,
  printHistory: [
    {
      date: Date,
      staff: String,
      isLaundry: Boolean,
    },
  ],
  invoiceUrl: String,
  pickUpStatus: String,
  pickupData: {
    date: Date,
    by: String,
  },
  firstOrder: Boolean,
  isScan: Boolean,
  tenantRef: ObjectId, // relasi ke tenant
  outletRef: ObjectId, // relasi ke outlet
}

// master progress
const ProgressLabel = {
  _id: ObjectId,
  createdAt: Date,
  name: String,
  previousName: String,
  listNumber: Number,
  tenantRef: ObjectId, // relasi ke tenant
  archived: Boolean,
}

// progress
const Progress = {
  _id: ObjectId,
  createdAt: Date,
  orderRef: ObjectId, // relasi ke order
  latestStatus: String,
  latestNotes: String,
  log: [ // array
    {
      id: ObjectId,
      date: Date,
      name: String,
      qty: Number,
      unit: String,
      status: String,
      statusRef: ObjectId, // relasi ke progressLabel (master progress)
      notes: {
        type: String,
        trim: true,
        default: "",
      },
      staffRef: ObjectId, // relasi ke user
    },
  ],
  tenantRef: ObjectId, // relasi ke tenant
  outletRef: ObjectId, // relasi ke outlet
}

// schema banner (evewash)
const Banner = {
  _id: ObjectId,
  createdAt: Date,
  name: String,
  image: String,
  imageId: String,
  imageMobile: String,
  imageMobileId: String,
  isAvailable: Boolean,
  listNumber: Number,
  tenantRef: ObjectId, // relasi ke tenant
  outletRef: ObjectId, // relasi ke outlet
}

// schema cashBalance
const CashBalance = {
  _id: ObjectId,
  createdAt: Date,
  startDate: Date,
  endDate: Date,
  difference: Number,
  notes: String,
  isOpen: Boolean,
  tenantRef: ObjectId, // relasi ke tenant
  outletRef: ObjectId, // relasi ke outlet
}

// schema cashBalanceHistory
const CashBalanceHistory = {
  _id: ObjectId,
  createdAt: Date,
  title: String,
  amount: Number,
  isCashOut: Boolean,
  payment: String,
  orderRef: ObjectId, // relasi ke order
  cashBalanceRef: ObjectId, // relasi ke CashBalance
  tenantRef: ObjectId, // relasi ke tenant
  outletRef: ObjectId, // relasi ke outlet
}

// schema article (evewash)
const Article = {
  _id: ObjectId,
  createdAt: Date,
  author: ObjectId, // relasi ke user
  title: String,
  slug: String,
  image: String,
  imageId: String,
  spoiler: String,
  content: String,
  category: [String], // array
  views: Number,
  isActive: Boolean,
  tenantRef: ObjectId, // relasi ke tenant
}

// schema articleCategory (evewash)
const ArticleCategory = {
  _id: ObjectId,
  createdAt: Date,
  name: [String],
  tenantRef: ObjectId, // relasi ke tenant
}

// schema gallery (evewash)
const Gallery = {
  _id: ObjectId,
  createdAt: Date,
  name: String,
  image: String,
  imageId: String,
  tenantRef: ObjectId, // relasi ke tenant
}

// schema global discount (evewash)
const GlobalDiscount = {
  _id: ObjectId,
  createdAt: Date,
  start: Date,
  end: Date,
  name: String,
  amount: Number,
  tenantRef: ObjectId, // relasi ke tenant
  outletRef: [ObjectId], // array, relasi ke outlet
}

// schema survey
const Survey = {
  _id: ObjectId,
  createdAt: Date,
  hasOnlineBusiness: Boolean,
  hasUsed: Boolean,
  hasUsedOtherApp: Boolean,
  otherAppName: String,
  productType: [String], // tunggal, kombinasi
  requiredFeatures: [String], // akunting, pencatatan transaksi, manajemen stok
  source: String, // google, rekan, lainnya
  tenantRef: ObjectId, // relasi ke tenant
}

// schema receiptSetting
const ReceiptSetting = {
  _id: ObjectId,
  createdAt: Date,
  name: String,
  phone: String,
  email: String,
  web: String,
  image: String,
  imageId: String,
  address: String,
  province: String,
  city: String,
  region: String,
  zipCode: String,
  notes: String,
  isPrintLogo: Boolean,
  tenantRef: ObjectId, // relasi ke tenant
  outletRef: ObjectId, // relasi ke outlet
}

// schema generalSetting
const GeneralSetting = {
  _id: ObjectId,
  createdAt: Date,
  cashBalance: Boolean,
  themeSetting: Boolean,
  deliveryBaseRate: Number,
  deliveryRatePerMinute: Number,
  tenantRef: ObjectId, // relasi ke tenant
  outletRef: [ObjectId], // array, relasi ke outlet
}

// schema taxSetting
const TaxSetting = {
  _id: ObjectId,
  createdAt: Date,
  tax: {
    isActive: Boolean,
    percentage: Number,
    orderType: [String], // array => onsite, delivery
  },
  serviceCharge: {
    isActive: Boolean,
    percentage: Number,
    orderType: [String], // array => onsite, delivery
  },
  tenantRef: ObjectId, // relasi ke tenant
  outletRef: [ObjectId], // array, relasi ke outlet
}

// schema expenses
const Expenses = {
  _id: ObjectId,
  createdAt: Date,
  code: Number,
  // 1 Beban Gaji
  // 2 Beban Sewa Gedung
  // 3 Beban Listrik dan Telepon
  // 4 Beban Lain-lain
  // 5 Pembelian
  // 6 Potongan Pembelian
  // 7 Retur Pembelian dan Pengurangan Harga
  // 8 Pengeluaran Outlet
  staff: String,
  description: String,
  amount: Number,
  tenantRef: ObjectId, // relasi ke tenant
  outletRef: ObjectId, // relasi ke outlet
}

// schema ticket => report bug from tenenat to product owner
const Ticket = {
  _id: ObjectId,
  createdAt: Date,
  ticketId: String,
  attachment: String,
  attachmentId: String,
  title: String,
  body: String,
  reply: String,
  module: String,
  user: ObjectId, // relasi ke user
  status: String, // open, progress, closed
  messages: [
    {
      text: String,
      isAdmin: Boolean,
      isTenant: Boolean,
    }
  ],
}