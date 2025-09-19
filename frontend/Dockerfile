FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy only package files first (better caching)
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Expose Next.js dev port
EXPOSE 3000

# Ensure file change detection works in Docker (esp. on Windows/WSL)
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true 

# Start Next.js in dev mode
CMD ["pnpm", "dev"]