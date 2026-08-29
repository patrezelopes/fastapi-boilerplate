<script setup lang="ts">
// `retryable` explícito em vez de espiar `$attrs`: um componente de apresentação
// não deveria adivinhar se alguém está ouvindo seu evento.
withDefaults(defineProps<{ message: string; retryable?: boolean }>(), { retryable: false });
defineEmits<{ retry: [] }>();
</script>

<template>
  <div role="alert" class="rounded border border-red-300 bg-red-50 px-4 py-6 text-center">
    <p class="text-sm text-red-800">{{ message }}</p>
    <button
      v-if="retryable"
      class="mt-3 text-sm font-medium text-red-900 underline"
      @click="$emit('retry')"
    >
      Tentar de novo
    </button>
  </div>
</template>
