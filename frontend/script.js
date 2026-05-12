const fs = require('fs');
const file = 'd:/Practicas/Caja/frontend/src/pages/AdminDashboard.jsx';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const chartStartIndex = lines.findIndex(l => l.includes('{/* Capital Distribution Chart */}'));
const tabsStartIndex = lines.findIndex(l => l.includes('{/* Navigation Tabs - Segmented Control Style */}'));
const modalOpenIndex = lines.findIndex(l => l.includes('{modalOpen && ('));

const tableContainerEndIndex = modalOpenIndex - 2;

const before = lines.slice(0, chartStartIndex);
const chart = lines.slice(chartStartIndex, tabsStartIndex);
const tabsAndTable = lines.slice(tabsStartIndex, tableContainerEndIndex);
const after = lines.slice(tableContainerEndIndex);

const modifiedChart = chart.map((l, i) => {
  if (l.includes('mb-10')) return l.replace('mb-10', 'mt-10 mb-10');
  return l;
});

const newContent = [...before, ...tabsAndTable, ...modifiedChart, ...after].join('\n');
fs.writeFileSync(file, newContent);
console.log('Done!');

