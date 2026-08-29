FROM node:24-alpine

ENV PNPM_HOME=/pnpm \
    PATH="/pnpm:$PATH" \
    CI=true

RUN corepack enable

# O dono de /app precisa ser o usuário que roda o dev server: ele escreve
# arquivos temporários ali (o Vite compila o próprio config antes de subir).
WORKDIR /app
RUN chown -R node:node /app
USER node

COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY --chown=node:node . .

# O dev server faz proxy de /api para o backend, de modo que a SPA e a API
# compartilhem a origem — é o que permite ao cookie httpOnly de refresh existir.
ENV VITE_API_TARGET=http://api:8000

EXPOSE 5173

CMD ["pnpm", "run", "dev"]
