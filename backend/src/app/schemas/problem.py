from pydantic import BaseModel


class FieldError(BaseModel):
    field: str
    message: str


class Problem(BaseModel):
    """Envelope de erro da RFC 9457. Ver `.claude/rules/errors.md`."""

    type: str
    title: str
    status: int
    detail: str | None = None


class ValidationProblem(Problem):
    errors: list[FieldError]
