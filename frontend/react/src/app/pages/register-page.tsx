import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { z } from "zod";
import { fieldErrorsOf, firstMessage, messageOf } from "@/domain/problem";
import { useRegister } from "@/features/auth/use-auth";
import { Alert } from "@/ui/alert";
import { Button } from "@/ui/button";
import { Field } from "@/ui/field";

const schema = z.object({
  name: z.string().min(1, "Informe o nome"),
  email: z.string().min(1, "Informe o e-mail").email("Formato de e-mail inválido"),
  password: z.string().min(12, "A senha precisa de ao menos 12 caracteres"),
});

export function RegisterPage() {
  const registerUser = useRegister();
  const navigate = useNavigate();
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  const serverErrors = fieldErrorsOf(registerUser.error);

  return (
    <section className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold">Criar conta</h1>

      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          void handleSubmit((values) => {
            registerUser.mutate(values, { onSuccess: () => void navigate("/login") });
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

        {registerUser.isError && Object.keys(serverErrors).length === 0 ? (
          <Alert tone="error">{messageOf(registerUser.error)}</Alert>
        ) : null}

        <Button type="submit" loading={registerUser.isPending}>
          Criar conta
        </Button>
      </form>

      <p className="mt-6 text-sm text-stone-600">
        Já tem conta?{" "}
        <Link to="/login" className="underline">
          Entrar
        </Link>
      </p>
    </section>
  );
}
