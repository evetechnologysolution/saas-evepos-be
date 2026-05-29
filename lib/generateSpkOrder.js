const generateNextSpkId = (orderId, counter, digit = 2) => {
    const suffix = String(counter).padStart(digit, "0");
    return `${orderId}${suffix}`;
};

export const generateListSpkOld = (orders = [], orderId = "") => {
    const maxKilo = 8;
    const listSpk = [];
    let counter = 1;

    orders.forEach((item) => {
        const {
            id,
            name,
            image,
            qty = 0,
            category,
            unit,
            variant,
            notes,
        } = item;

        // ================= NON KILOAN =================
        if (category?.toLowerCase() !== "kiloan") {
            listSpk.push({
                spkId: generateNextSpkId(orderId, counter),
                id,
                name,
                image,
                qty,
                category,
                unit,
                variant,
                notes,
                isPickedUp: false,
                pickupData: {
                    date: null,
                    by: "",
                },
            });

            counter += 1;
            return;
        }

        // ================= KILOAN =================
        let remainingQty = Number(qty);

        while (remainingQty > 0) {
            const split = Math.min(maxKilo, remainingQty);

            listSpk.push({
                spkId: generateNextSpkId(orderId, counter),
                id,
                name,
                image,
                qty: Math.round(split * 10) / 10,
                category,
                unit,
                variant,
                notes,
                isPickedUp: false,
                pickupData: {
                    date: null,
                    by: "",
                },
            });

            counter += 1;

            remainingQty -= split;
            remainingQty = Math.round(remainingQty * 10) / 10;
        }
    });

    return listSpk;
};

export const generateListSpk = (orders = [], orderId = "") => {
    const maxKilo = 8;
    const listSpk = [];
    let counter = 1;

    orders.forEach((item) => {
        const {
            id,
            name,
            image,
            qty = 0,
            category,
            unit,
            variant,
            notes,
        } = item;

        /**
         * ================= NON KILOAN =================
         */
        if (category?.toLowerCase() !== "kiloan") {
            listSpk.push({
                spkId: generateNextSpkId(orderId, counter),
                id,
                name,
                image,
                qty,
                category,
                unit,
                variant,
                notes,
                isPickedUp: false,
                pickupData: {
                    date: null,
                    by: "",
                },
            });

            counter += 1;

            return;
        }

        /**
         * ================= KILOAN =================
         */
        const totalQty = Number(qty);

        /**
         * Jika <= max langsung push
         */
        if (totalQty <= maxKilo) {
            listSpk.push({
                spkId: generateNextSpkId(orderId, counter),
                id,
                name,
                image,
                qty: totalQty,
                category,
                unit,
                variant,
                notes,
                isPickedUp: false,
                pickupData: {
                    date: null,
                    by: "",
                },
            });

            counter += 1;

            return;
        }

        /**
         * Hitung jumlah split
         * contoh:
         * 9kg -> 2 part
         * 17kg -> 3 part
         */
        const totalPart = Math.ceil(totalQty / maxKilo);

        /**
         * Bagi rata
         */
        const splitQty =
            Math.round((totalQty / totalPart) * 10) / 10;

        // for (let i = 0; i < totalPart; i++) {
        for (let i = 0; i < totalPart; i += 1) {
            /**
             * Part terakhir ambil sisa agar presisi
             */
            const usedQty = splitQty * i;

            const currentQty = i === totalPart - 1
                ? Math.round((totalQty - usedQty) * 10) / 10
                : splitQty;

            listSpk.push({
                spkId: generateNextSpkId(orderId, counter),
                id,
                name,
                image,
                qty: currentQty,
                category,
                unit,
                variant,
                notes,
                isPickedUp: false,
                pickupData: {
                    date: null,
                    by: "",
                },
            });

            counter += 1;
        }
    });

    return listSpk;
};