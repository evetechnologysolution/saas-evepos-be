import Setting from "../models/settings.js";

// GETTING ALL THE DATA
export const getAllSetting = async (req, res) => {
    try {
        const listofData = await Setting.findOne();
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// CREATE NEW DATA
export const saveSetting = async (req, res) => {
    try {
        const data = await Setting.findOneAndUpdate(
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