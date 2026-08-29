<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { isEmpty } from "@/domain/page";
import { messageOf } from "@/domain/problem";
import type { User } from "@/domain/user";
import { useDeleteUser, useUsers } from "@/features/users/use-users";
import AppButton from "@/ui/AppButton.vue";
import AppEmpty from "@/ui/AppEmpty.vue";
import AppFailed from "@/ui/AppFailed.vue";
import AppField from "@/ui/AppField.vue";
import AppLoading from "@/ui/AppLoading.vue";
import AppPagination from "@/ui/AppPagination.vue";
import UserTable from "@/ui/UserTable.vue";

const page = ref(1);
const term = ref("");
const router = useRouter();

const users = useUsers(() => ({ page: page.value, perPage: 10, term: term.value || undefined }));
const removeUser = useDeleteUser();

const vazio = computed(() => (users.data.value ? isEmpty(users.data.value) : false));

function buscar(): void {
  page.value = 1;
}

function abrir(user: User): void {
  void router.push(`/users/${user.id}`);
}
</script>

<template>
  <section>
    <div class="mb-6 flex items-end justify-between gap-4">
      <h1 class="text-2xl font-semibold">Usuários</h1>
      <AppButton @click="router.push('/users/new')">Novo usuário</AppButton>
    </div>

    <div class="mb-6 max-w-sm">
      <AppField v-model="term" label="Buscar" placeholder="nome ou e-mail" @input="buscar" />
    </div>

    <AppLoading v-if="users.isPending.value" />
    <AppFailed
      v-else-if="users.isError.value"
      :message="messageOf(users.error.value)"
      retryable
      @retry="users.refetch()"
    />
    <AppEmpty v-else-if="vazio">Nenhum usuário encontrado.</AppEmpty>

    <div v-else-if="users.data.value" class="flex flex-col gap-6">
      <UserTable
        :users="users.data.value.items"
        @open="abrir"
        @remove="(user: User) => removeUser.mutate(user.id)"
      />
      <AppPagination
        :page="users.data.value.page"
        :total-pages="users.data.value.totalPages"
        @change="(next: number) => (page = next)"
      />
    </div>
  </section>
</template>
