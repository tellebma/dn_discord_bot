# Multi-stage build for TypeScript
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and TypeScript config
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies)
RUN npm install

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Production stage  
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user and set permissions
RUN addgroup -g 1001 -S nodejs && \
    adduser -S botuser -u 1001 && \
    chown -R botuser:nodejs /app

USER botuser

EXPOSE 3000

CMD ["npm", "run", "start:deploy"]