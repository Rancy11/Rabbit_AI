const Papa = require('papaparse');
const XLSX = require('xlsx');

/**
 * Parse a CSV buffer into an array of row objects.
 * @param {Buffer} buffer
 * @returns {{ rows: object[], headers: string[] }}
 */
function parseCSV(buffer) {
  const text = buffer.toString('utf-8');
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });
  if (result.errors.length > 0) {
    throw new Error(`CSV parse error: ${result.errors[0].message}`);
  }
  return {
    rows: result.data,
    headers: result.meta.fields || [],
  };
}

/**
 * Parse an XLSX buffer into an array of row objects (first sheet).
 * @param {Buffer} buffer
 * @returns {{ rows: object[], headers: string[] }}
 */
function parseXLSX(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('No sheets found in workbook.');
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  return { rows, headers };
}

/**
 * Parse an uploaded file based on its mimetype.
 * @param {Buffer} buffer
 * @param {string} mimetype
 * @returns {{ rows: object[], headers: string[] }}
 */
function parseFile(buffer, mimetype) {
  if (mimetype === 'text/csv' || mimetype === 'application/csv') {
    return parseCSV(buffer);
  }
  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimetype === 'application/vnd.ms-excel'
  ) {
    return parseXLSX(buffer);
  }
  throw new Error(`Unsupported file type: ${mimetype}`);
}

/**
 * Convert rows array into a plain text table for the AI prompt.
 * @param {object[]} rows
 * @param {string[]} headers
 * @returns {string}
 */
function rowsToText(rows, headers) {
  const lines = [headers.join(' | ')];
  rows.forEach((row) => {
    lines.push(headers.map((h) => row[h] ?? '').join(' | '));
  });
  return lines.join('\n');
}

module.exports = { parseFile, rowsToText };
