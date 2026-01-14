import Info from "../models/information.js";

// GETTING ALL THE DATA
export const getAllInfo = async (req, res) => {
    try {
        const listofData = await Info.findOne();
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// CREATE NEW DATA
export const saveInfo = async (req, res) => {
    try {
        const data = await Info.findOneAndUpdate(
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