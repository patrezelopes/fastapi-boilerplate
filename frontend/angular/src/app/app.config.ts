import { provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from "@angular/core";
import type { ApplicationConfig } from "@angular/core";
import { provideRouter, withComponentInputBinding } from "@angular/router";
import { provideRepositories } from "../features/repositories";
import { routes } from "./routes";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    ...provideRepositories(),
  ],
};
