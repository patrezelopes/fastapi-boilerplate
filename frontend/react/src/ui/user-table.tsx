import { type User, initialsOf } from "@/domain/user";

interface Props {
  users: User[];
  onOpen: (user: User) => void;
  onRemove: (user: User) => void;
}

export function UserTable({ users, onOpen, onRemove }: Props) {
  return (
    <table className="w-full border-collapse text-sm">
      <caption className="sr-only">Usuários cadastrados</caption>
      <thead>
        <tr className="border-b border-stone-300 text-left text-xs uppercase tracking-wide text-stone-500">
          <th className="py-2 font-medium">Nome</th>
          <th className="py-2 font-medium">E-mail</th>
          <th className="py-2" />
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id} className="border-b border-stone-200 hover:bg-stone-50">
            <td className="py-2">
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="grid size-7 place-items-center rounded-full bg-stone-200 text-xs font-semibold text-stone-600"
                >
                  {initialsOf(user)}
                </span>
                {user.name}
              </span>
            </td>
            <td className="py-2 text-stone-600">{user.email}</td>
            <td className="py-2 text-right">
              <button
                onClick={() => {
                  onOpen(user);
                }}
                className="mr-3 text-stone-700 underline"
              >
                Abrir
              </button>
              <button
                onClick={() => {
                  onRemove(user);
                }}
                aria-label={`Remover ${user.name}`}
                className="text-red-700 underline"
              >
                Remover
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
