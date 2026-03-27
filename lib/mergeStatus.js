const mergeMasterStatus = (orders = []) => {
    const map = new Map();

    orders.forEach((order) => {
        const statuses = order?.masterProgressRef?.masterStatus || [];

        statuses.forEach((status) => {
            const key = String(status._id);

            // hanya ambil pertama kali muncul
            if (!map.has(key)) {
                map.set(key, {
                    _id: status._id,
                    name: status.name,
                });
            }
        });
    });

    return Array.from(map.values());
};

export { mergeMasterStatus }