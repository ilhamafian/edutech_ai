FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

# Copy source code
COPY . .

# Build the app
RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "dev"]