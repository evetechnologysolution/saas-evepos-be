const formatDate = (date) => {
    return new Date(date).toLocaleDateString("id-ID", {
        year: "2-digit",
        month: "short",
        day: "numeric",
    });
};

const formatDateTime = (date) =>
    new Date(date).toLocaleDateString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        year: "numeric",
        month: "short",
        day: "2-digit",
    });

const formatOnlyTime = (date) =>
    new Date(date).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
    });

const addNHour = (date, hour = 1) => {
    const newDate = new Date(date);
    newDate.setHours(newDate.getHours() + hour);
    return newDate;
};

const getFirstAndLastDayOfWeek = () => {
    const curr = new Date();

    const today = new Date(curr.getFullYear(), curr.getMonth(), curr.getDate());
    const currentDayOfWeek = today.getDay();

    const daysUntilFirstDay = -currentDayOfWeek;
    const daysUntilLastDay = 6 - currentDayOfWeek;

    const firstDay = new Date(today);
    firstDay.setDate(today.getDate() + daysUntilFirstDay);

    const lastDay = new Date(today);
    lastDay.setDate(today.getDate() + daysUntilLastDay);

    return {
        firstDay,
        lastDay,
    };
};

const getFirstAndLastDayOfLastWeek = () => {
    const curr = new Date();
    const today = new Date(curr.getFullYear(), curr.getMonth(), curr.getDate());

    const daysInWeek = 7;

    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(firstDayOfWeek.getDate() - today.getDay());

    const firstDayOfLastWeek = new Date(firstDayOfWeek);
    firstDayOfLastWeek.setDate(firstDayOfLastWeek.getDate() - daysInWeek);

    const lastDayOfLastWeek = new Date(firstDayOfLastWeek);
    lastDayOfLastWeek.setDate(lastDayOfLastWeek.getDate() + (daysInWeek - 1));

    return {
        firstDayOfLastWeek,
        lastDayOfLastWeek,
    };
};

const getDatesInRange = (startDate, endDate) => {
    const date = new Date(startDate);
    const dates = [];

    while (date < endDate) {
        dates.push(formatDate(date));
        date.setDate(date.getDate() + 1);
    }

    return dates;
};

export {
    getFirstAndLastDayOfWeek,
    getFirstAndLastDayOfLastWeek,
    getDatesInRange,
    formatDate,
    formatDateTime,
    formatOnlyTime,
    addNHour,
};
