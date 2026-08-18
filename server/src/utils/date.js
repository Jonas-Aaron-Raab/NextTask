function parseDate(value, emptyValue = null) {
  if (!value) return emptyValue;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? emptyValue : date;
}

module.exports = { parseDate };
