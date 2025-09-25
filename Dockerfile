# Simple, reliable Next.js build + run (single-stage)
FROM node:20-alpine

WORKDIR /app
RUN apk add --no-cache libc6-compat \
  && npm -v && node -v

# Install deps
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Run in production
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "start"]
