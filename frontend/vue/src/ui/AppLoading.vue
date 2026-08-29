<script setup lang="ts">
withDefaults(defineProps<{ label?: string }>(), { label: "Carregando…" });
</script>

<template>
  <p role="status" class="py-10 text-center text-sm text-stone-500">{{ label }}</p>
</template>
