from abc import ABC, abstractmethod
from datetime import datetime


class Clock(ABC):
    """O tempo, como dependência.

    Existe para que expiração de token seja testável sem esperar de verdade.
    """

    @abstractmethod
    def now(self) -> datetime:
        """Instante atual, sempre com fuso."""
