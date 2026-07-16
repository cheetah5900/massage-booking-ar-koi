# Stage 1: Build the React client app
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Run the production server
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY --from=builder /app/dist ./dist
COPY server.js ./
# Copy data directory (containing the initial database seed)
COPY data ./data

EXPOSE 5001

ENV NODE_ENV=production
ENV PORT=5001

CMD ["node", "server.js"]
