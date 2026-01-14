import Cart from "../models/cart.js";

export const getCartByMember = async (req, res) => {
    try {
        const updatedCart = await Cart.findOneAndUpdate(
            { member: req.params.id }, // Mencari keranjang berdasarkan member ID
            { $setOnInsert: { member: req.params.id, items: [] } }, // Jika tidak ditemukan, buat keranjang baru dengan member dan items kosong
            { upsert: true, new: true } // Menggunakan opsi upsert untuk membuat data jika tidak ada, dan new untuk mengembalikan data terbaru
        );
        return res.status(200).json(updatedCart);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const addItemToCart = async (req, res) => {
    try {
        // Cek apakah items adalah array, jika bukan ubah menjadi array
        const dataItems = Array.isArray(req.body.items) ? req.body.items : [req.body.items];

        const updatedCart = await Cart.findOneAndUpdate(
            { member: req.params.id }, // Find cart by member
            {
                $push: { items: { $each: dataItems } }, // Add new item
            },
            { upsert: true, new: true }
        );

        return res.status(200).json(updatedCart);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const addItemToCartNoDuplicate = async (req, res) => {
    try {
        // Cek apakah items adalah array, jika bukan ubah menjadi array
        const dataItems = Array.isArray(req.body.items) ? req.body.items : [req.body.items];

        for (const newItem of dataItems) {
            await Cart.findOneAndUpdate(
                { member: req.params.id, "items.id": newItem.id }, // Cari cart berdasarkan member dan items.id
                {
                    // Jika item ditemukan, tambahkan qty, jika tidak, tambahkan item baru
                    $inc: { "items.$.qty": newItem.qty }, // Tambahkan qty jika item sudah ada
                    $setOnInsert: { "items.$": newItem } // Tambahkan item baru jika belum ada
                },
                { upsert: true }
            );
        }

        const updatedCart = await Cart.findOne({ member: req.params.id }); // Ambil cart yang sudah diperbarui
        return res.status(200).json(updatedCart);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};



export const updateItemQtyToCart = async (req, res) => {
    try {
        const { _itemId, qty } = req.body;

        let updatedCart;
        if (qty === 0) {
            // Hapus item dari keranjang jika qty = 0
            updatedCart = await Cart.findOneAndUpdate(
                { member: req.params.id },
                { $pull: { items: { _id: _itemId } } },
                { new: true }
            );
        } else {
            // Perbarui jumlah item jika qty > 0
            updatedCart = await Cart.findOneAndUpdate(
                { member: req.params.id, "items._id": _itemId },
                { $set: { "items.$.qty": qty } },
                { new: true }
            );
        }

        return res.status(200).json(updatedCart);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const deleteItemFromCart = async (req, res) => {
    try {
        const { _itemId } = req.body;

        const updatedCart = await Cart.findOneAndUpdate(
            { member: req.params.id },
            { $pull: { items: { _id: _itemId } } },
            { new: true }
        );

        return res.status(200).json(updatedCart);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const clearItemFromCart = async (req, res) => {
    try {
        const updatedCart = await Cart.findOneAndUpdate(
            { member: req.params.id },
            { $set: { items: [] } },
            { new: true }
        );

        return res.status(200).json(updatedCart);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const deleteCart = async (req, res) => {
    try {
        const deletedData = await Cart.deleteOne({ member: req.params.id });
        return res.json(deletedData);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};