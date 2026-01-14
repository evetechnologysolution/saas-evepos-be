import Tax from "../models/tax.js";

// GETTING ALL THE DATA
export const getAllTax = async (req, res) => {
    try {
        const listofData = await Tax.findOne();
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// CREATE NEW DATA
export const saveTax = async (req, res) => {
    try {
        const data = await Tax.findOneAndUpdate(
            {
                _id: { $ne: null }
            },
            req.body,
            { new: true, upsert: true }
        );
        return res.json(data);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};