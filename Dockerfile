#https://therahulsarkar.medium.com/containerize-your-next-js-14-application-with-docker-a-step-by-step-guide-93a6133fe073

# Use Node 20 which is supported on Azure Web Apps
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./

# Install production dependencies
RUN npm ci

FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000

CMD ["npm", "start"]
