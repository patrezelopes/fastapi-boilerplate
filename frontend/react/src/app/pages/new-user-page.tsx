import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";
import { fieldErrorsOf, firstMessage, messageOf } from "@/domain/problem";
import { useCreateUser } from "@/features/users/use-users";
import { Alert } from "@/ui/alert";
import { Button } from "@/ui/button";
import { Field } from "@/ui/field";

const schema = z.object({
  name: z.string().min(1, "Informe o nome"),
  email: z.string().min(1, "Informe o e-mail").email("Formato de e-mail inválido"),
  password: z.string().min(12, "A senha precisa de ao menos 12 caracteres"),
});

export function NewUserPage() {
  const createUser = useCreateUser();
  const navigate = useNavigate();
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  const serverErrors = fieldErrorsOf(createUser.error);

  return (
    <section className="max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold">Novo usuário</h1>

      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          void handleSubmit((values) => {
            createUser.mutate(values, { onSuccess: () => void navigate("/users") });
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
        <Field
          label="Senha"
          type="password"
          autoComplete="new-password"
          error={firstMessage(formState.errors.password?.message, serverErrors["password"])}
          {...register("password")}
        />

        {createUser.isError && Object.keys(serverErrors).length === 0 ? (
          <Alert tone="error">{messageOf(createUser.error)}</Alert>
        ) : null}

        <div className="flex gap-3">
          <Button type="submit" loading={createUser.isPending}>
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
