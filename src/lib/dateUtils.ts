export function getYearMonthStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getCurrentMonthStr(): string {
  return getYearMonthStr(new Date());
}

export function getPreviousMonthStr(): string {
  const d = new Date();
  d.setDate(1); // Avoid end-of-month rollover (e.g., May 31 -> Apr 31 which rolls over to May 1st)
  d.setMonth(d.getMonth() - 1);
  return getYearMonthStr(d);
}

export function getMonthsBetween(startMonth: string, endMonth: string): string[] {
  const months: string[] = [];
  if (!startMonth || !endMonth || startMonth > endMonth) return months;
  
  let [startYear, startMon] = startMonth.split('-').map(Number);
  const [endYear, endMon] = endMonth.split('-').map(Number);
  
  if (isNaN(startYear) || !startMon || isNaN(endYear) || !endMon) {
    return months;
  }
  
  while (startYear < endYear || (startYear === endYear && startMon <= endMon)) {
    months.push(`${startYear}-${String(startMon).padStart(2, '0')}`);
    startMon++;
    if (startMon > 12) {
      startMon = 1;
      startYear++;
    }
  }
  return months;
}

export function getRecentMonths(count: number): { value: string; labelEn: string; labelBn: string }[] {
  const months = [];
  const d = new Date();
  d.setDate(1); // Set to 1st of month to avoid overflow rollover
  for (let i = 0; i < count; i++) {
    const temp = new Date(d.getTime());
    temp.setMonth(d.getMonth() - i);
    const mVal = getYearMonthStr(temp);
    const labelEn = temp.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const labelBn = temp.toLocaleString('bn-BD', { month: 'long', year: 'numeric' });
    months.push({ value: mVal, labelEn, labelBn });
  }
  return months;
}

export function getLocalDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

