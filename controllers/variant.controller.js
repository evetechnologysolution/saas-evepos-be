import Variant from "../models/variant.js";

// GETTING ALL THE DATA
export const getAllVariant = async (req, res) => {
    try {
        const listofData = await Variant.find();
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// GETTING ALL THE DATA
export const getPaginateVariant = async (req, res) => {
    try {
        const { page, perPage, search } = req.query;
        let query = {};
        if (search) {
            query = {
                ...query,
                name: { $regex: search, $options: 'i' }, // option i for case insensitivity to match upper and lower cases.
            };
        };
        const options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
            sort: { name: 1 },
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
        const data = new Variant(req.body);
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