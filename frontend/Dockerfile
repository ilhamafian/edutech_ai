FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package.json and install deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

# Copy rest of the frontend code
COPY . .

# Expose frontend port
EXPOSE 3000

# Start Next.js dev server
CMD ["pnpm", "dev"]
