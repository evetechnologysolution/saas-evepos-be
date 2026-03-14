import ArticleCategory from "../../models/article/articleCate.js";

export const getCategory = async (req, res) => {
    try {
        let qMatch = {};

        if (req.userData?.tenantRef) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }

        const category = await ArticleCategory.findOne(qMatch);

        if (!category) {
            return res.status(404).json({ message: "No category data found" });
        }

        return res.status(200).json(category);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const addOrUpdateCategory = async (req, res) => {
    try {
        let qMatch = {};

        if (req.userData?.tenantRef) {
            qMatch.tenantRef = req.userData?.tenantRef;
        }

        const { name } = req.body;

        if (!name || !Array.isArray(name)) {
            return res.status(400).json({ message: "Name must be a valid array" });
        }

        const updatedCategory = await ArticleCategory.findOneAndUpdate(qMatch, { $set: { name } }, { upsert: true, new: true });

        return res.status(200).json(updatedCategory);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
