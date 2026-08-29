import { messageOf } from "@/domain/problem";
import { initialsOf } from "@/domain/user";
import { useCurrentUser } from "@/features/auth/use-auth";
import { Failed, Loading } from "@/ui/states";

export function MePage() {
  const me = useCurrentUser();

  if (me.isPending) return <Loading />;
  if (me.isError) return <Failed message={messageOf(me.error)} onRetry={() => void me.refetch()} />;

  return (
    <section>
      <h1 className="mb-6 text-2xl font-semibold">Meu perfil</h1>
      <div className="flex items-center gap-4 rounded border border-stone-200 bg-white p-6">
        <span
          aria-hidden
          className="grid size-12 place-items-center rounded-full bg-stone-200 text-lg font-semibold text-stone-600"
        >
          {initialsOf(me.data)}
        </span>
        <dl className="text-sm">
          <dt className="sr-only">Nome</dt>
          <dd className="font-medium">{me.data.name}</dd>
          <dt className="sr-only">E-mail</dt>
          <dd className="text-stone-600">{me.data.email}</dd>
        </dl>
      </div>
    </section>
  );
}
