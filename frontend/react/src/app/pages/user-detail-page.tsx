import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { fieldErrorsOf, firstMessage, isNotFound, messageOf } from "@/domain/problem";
import { useUpdateUser, useUser } from "@/features/users/use-users";
import { Alert } from "@/ui/alert";
import { Button } from "@/ui/button";
import { Field } from "@/ui/field";
import { Failed, Loading } from "@/ui/states";

const schema = z.object({
  name: z.string().min(1, "Informe o nome"),
  email: z.string().min(1, "Informe o e-mail").email("Formato de e-mail inválido"),
});

function LoadFailure({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  if (isNotFound(error)) return <Failed message="Usuário não encontrado." />;
  return <Failed message={messageOf(error)} onRetry={onRetry} />;
}

export function UserDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const user = useUser(id);
  const update = useUpdateUser(id);

  const { register, handleSubmit, formState, reset } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (user.data) reset({ name: user.data.name, email: user.data.email });
  }, [user.data, reset]);

  const serverErrors = fieldErrorsOf(update.error);

  if (user.isPending) return <Loading />;
  if (user.isError) return <LoadFailure error={user.error} onRetry={() => void user.refetch()} />;

  return (
    <section className="max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold">Editar usuário</h1>

      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          void handleSubmit((values) => {
            update.mutate(values);
          })(event);
        }}
      >
        <Field
          label="Nome"
          error={firstMessage(formState.errors.name?.message, serverErrors["name"])}
          {...register("name")}
        />
        <Field
          label="E-mail"
          type="email"
          error={firstMessage(formState.errors.email?.message, serverErrors["email"])}
          {...register("email")}
        />

        {update.isSuccess ? <Alert tone="success">Alterações salvas.</Alert> : null}
        {update.isError && Object.keys(serverErrors).length === 0 ? (
          <Alert tone="error">{messageOf(update.error)}</Alert>
        ) : null}

        <div className="flex gap-3">
          <Button type="submit" loading={update.isPending}>
            Salvar
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              void navigate("/users");
            }}
          >
            Voltar
          </Button>
        </div>
      </form>
    </section>
  );
}
