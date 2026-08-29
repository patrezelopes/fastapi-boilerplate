export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/** Iniciais para o avatar. "Ana Maria Souza" → "AS". */
export function initialsOf(user: Pick<User, "name">): string {
  const [first, ...rest] = user.name.trim().split(/\s+/).filter(Boolean);
  if (first === undefined) return "?";
  return (first.charAt(0) + (rest.at(-1)?.charAt(0) ?? "")).toUpperCase();
}
