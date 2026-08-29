<script setup lang="ts">
import { useId } from "vue";

defineProps<{ label: string; error?: string | undefined }>();
const model = defineModel<string>({ default: "" });

const id = useId();
const errorId = `${id}-error`;
</script>

<template>
  <!-- Rótulo associado e erro anunciado — ver `.claude/rules/frontend.md`. -->
  <div class="flex flex-col gap-1">
    <label :for="id" class="text-sm font-medium text-stone-700">{{ label }}</label>
    <input
      :id="id"
      v-model="model"
      v-bind="$attrs"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="error ? errorId : undefined"
      :class="`rounded border px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-stone-800 ${
        error ? 'border-red-400 bg-red-50' : 'border-stone-300'
      }`"
    />
    <p v-if="error" :id="errorId" role="alert" class="text-sm text-red-700">{{ error }}</p>
  </div>
</template>
