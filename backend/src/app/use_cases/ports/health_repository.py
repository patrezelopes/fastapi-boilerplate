from abc import ABC, abstractmethod


class HealthRepository(ABC):
    @abstractmethod
    def is_alive(self) -> bool:
        """Verifica se a aplicação está viva."""

    @abstractmethod
    def is_ready(self) -> bool:
        """Verifica se a aplicação está pronta para receber tráfego."""
