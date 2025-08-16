export const exportToCsv = <T extends Record<string, unknown>>(data: T[], filename: string) => {
  if (!data.length) {
    console.warn("No data to export.");
    return;
  }

  const headers = Object.keys(data[0]) as (keyof T)[];
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(fieldName => JSON.stringify(row[fieldName])).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};