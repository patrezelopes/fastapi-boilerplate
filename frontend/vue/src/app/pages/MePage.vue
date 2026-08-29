<script setup lang="ts">
import { messageOf } from "@/domain/problem";
import { initialsOf } from "@/domain/user";
import { useCurrentUser } from "@/features/auth/use-auth";
import AppFailed from "@/ui/AppFailed.vue";
import AppLoading from "@/ui/AppLoading.vue";

const me = useCurrentUser();
</script>

<template>
  <AppLoading v-if="me.isPending.value" />
  <AppFailed
    v-else-if="me.isError.value"
    :message="messageOf(me.error.value)"
    retryable
    @retry="me.refetch()"
  />

  <section v-else-if="me.data.value">
    <h1 class="mb-6 text-2xl font-semibold">Meu perfil</h1>
    <div class="flex items-center gap-4 rounded border border-stone-200 bg-white p-6">
      <span
        aria-hidden="true"
        class="grid size-12 place-items-center rounded-full bg-stone-200 text-lg font-semibold text-stone-600"
      >
        {{ initialsOf(me.data.value) }}
      </span>
      <dl class="text-sm">
        <dt class="sr-only">Nome</dt>
        <dd class="font-medium">{{ me.data.value.name }}</dd>
        <dt class="sr-only">E-mail</dt>
        <dd class="text-stone-600">{{ me.data.value.email }}</dd>
      </dl>
    </div>
  </section>
</template>
