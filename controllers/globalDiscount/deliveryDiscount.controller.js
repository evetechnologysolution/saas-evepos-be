import Disc from "../../models/globalDiscount/deliveryDiscount.js";

// GETTING ALL THE DATA
export const getAllDisc = async (req, res) => {
    try {
        let qMatch = {};
        if (req.userData?.tenantRef) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }
        const listofData = await Disc.findOne(qMatch);
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const getAvailableDisc = async (req, res) => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let qMatch = {
            start: { $lte: today },
            end: { $gte: today },
        };
        if (req.userData?.tenantRef) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }

        const listofData = await Disc.findOne(qMatch);
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// CREATE NEW DATA
export const saveDisc = async (req, res) => {
    try {
        let qMatch = { _id: { $ne: null } };
        let objData = req.body;
        if (objData.start) {
            const now = new Date(objData.start);
            objData.start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        }
        if (objData.end) {
            const now = new Date(objData.end);
            objData.end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        }

        if (req.userData?.tenantRef) {
            qMatch.tenantRef = req.userData?.tenantRef;
            objData.tenantRef = req.userData?.tenantRef;
        }

        const data = await Disc.findOneAndUpdate(qMatch, objData, { new: true, upsert: true });
        return res.json(data);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
