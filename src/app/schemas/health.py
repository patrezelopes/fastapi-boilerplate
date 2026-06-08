from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    alive: bool
    ready: bool
