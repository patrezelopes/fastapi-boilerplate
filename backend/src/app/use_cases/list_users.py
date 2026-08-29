from app.entities.user import User
from app.use_cases.page import Page
from app.use_cases.ports.user_repository import UserRepository


class ListUsersUseCase:
    """Lista usuários, paginado e com busca parcial opcional.

    Pedir uma página além do fim devolve lista vazia, não erro: o cliente que
    pagina não deve precisar saber o total de antemão.
    """

    def __init__(self, user_repository: UserRepository) -> None:
        self._users = user_repository

    def execute(self, *, term: str | None = None, page: int = 1, per_page: int = 20) -> Page[User]:
        items, total = self._users.search(
            term=_clean(term),
            offset=(page - 1) * per_page,
            limit=per_page,
        )
        return Page(items=items, page=page, per_page=per_page, total=total)


def _clean(term: str | None) -> str | None:
    if term is None:
        return None
    stripped = term.strip()
    return stripped or None
