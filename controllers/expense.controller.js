import Expense from "../models/expense.js";

// GETTING ALL THE DATA
export const getAllExpense = async (req, res) => {
    try {
        const { page, perPage, code, search } = req.query;
        let query = {};
        if (code) {
            query = {
                ...query,
                code: code,
            };
        };
        if (search) {
            query = {
                ...query,
                description: { $regex: search, $options: 'i' }, // option i for case insensitivity to match upper and lower cases.
            };
        };
        const options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
            sort: { date: -1 },
        }
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

        // **Handle filter khusus**
        if (filter) {
            if (filter === "today") {
                fixStart = new Date(now.setHours(0, 0, 0, 0));
                fixEnd = new Date(now.setHours(23, 59, 59, 999));
            } else if (filter === "thisWeek") {
                const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
                fixStart = new Date(firstDayOfWeek.setHours(0, 0, 0, 0));
                fixEnd = new Date(now.setHours(23, 59, 59, 999));
            } else if (filter === "thisMonth") {
                fixStart = new Date(now.getFullYear(), now.getMonth(), 1);
                fixEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999); // now.getMonth() + 1, 0 mengembalikan hari terakhir di bulan sekarang
            } else if (filter === "thisYear") {
                fixStart = new Date(now.getFullYear(), 0, 1);
                fixEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            } else {
                return res.status(400).json({ message: "Filter tidak valid" });
            }
        } else {
            // **Gunakan start & end jika tidak ada filter**
            if (!start) return res.status(400).json({ message: "Tanggal mulai diperlukan." });

            fixStart = new Date(start);
            fixStart.setHours(0, 0, 0, 0);

            fixEnd = new Date(end || start);
            fixEnd.setHours(23, 59, 59, 999);
        }

        const data = await Expense.aggregate([
            {
                $match: {
                    date: {
                        $gte: new Date(fixStart.toISOString()),
                        $lte: new Date(fixEnd.toISOString())
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    expense: { $sum: "$amount" },
                }
            },
            {
                $project: {
                    _id: 0,
                    expense: 1,
                }
            },
        ]);


        const result = {
            start: new Date(fixStart.toISOString()),
            end: new Date(fixEnd.toISOString()),
            totalExpense: data.length > 0 ? data[0].expense : 0,
        }

        return res.json(result);
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
        const data = new Expense(req.body);
        const newData = await data.save();
        return res.json(newData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// UPDATE A SPECIFIC DATA
export const editExpense = async (req, res) => {
    try {
        const updatedData = await Expense.updateOne(
            { _id: req.params.id },
            {
                $set: req.body
            }
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