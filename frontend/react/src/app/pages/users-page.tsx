import { useState } from "react";
import { useNavigate } from "react-router";
import { isEmpty } from "@/domain/page";
import { messageOf } from "@/domain/problem";
import { useDeleteUser, useUsers } from "@/features/users/use-users";
import { Button } from "@/ui/button";
import { Field } from "@/ui/field";
import { Pagination } from "@/ui/pagination";
import { Empty, Failed, Loading } from "@/ui/states";
import { UserTable } from "@/ui/user-table";

export function UsersPage() {
  const [page, setPage] = useState(1);
  const [term, setTerm] = useState("");
  const navigate = useNavigate();

  const users = useUsers({ page, perPage: 10, term: term || undefined });
  const removeUser = useDeleteUser();

  return (
    <section>
      <div className="mb-6 flex items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold">Usuários</h1>
        <Button
          onClick={() => {
            void navigate("/register");
          }}
        >
          Novo usuário
        </Button>
      </div>

      <div className="mb-6 max-w-sm">
        <Field
          label="Buscar"
          placeholder="nome ou e-mail"
          value={term}
          onChange={(event) => {
            setTerm(event.target.value);
            setPage(1);
          }}
        />
      </div>

      {users.isPending ? <Loading /> : null}
      {users.isError ? (
        <Failed message={messageOf(users.error)} onRetry={() => void users.refetch()} />
      ) : null}

      {users.data && isEmpty(users.data) ? <Empty>Nenhum usuário encontrado.</Empty> : null}

      {users.data && !isEmpty(users.data) ? (
        <div className="flex flex-col gap-6">
          <UserTable
            users={users.data.items}
            onOpen={(user) => void navigate(`/users/${user.id}`)}
            onRemove={(user) => {
              removeUser.mutate(user.id);
            }}
          />
          <Pagination
            page={users.data.page}
            totalPages={users.data.totalPages}
            onChange={setPage}
          />
        </div>
      ) : null}
    </section>
  );
}
