<script setup lang="ts">
defineProps<{ page: number; totalPages: number }>();
defineEmits<{ change: [page: number] }>();
</script>

<template>
  <nav
    v-if="totalPages > 1"
    aria-label="Paginação"
    class="flex items-center justify-between gap-4 text-sm"
  >
    <button
      :disabled="page <= 1"
      class="rounded border border-stone-300 px-3 py-1 disabled:text-stone-400"
      @click="$emit('change', page - 1)"
    >
      Anterior
    </button>
    <span class="text-stone-600">Página {{ page }} de {{ totalPages }}</span>
    <button
      :disabled="page >= totalPages"
      class="rounded border border-stone-300 px-3 py-1 disabled:text-stone-400"
      @click="$emit('change', page + 1)"
    >
      Próxima
    </button>
  </nav>
</template>
