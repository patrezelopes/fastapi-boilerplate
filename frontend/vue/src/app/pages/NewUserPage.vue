<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { computed } from "vue";
import { useRouter } from "vue-router";
import { z } from "zod";
import { fieldErrorsOf, firstMessage, messageOf } from "@/domain/problem";
import { useCreateUser } from "@/features/users/use-users";
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

const createUser = useCreateUser();
const router = useRouter();
const serverErrors = computed(() => fieldErrorsOf(createUser.error.value));
const hasGeneralError = computed(
  () => createUser.isError.value && Object.keys(serverErrors.value).length === 0,
);

const onSubmit = handleSubmit((values) => {
  createUser.mutate(values, { onSuccess: () => void router.push("/users") });
});
</script>

<template>
  <section class="max-w-sm">
    <h1 class="mb-6 text-2xl font-semibold">Novo usuário</h1>

    <form novalidate class="flex flex-col gap-4" @submit="onSubmit">
      <AppField v-model="name" label="Nome" :error="firstMessage(errors.name, serverErrors['name'])" />
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

      <AppAlert v-if="hasGeneralError" tone="error">{{ messageOf(createUser.error.value) }}</AppAlert>

      <div class="flex gap-3">
        <AppButton type="submit" :loading="createUser.isPending.value">Salvar</AppButton>
        <AppButton type="button" variant="ghost" @click="router.push('/users')">Voltar</AppButton>
      </div>
    </form>
  </section>
</template>
