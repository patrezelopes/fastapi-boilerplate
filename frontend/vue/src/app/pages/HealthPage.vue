<script setup lang="ts">
import { useHealth } from "@/features/health/use-health";
import AppBadge from "@/ui/AppBadge.vue";
import AppLoading from "@/ui/AppLoading.vue";

const health = useHealth();
</script>

<template>
  <section>
    <h1 class="mb-6 text-2xl font-semibold">Situação do sistema</h1>

    <AppLoading v-if="health.isPending.value" />
    <dl v-else class="flex flex-col gap-3 rounded border border-stone-200 bg-white p-6 text-sm">
      <div class="flex items-center justify-between">
        <dt>Aplicação no ar</dt>
        <dd>
          <AppBadge :ok="health.data.value?.alive ?? false">
            {{ health.data.value?.alive ? "no ar" : "fora" }}
          </AppBadge>
        </dd>
      </div>
      <div class="flex items-center justify-between">
        <dt>Pronta para tráfego</dt>
        <dd>
          <AppBadge :ok="health.data.value?.ready ?? false">
            {{ health.data.value?.ready ? "pronta" : "indisponível" }}
          </AppBadge>
        </dd>
      </div>
    </dl>
  </section>
</template>
