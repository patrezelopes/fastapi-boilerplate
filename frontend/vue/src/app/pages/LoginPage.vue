<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { computed } from "vue";
import { useRouter } from "vue-router";
import { z } from "zod";
import { fieldErrorsOf, firstMessage, messageOf } from "@/domain/problem";
import { useLogin } from "@/features/auth/use-auth";
import AppAlert from "@/ui/AppAlert.vue";
import AppButton from "@/ui/AppButton.vue";
import AppField from "@/ui/AppField.vue";

const schema = toTypedSchema(
  z.object({
    email: z.string().min(1, "Informe o e-mail").email("Formato de e-mail inválido"),
    password: z.string().min(1, "Informe a senha"),
  }),
);

const { handleSubmit, errors, defineField } = useForm({ validationSchema: schema });
const [email] = defineField("email");
const [password] = defineField("password");

const login = useLogin();
const router = useRouter();
const serverErrors = computed(() => fieldErrorsOf(login.error.value));
const hasGeneralError = computed(
  () => login.isError.value && Object.keys(serverErrors.value).length === 0,
);

const onSubmit = handleSubmit((values) => {
  login.mutate(values, { onSuccess: () => void router.push("/users") });
});
</script>

<template>
  <section class="mx-auto max-w-sm">
    <h1 class="mb-6 text-2xl font-semibold">Entrar</h1>

    <form novalidate class="flex flex-col gap-4" @submit="onSubmit">
      <AppField
        v-model="email"
        label="E-mail"
        type="email"
        autocomplete="email"
        :error="firstMessage(errors.email, serverErrors['email'])"
      />
      <AppField
        v-model="password"
        label="Senha"
        type="password"
        autocomplete="current-password"
        :error="firstMessage(errors.password, serverErrors['password'])"
      />

      <AppAlert v-if="hasGeneralError" tone="error">{{ messageOf(login.error.value) }}</AppAlert>

      <AppButton type="submit" :loading="login.isPending.value">Entrar</AppButton>
    </form>

    <p class="mt-6 text-sm text-stone-600">
      Não tem conta? <RouterLink to="/register" class="underline">Criar conta</RouterLink>
    </p>
  </section>
</template>
