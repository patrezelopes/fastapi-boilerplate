<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { z } from "zod";
import { fieldErrorsOf, firstMessage, isNotFound, messageOf } from "@/domain/problem";
import { useUpdateUser, useUser } from "@/features/users/use-users";
import AppAlert from "@/ui/AppAlert.vue";
import AppButton from "@/ui/AppButton.vue";
import AppField from "@/ui/AppField.vue";
import AppFailed from "@/ui/AppFailed.vue";
import AppLoading from "@/ui/AppLoading.vue";

const route = useRoute();
const router = useRouter();
const id = computed(() => String(route.params["id"] ?? ""));

const user = useUser(id);
const update = useUpdateUser(id);

const schema = toTypedSchema(
  z.object({
    name: z.string().min(1, "Informe o nome"),
    email: z.string().min(1, "Informe o e-mail").email("Formato de e-mail inválido"),
  }),
);

const { handleSubmit, errors, defineField, setValues } = useForm({ validationSchema: schema });
const [name] = defineField("name");
const [email] = defineField("email");

watch(
  () => user.data.value,
  (loaded) => {
    if (loaded) setValues({ name: loaded.name, email: loaded.email });
  },
  { immediate: true },
);

const serverErrors = computed(() => fieldErrorsOf(update.error.value));
const hasGeneralError = computed(
  () => update.isError.value && Object.keys(serverErrors.value).length === 0,
);
const notFound = computed(() => isNotFound(user.error.value));

const onSubmit = handleSubmit((values) => {
  update.mutate(values);
});
</script>

<template>
  <AppLoading v-if="user.isPending.value" />
  <AppFailed v-else-if="notFound" message="Usuário não encontrado." />
  <AppFailed
    v-else-if="user.isError.value"
    :message="messageOf(user.error.value)"
    retryable
    @retry="user.refetch()"
  />

  <section v-else class="max-w-sm">
    <h1 class="mb-6 text-2xl font-semibold">Editar usuário</h1>

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

      <AppAlert v-if="update.isSuccess.value" tone="success">Alterações salvas.</AppAlert>
      <AppAlert v-if="hasGeneralError" tone="error">{{ messageOf(update.error.value) }}</AppAlert>

      <div class="flex gap-3">
        <AppButton type="submit" :loading="update.isPending.value">Salvar</AppButton>
        <AppButton type="button" variant="ghost" @click="router.push('/users')">Voltar</AppButton>
      </div>
    </form>
  </section>
</template>
