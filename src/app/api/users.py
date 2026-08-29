from uuid import UUID

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, Query, Response, status

from app.api.dependencies import current_user
from app.api.errors import CONFLICT, NOT_FOUND, UNAUTHORIZED, UNPROCESSABLE
from app.entities.user import User
from app.schemas.user import PageMeta, UserCreate, UserPage, UserResponse, UserUpdate
from app.use_cases.create_user import CreateUserUseCase
from app.use_cases.delete_user import DeleteUserUseCase
from app.use_cases.get_user import GetUserUseCase
from app.use_cases.list_users import ListUsersUseCase
from app.use_cases.page import Page
from app.use_cases.update_user import UpdateUserUseCase

UsersRouter = APIRouter(
    prefix="/users",
    tags=["users"],
    dependencies=[Depends(current_user)],
    responses={**UNAUTHORIZED, **UNPROCESSABLE},
)


@UsersRouter.get("", response_model=UserPage)
@inject
def list_users(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    q: str | None = Query(default=None, max_length=120),
    use_case: ListUsersUseCase = Depends(Provide["list_users_uc"]),
) -> UserPage:
    return _to_page(use_case.execute(term=q, page=page, per_page=per_page))


@UsersRouter.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    responses=CONFLICT,
)
@inject
def create_user(
    payload: UserCreate,
    use_case: CreateUserUseCase = Depends(Provide["create_user_uc"]),
) -> User:
    return use_case.execute(email=str(payload.email), name=payload.name, password=payload.password)


@UsersRouter.get("/{user_id}", response_model=UserResponse, responses=NOT_FOUND)
@inject
def get_user(
    user_id: UUID,
    use_case: GetUserUseCase = Depends(Provide["get_user_uc"]),
) -> User:
    return use_case.execute(user_id=user_id)


@UsersRouter.patch("/{user_id}", response_model=UserResponse, responses={**NOT_FOUND, **CONFLICT})
@inject
def update_user(
    user_id: UUID,
    payload: UserUpdate,
    use_case: UpdateUserUseCase = Depends(Provide["update_user_uc"]),
) -> User:
    return use_case.execute(
        user_id=user_id,
        email=str(payload.email) if payload.email is not None else None,
        name=payload.name,
    )


@UsersRouter.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT, responses=NOT_FOUND)
@inject
def delete_user(
    user_id: UUID,
    use_case: DeleteUserUseCase = Depends(Provide["delete_user_uc"]),
) -> Response:
    use_case.execute(user_id=user_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _to_page(page: Page[User]) -> UserPage:
    return UserPage(
        items=[UserResponse.model_validate(user, from_attributes=True) for user in page.items],
        meta=PageMeta(
            page=page.page,
            per_page=page.per_page,
            total=page.total,
            total_pages=page.total_pages,
        ),
    )
