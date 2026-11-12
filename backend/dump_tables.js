const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

(async () => {
  const SQL = await initSqlJs();
  const buf = fs.readFileSync(path.join(__dirname, 'erp.db'));
  const db = new SQL.Database(buf);
  
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log('=== DATABASE TABLES ===\n');
  
  tables[0].values.forEach(([t]) => {
    console.log('--- ' + t.toUpperCase() + ' ---');
    const cols = db.exec('PRAGMA table_info(' + t + ')');
    const colNames = cols[0].values.map(c => c[1]);
    console.log('Columns: ' + colNames.join(', '));
    const countResult = db.exec('SELECT COUNT(*) FROM ' + t);
    const count = countResult[0].values[0][0];
    console.log('Total Rows: ' + count);
    const rows = db.exec('SELECT * FROM ' + t + ' LIMIT 5');
    if (rows.length && rows[0].values.length > 0) {
      console.log('  ' + colNames.join(' | '));
      console.log('  ' + colNames.map(() => '---').join(' | '));
      rows[0].values.forEach(r => {
        console.log('  ' + r.map(v => v === null ? 'NULL' : v).join(' | '));
      });
      if (count > 5) console.log('  ... and ' + (count - 5) + ' more rows');
    } else {
      console.log('  (empty)');
    }
    console.log('');
  });
})();
