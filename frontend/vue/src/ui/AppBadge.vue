<script setup lang="ts">
defineProps<{ ok: boolean }>();
</script>

<template>
  <span
    :class="`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium ${
      ok ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
    }`"
  >
    <span
      :class="`size-1.5 rounded-full ${ok ? 'bg-emerald-600' : 'bg-red-600'}`"
      aria-hidden="true"
    />
    <slot />
  </span>
</template>
