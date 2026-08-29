# Nomes

## Arquivos e diretórios

Diretórios e arquivos em `snake_case` ou `kebab-case`, conforme o idioma da linguagem.
Um conceito por arquivo, e o arquivo tem o nome do conceito.

```
use_cases/create_user.<ext>          ✓
use_cases/user_service.<ext>         ✗  "service" não diz nada
use_cases/utils.<ext>                ✗  depósito de sobras
```

## Use cases

Verbo no imperativo + substantivo. Um use case faz **uma** coisa.

```
CreateUser   AuthenticateUser   ListUsers   RotateRefreshToken     ✓
UserManager  UserHelper         DoUserStuff                        ✗
```

O método público chama-se `execute`. Se um use case precisa de dois métodos públicos, são
dois use cases.

## Ports e adapters

O port tem o nome do papel; o adapter, o nome da tecnologia + o papel.

```
port     UserRepository
adapter  SqlUserRepository · InMemoryUserRepository · FakeUserRepository
```

## Entities

Substantivo singular, sem sufixo. `User`, não `UserEntity` nem `UserModel`.
O model do ORM, esse sim, mora em `repositories/models/` e pode carregar o sufixo.

## DTOs

Sufixo pelo papel no transporte:

```
UserCreate · UserUpdate · UserResponse · TokenResponse · LoginRequest
```

## Booleanos

Prefixo que force a leitura como pergunta: `is_active`, `has_expired`, `can_edit`.
Nunca negativos: `is_disabled` obriga a raciocinar em dupla negação.

## Proibidos em qualquer lugar

`data`, `info`, `obj`, `item` solto, `temp`, `aux`, `manager`, `helper`, `utils`,
`common`, `misc`, `process()`, `handle()` sem complemento.

Se o melhor nome que aparece é `helper`, a função não tem uma responsabilidade clara.

## Idioma

Código, nomes e identificadores em **inglês**. Comentários, docstrings, mensagens de
commit e documentação em **português**. Mensagens de erro voltadas ao usuário final, em
português; `title` do envelope RFC 9457, em inglês, porque é chave estável de máquina.
