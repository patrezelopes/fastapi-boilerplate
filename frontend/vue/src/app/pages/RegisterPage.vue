<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { computed } from "vue";
import { useRouter } from "vue-router";
import { z } from "zod";
import { fieldErrorsOf, firstMessage, messageOf } from "@/domain/problem";
import { useRegister } from "@/features/auth/use-auth";
import AppAlert from "@/ui/AppAlert.vue";
import AppButton from "@/ui/AppButton.vue";
import AppField from "@/ui/AppField.vue";

const schema = toTypedSchema(
  z.object({
    name: z.string().min(1, "Informe o nome"),
    email: z.string().min(1, "Informe o e-mail").email("Formato de e-mail inválido"),
    password: z.string().min(12, "A senha precisa de ao menos 12 caracteres"),
  }),
);

const { handleSubmit, errors, defineField } = useForm({ validationSchema: schema });
const [name] = defineField("name");
const [email] = defineField("email");
const [password] = defineField("password");

const registerUser = useRegister();
const router = useRouter();
const serverErrors = computed(() => fieldErrorsOf(registerUser.error.value));
const hasGeneralError = computed(
  () => registerUser.isError.value && Object.keys(serverErrors.value).length === 0,
);

const onSubmit = handleSubmit((values) => {
  registerUser.mutate(values, { onSuccess: () => void router.push("/login") });
});
</script>

<template>
  <section class="mx-auto max-w-sm">
    <h1 class="mb-6 text-2xl font-semibold">Criar conta</h1>

    <form novalidate class="flex flex-col gap-4" @submit="onSubmit">
      <AppField
        v-model="name"
        label="Nome"
        :error="firstMessage(errors.name, serverErrors['name'])"
      />
      <AppField
        v-model="email"
        label="E-mail"
        type="email"
        :error="firstMessage(errors.email, serverErrors['email'])"
      />
      <AppField
        v-model="password"
        label="Senha"
        type="password"
        autocomplete="new-password"
        :error="firstMessage(errors.password, serverErrors['password'])"
      />

      <AppAlert v-if="hasGeneralError" tone="error">{{
        messageOf(registerUser.error.value)
      }}</AppAlert>

      <AppButton type="submit" :loading="registerUser.isPending.value">Criar conta</AppButton>
    </form>

    <p class="mt-6 text-sm text-stone-600">
      Já tem conta? <RouterLink to="/login" class="underline">Entrar</RouterLink>
    </p>
  </section>
</template>
