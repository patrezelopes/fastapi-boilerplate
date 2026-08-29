from dataclasses import dataclass


@dataclass(frozen=True)
class Page[T]:
    """Uma fatia de resultados e o total que casa com a consulta."""

    items: list[T]
    page: int
    per_page: int
    total: int

    @property
    def total_pages(self) -> int:
        if self.per_page <= 0:
            return 0
        return -(-self.total // self.per_page)
