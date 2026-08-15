FROM node:22-alpine AS deps

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY . .

ARG NEXT_PUBLIC_SOJ_API_MODE=http
ARG NEXT_PUBLIC_SOJ_API_BASE_URL=/soj-api
ARG SOJ_API_INTERNAL_BASE_URL=http://api:8080
ENV NEXT_PUBLIC_SOJ_API_MODE=$NEXT_PUBLIC_SOJ_API_MODE
ENV NEXT_PUBLIC_SOJ_API_BASE_URL=$NEXT_PUBLIC_SOJ_API_BASE_URL
ENV SOJ_API_INTERNAL_BASE_URL=$SOJ_API_INTERNAL_BASE_URL

RUN npm run build
RUN mkdir -p /out \
    && cp -r .next/standalone/. /out/ \
    && mkdir -p /out/.next/static \
    && cp -r .next/static/. /out/.next/static/ \
    && if [ -d public ]; then mkdir -p /out/public && cp -r public/. /out/public/; fi

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV SOJ_API_INTERNAL_BASE_URL=http://api:8080

RUN addgroup -S nextjs && adduser -S nextjs -G nextjs
COPY --from=builder --chown=nextjs:nextjs /out ./

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 CMD node -e "fetch('http://127.0.0.1:3000/').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "server.js"]
