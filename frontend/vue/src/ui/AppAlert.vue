<script setup lang="ts">
withDefaults(defineProps<{ tone?: "error" | "info" | "success" }>(), { tone: "info" });

const TONES = {
  error: "border-red-300 bg-red-50 text-red-800",
  info: "border-stone-300 bg-stone-50 text-stone-700",
  success: "border-emerald-300 bg-emerald-50 text-emerald-800",
} as const;
</script>

<template>
  <div
    :role="tone === 'error' ? 'alert' : 'status'"
    :class="`rounded border px-4 py-3 text-sm ${TONES[tone]}`"
  >
    <slot />
  </div>
</template>
