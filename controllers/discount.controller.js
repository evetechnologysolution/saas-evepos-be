import Disc from "../models/discount.js";

// GETTING ALL THE DATA
export const getAllDisc = async (_, res) => {
    try {
        const listofData = await Disc.findOne();
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const getAvailableDisc = async (_, res) => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const listofData = await Disc.findOne({
            start: { $lte: today },
            end: { $gte: today }
        });
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// CREATE NEW DATA
export const saveDisc = async (req, res) => {
    try {
        let objData = req.body;
        if (objData.start) {
            const now = new Date(objData.start);
            objData.start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        }
        if (objData.end) {
            const now = new Date(objData.end);
            objData.end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        }
        const data = await Disc.findOneAndUpdate(
            {
                _id: { $ne: null }
            },
            objData,
            { new: true, upsert: true }
        );
        return res.json(data);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};