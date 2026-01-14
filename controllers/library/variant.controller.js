import Variant from "../../models/library/variant.js";

// GETTING ALL THE DATA
export const getAllVariant = async (req, res) => {
    try {
        let query = {};

        if (req.userData) {
            query.tenantRef = req.userData?.tenantRef;
            query.outletRef = req.userData?.outletRef;
        }

        const listofData = await Variant.find(query).lean();
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// GETTING ALL THE DATA
export const getPaginateVariant = async (req, res) => {
    try {
        const { page, perPage, search, sort } = req.query;
        let query = {};

        if (req.userData) {
            query.tenantRef = req.userData?.tenantRef;
            query.outletRef = req.userData?.outletRef;
        }

        if (search) {
            query = {
                ...query,
                name: { $regex: search, $options: 'i' }, // option i for case insensitivity to match upper and lower cases.
            };
        };

        let sortObj = { name: 1 }; // default
        if (sort && sort.trim() !== "") {
            sortObj = {};
            sort.split(",").forEach((rule) => {
                const [field, type] = rule.split(":");
                sortObj[field] = type === "asc" ? 1 : -1;
            });
        }

        const options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
            sort: sortObj,
        }
        const listofData = await Variant.paginate(query, options);
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// UPDATE A SPECIFIC DATA BY ID
export const getVariantById = async (req, res) => {
    try {
        const spesificData = await Variant.findById(req.params.id);
        return res.json(spesificData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// CREATE NEW DATA
export const addVariant = async (req, res) => {
    try {
        let objData = req.body;
        if (req.userData) {
            objData.tenantRef = req.userData?.tenantRef;
            objData.outletRef = req.userData?.outletRef;
        }
        const data = new Variant(objData);
        const newData = await data.save();
        return res.json(newData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// UPDATE A SPECIFIC DATA
export const editVariant = async (req, res) => {
    try {
        const updatedData = await Variant.updateOne(
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
export const deleteVariant = async (req, res) => {
    try {
        const deletedData = await Variant.deleteOne({ _id: req.params.id });
        return res.json(deletedData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};