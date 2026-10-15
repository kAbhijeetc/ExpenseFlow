/**
 * Utility to escape a single CSV field properly according to RFC 4180
 * Handles quotes, commas, newlines, and formula injection mitigation
 */
export const escapeCsvField = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  let str = String(value);

  // Security: Mitigate CSV injection (cells starting with =, +, -, @, \t, \r)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // If contains commas, double quotes, or newlines, enclose in quotes and escape internal quotes
  if (/[",\r\n]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
};

/**
 * Generate CSV string from headers array and rows array
 */
export const generateCsv = (headers, rows) => {
  const headerLine = headers.map(escapeCsvField).join(',');
  const rowLines = rows.map((row) => row.map(escapeCsvField).join(','));
  return [headerLine, ...rowLines].join('\r\n');
};
