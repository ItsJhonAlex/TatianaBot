# TatianaBot — producción con Bun
FROM oven/bun:1.3-alpine AS base
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY tsconfig.json ./
COPY src ./src
COPY drizzle.config.ts ./
COPY CHANGELOG.md ./

ENV NODE_ENV=production
ENV DATABASE_URL=file:./data/tatiana.sqlite

RUN mkdir -p data data/music-cache

VOLUME ["/app/data"]

CMD ["bun", "src/index.ts"]
