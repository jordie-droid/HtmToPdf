FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev \
    && npx playwright install --with-deps chromium \
    && rm -rf /var/lib/apt/lists/*

COPY . .

RUN mkdir -p tmp output

EXPOSE 10000

ENV PORT=10000

CMD ["npm", "start"]
