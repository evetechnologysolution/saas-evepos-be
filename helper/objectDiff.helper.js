export const diffObject = (before = {}, after = {}) => {
  const diff = {};

  Object.keys(after).forEach((key) => {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      diff[key] = {
        before: before[key],
        after: after[key],
      };
    }
  });

  return Object.keys(diff).length ? diff : null;
};
