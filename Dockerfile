# Dockerfile for building Ditossauro Electron app on Northflank
# Multi-stage build for optimized image size

# Build stage
FROM node:20-bullseye AS builder

# Install system dependencies required for building native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    gcc \
    build-essential \
    libx11-dev \
    libxtst-dev \
    libxkbfile-dev \
    libpng-dev \
    libjpeg-dev \
    libxi-dev \
    libxrandr-dev \
    libxinerama-dev \
    libxcursor-dev \
    libxcomposite-dev \
    libxdamage-dev \
    libxfixes-dev \
    libcairo2-dev \
    libpango1.0-dev \
    libglib2.0-dev \
    libgtk-3-dev \
    libasound2-dev \
    libxss-dev \
    libnss3-dev \
    libgconf-2-4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    libgbm-dev \
    libdrm-dev \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libu2f-udev \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# Using npm ci for reproducible builds
RUN npm ci --legacy-peer-deps

# Copy application source
COPY . .

# Rebuild native modules for the current platform
RUN npm run postinstall

# Package the application (without creating installers)
# Using 'package' instead of 'build' to avoid needing platform-specific tools like rpmbuild
RUN npm run package

# Runtime stage (optional - for serving/running the built app)
FROM node:20-bullseye-slim AS runtime

# Install minimal runtime dependencies
RUN apt-get update && apt-get install -y \
    libx11-6 \
    libxtst6 \
    libxkbfile1 \
    libpng16-16 \
    libxi6 \
    libxrandr2 \
    libxinerama1 \
    libxcursor1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libcairo2 \
    libpango-1.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libasound2 \
    libxss1 \
    libnss3 \
    libgconf-2-4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libgdk-pixbuf2.0-0 \
    libgbm1 \
    libdrm2 \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/out ./out
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Set environment variables
ENV NODE_ENV=production
ENV ELECTRON_DISABLE_SANDBOX=1

# Expose port if needed (for debugging or web interface)
EXPOSE 3000

# Health check (optional)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "process.exit(0)" || exit 1

# Default command - adjust based on your deployment needs
# For Northflank, you might want to serve the built artifacts or run a custom script
CMD ["node", "-v"]

# Build artifacts note:
# The built Electron application will be in /app/out directory
# You can copy these artifacts to a separate location or serve them as needed
