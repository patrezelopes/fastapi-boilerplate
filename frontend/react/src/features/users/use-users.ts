import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NewUser, UserPatch, UserQuery } from "@/data/users-repository";
import type { Page } from "@/domain/page";
import type { User } from "@/domain/user";
import { usersRepository } from "../container";

const USERS_KEY = "users";

export function useUsers(query: UserQuery) {
  return useQuery<Page<User>>({
    queryKey: [USERS_KEY, query],
    queryFn: () => usersRepository.list(query),
    // Sem isto, mudar de página pisca a lista inteira em estado de carregando.
    placeholderData: keepPreviousData,
  });
}

export function useUser(id: string) {
  return useQuery<User>({
    queryKey: [USERS_KEY, id],
    queryFn: () => usersRepository.get(id),
    enabled: Boolean(id),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewUser) => usersRepository.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [USERS_KEY] }),
  });
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: UserPatch) => usersRepository.update(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [USERS_KEY] }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersRepository.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [USERS_KEY] }),
  });
}
