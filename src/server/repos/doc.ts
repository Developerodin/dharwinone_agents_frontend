// Port of studio.models.to_doc: the camelCase dict shape the services/routes
// consume — every column except the surrogate integer `id`.
export function toDoc<T extends { id?: unknown }>(row: T | null): Omit<T, "id"> | null {
  if (!row) return null;
  const { id: _id, ...rest } = row;
  return rest;
}
