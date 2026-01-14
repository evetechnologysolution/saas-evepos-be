import Customer from "../models/customer.js";

// GETTING ALL THE DATA
export const getAllCustomer = async (req, res) => {
    try {
        const { page, perPage, search } = req.query;
        let query = {};
        if (search) {
            query = {
                ...query,
                $or: [
                    { customerId: { $regex: search, $options: "i" } },
                    { name: { $regex: search, $options: "i" } },
                    { phone: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                ],  // option i for case insensitivity to match upper and lower cases.
            };
        };

        const options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(perPage, 10) || 10,
            sort: { name: 1 },
        }
        const listofData = await Customer.paginate(query, options);
        return res.json(listofData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const getCustomerById = async (req, res) => {
    try {
        const spesificData = await Customer.findById(req.params.id);
        return res.json(spesificData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// CREATE NEW DATA
export const addCustomer = async (req, res) => {
    try {
        const data = new Customer(req.body);
        const newData = await data.save();
        return res.json(newData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// UPDATE A SPECIFIC DATA
export const editCustomer = async (req, res) => {
    try {
        let objData = req.body;

        const updatedData = await Customer.findOneAndUpdate(
            { _id: req.params.id },
            { $set: objData },
            { new: true, upsert: true }
        );
        return res.json(updatedData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// DELETE A SPECIFIC DATA
export const deleteCustomer = async (req, res) => {
    try {
        const deletedData = await Customer.deleteOne({ _id: req.params.id });
        return res.json(deletedData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};