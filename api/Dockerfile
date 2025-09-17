FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY api/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY api/server.js ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S api -u 1001

USER api

EXPOSE 3001

CMD ["node", "server.js"]
