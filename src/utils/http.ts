export async function readJsonSafe<T>(response: Response): Promise<Partial<T>> {
  const raw = await response.text();
  if (!raw) return {};

  try {
    return JSON.parse(raw) as Partial<T>;
  } catch {
    return {};
  }
}

