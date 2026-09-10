const extractTables = (text) => {
  if (!text || !text.trim()) {
    return [];
  }

  const lines = text.split('\n');
  const tables = [];
  let currentTable = [];

  for (const line of lines) {
    const cleanLine = line.trim();

    // Detect rows where multiple columns appear separated by tabs or spaces
    const columns = cleanLine
      .split(/\t+|\s{2,}/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (columns.length >= 2) {
      currentTable.push(columns.join(' | '));
    } else {
      // Save the table only if at least two table-like rows were found
      if (currentTable.length >= 2) {
        tables.push(currentTable.join('\n'));
      }

      currentTable = [];
    }
  }

  if (currentTable.length >= 2) {
    tables.push(currentTable.join('\n'));
  }

  return tables;
};

export default extractTables;