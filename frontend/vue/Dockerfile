FROM node:24-alpine

WORKDIR /app

ENV PNPM_HOME=/pnpm \
    PATH="/pnpm:$PATH" \
    CI=true
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# O dev server faz proxy de /api para o backend, de modo que a SPA e a API
# compartilhem a origem — é o que permite ao cookie httpOnly de refresh existir.
ENV VITE_API_TARGET=http://api:8000

EXPOSE 5173

USER node

CMD ["pnpm", "run", "dev"]
