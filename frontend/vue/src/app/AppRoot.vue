<script setup lang="ts">
import { useRouter } from "vue-router";
import { useIsAuthenticated, useLogout } from "@/features/auth/use-auth";
import AppButton from "@/ui/AppButton.vue";

const authenticated = useIsAuthenticated();
const logout = useLogout();
const router = useRouter();

async function sair(): Promise<void> {
  await logout();
  await router.push("/login");
}
</script>

<template>
  <div class="min-h-screen bg-stone-50 text-stone-900">
    <header class="border-b border-stone-200 bg-white">
      <nav class="mx-auto flex max-w-4xl items-center gap-6 px-6 py-4 text-sm">
        <RouterLink to="/users" class="font-semibold">Boilerplate</RouterLink>
        <template v-if="authenticated">
          <RouterLink to="/users">Usuários</RouterLink>
          <RouterLink to="/me">Meu perfil</RouterLink>
        </template>
        <RouterLink to="/health">Situação</RouterLink>
        <span class="flex-1" />
        <AppButton v-if="authenticated" variant="ghost" @click="sair">Sair</AppButton>
        <RouterLink v-else to="/login">Entrar</RouterLink>
      </nav>
    </header>
    <main class="mx-auto max-w-4xl px-6 py-10">
      <RouterView />
    </main>
  </div>
</template>
