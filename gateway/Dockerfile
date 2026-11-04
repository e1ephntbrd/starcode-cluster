FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json tsconfig.json ./
RUN npm install

COPY src ./src
COPY proto ./proto
RUN npm run build

FROM node:20-alpine
WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/proto ./proto

EXPOSE 8080

CMD ["node", "dist/index.js"]
