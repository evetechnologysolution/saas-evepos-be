import Expense from "../models/expense.js";

// GETTING ALL THE DATA
export const getAllExpense = async (req, res) => {
  try {
    const { page, perPage, code, search } = req.query;
    let query = {};
    if (req.userData) {
      query = {
        ...query,
        tenantRef: req.userData.tenantRef,
        outletRef: req.userData.outletRef,
      };
    }
    if (code) {
      query = {
        ...query,
        code: code,
      };
    }
    if (search) {
      query = {
        ...query,
        description: { $regex: search, $options: "i" }, // option i for case insensitivity to match upper and lower cases.
      };
    }
    const options = {
      page: parseInt(page, 10) || 1,
      limit: parseInt(perPage, 10) || 10,
      sort: { date: -1 },
    };
    const listofData = await Expense.paginate(query, options);
    return res.json(listofData);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getExpenseTotal = async (req, res) => {
  try {
    const { start, end, filter } = req.query;

    let fixStart, fixEnd;
    const now = new Date();

    // =========================
    // HANDLE FILTER TANGGAL
    // =========================
    if (filter) {
      if (filter === "today") {
        fixStart = new Date(now.setHours(0, 0, 0, 0));
        fixEnd = new Date(now.setHours(23, 59, 59, 999));
      } else if (filter === "thisWeek") {
        const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
        fixStart = new Date(firstDay.setHours(0, 0, 0, 0));
        fixEnd = new Date(now.setHours(23, 59, 59, 999));
      } else if (filter === "thisMonth") {
        fixStart = new Date(now.getFullYear(), now.getMonth(), 1);
        fixEnd = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        );
      } else if (filter === "thisYear") {
        fixStart = new Date(now.getFullYear(), 0, 1);
        fixEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      } else {
        return res.status(400).json({ message: "Filter tidak valid" });
      }
    } else {
      if (!start)
        return res.status(400).json({ message: "Tanggal mulai diperlukan." });

      fixStart = new Date(start);
      fixStart.setHours(0, 0, 0, 0);

      fixEnd = new Date(end || start);
      fixEnd.setHours(23, 59, 59, 999);
    }

    // =========================
    // MATCH QUERY
    // =========================
    const matchQuery = {
      createdAt: { $gte: fixStart, $lte: fixEnd },
    };

    // 🔐 filter tenant & outlet dari token
    if (req.userData?.tenantRef) {
      matchQuery.tenantRef = req.userData.tenantRef;
    }

    if (req.userData?.outletRef) {
      matchQuery.outletRef = req.userData.outletRef;
    }

    // =========================
    // AGGREGATION
    // =========================
    const data = await Expense.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          expense: { $sum: "$amount" },
        },
      },
      {
        $project: {
          _id: 0,
          expense: 1,
        },
      },
    ]);

    return res.json({
      start: fixStart,
      end: fixEnd,
      totalExpense: data.length ? data[0].expense : 0,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getExpenseById = async (req, res) => {
  try {
    const spesificData = await Expense.findById(req.params.id);
    return res.json(spesificData);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// CREATE NEW DATA
export const addExpense = async (req, res) => {
  try {
    let objData = req.body;
    if (req.userData) {
      objData.tenantRef = req.userData?.tenantRef;
      if (req.userData?.outletRef) {
        objData.outletRef = req.userData.outletRef;
      }
    }
    const data = new Expense(objData);
    const newData = await data.save();
    return res.json(newData);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// UPDATE A SPECIFIC DATA
export const editExpense = async (req, res) => {
  try {
    const objData = req.body;
    if (req.userData) {
      objData.tenantRef = req.userData?.tenantRef;
      if (req.userData?.outletRef) {
        objData.outletRef = req.userData.outletRef;
      }
    }
    const updatedData = await Expense.updateOne(
      { _id: req.params.id },
      {
        $set: objData,
      },
    );
    return res.json(updatedData);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// DELETE A SPECIFIC DATA
export const deleteExpense = async (req, res) => {
  try {
    const deletedData = await Expense.deleteOne({ _id: req.params.id });
    return res.json(deletedData);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
