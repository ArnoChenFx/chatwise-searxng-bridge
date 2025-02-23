# Use official Bun image as the base image
FROM oven/bun:latest

WORKDIR /app

# Copy package.json and server.ts
COPY package*.json ./
COPY server.ts ./

# Expose server port
EXPOSE 3000

# Run the server
CMD ["bun", "run", "server.ts"]