export function serializeLinks(rows) {
  return rows.map((row) => {
    const createdAt = row.createdAt || new Date(parseInt(row.id.slice(0, 8), 16) * 1000);
    return { ...row, createdAt, updatedAt: row.updatedAt || createdAt };
  }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id));
}
