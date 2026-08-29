import type { Page } from "@/domain/page";
import type { User } from "@/domain/user";
import type { components } from "./api/schema";

/**
 * Traduz o que a API devolve para o tipo do domínio — inclusive o nome dos
 * campos. O contrato fala snake_case; o domínio, camelCase. Sem esta tradução,
 * a convenção do backend vazaria para dentro dos componentes.
 */
export function toUser(payload: components["schemas"]["User"]): User {
  return {
    id: payload.id,
    email: payload.email,
    name: payload.name,
    createdAt: payload.created_at,
    updatedAt: payload.updated_at,
  };
}

export function toUserPage(payload: components["schemas"]["UserPage"]): Page<User> {
  return {
    items: payload.items.map(toUser),
    page: payload.meta.page,
    perPage: payload.meta.per_page,
    total: payload.meta.total,
    totalPages: payload.meta.total_pages,
  };
}
