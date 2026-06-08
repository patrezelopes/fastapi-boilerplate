from dataclasses import dataclass


@dataclass(frozen=True)
class HealthStatus:
    alive: bool
    ready: bool
