import { fetchDashboardData } from './src/services/api.ts';

(async () => {
  const data = await fetchDashboardData();
  console.log('rows', data.table.length);
  console.log('exam codes sample', data.filters.examCodes.slice(0, 5));
  const examCode = data.filters.examCodes.find((code) => !code.startsWith('All'));
  if (examCode) {
    const filtered = await fetchDashboardData({ examCode });
    console.log('filtered rows', filtered.table.length, 'code', examCode);
  }
})();
