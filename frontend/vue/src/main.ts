import { VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia } from "pinia";
import { createApp } from "vue";
import AppRoot from "./app/AppRoot.vue";
import { router } from "./app/router";
import "./styles.css";

createApp(AppRoot)
  .use(createPinia())
  .use(router)
  .use(VueQueryPlugin, {
    queryClientConfig: {
      defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
    },
  })
  .mount("#app");
