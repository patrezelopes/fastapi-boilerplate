import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { z } from "zod";
import { useLogin } from "@/features/auth/use-auth";
import { fieldErrorsOf, firstMessage, messageOf } from "@/domain/problem";
import { Alert } from "@/ui/alert";
import { Button } from "@/ui/button";
import { Field } from "@/ui/field";

const schema = z.object({
  email: z.string().min(1, "Informe o e-mail").email("Formato de e-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

export function LoginPage() {
  const login = useLogin();
  const navigate = useNavigate();
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  const serverErrors = fieldErrorsOf(login.error);

  return (
    <section className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold">Entrar</h1>

      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          void handleSubmit((values) => {
            login.mutate(values, { onSuccess: () => void navigate("/users") });
          })(event);
        }}
      >
        <Field
          label="E-mail"
          type="email"
          autoComplete="email"
          error={firstMessage(formState.errors.email?.message, serverErrors["email"])}
          {...register("email")}
        />
        <Field
          label="Senha"
          type="password"
          autoComplete="current-password"
          error={firstMessage(formState.errors.password?.message, serverErrors["password"])}
          {...register("password")}
        />

        {login.isError && Object.keys(serverErrors).length === 0 ? (
          <Alert tone="error">{messageOf(login.error)}</Alert>
        ) : null}

        <Button type="submit" loading={login.isPending}>
          Entrar
        </Button>
      </form>

      <p className="mt-6 text-sm text-stone-600">
        Não tem conta?{" "}
        <Link to="/register" className="underline">
          Criar conta
        </Link>
      </p>
    </section>
  );
}
