# Dockerfile for building Ditossauro Electron app on Northflank
# Multi-stage build for optimized image size
#
# Cross-Platform Build Support:
# - Linux: Native builds for .deb and .rpm packages
# - Windows: Cross-compilation using Wine for .exe installers
#
# This Dockerfile installs Wine to enable building Windows executables
# from a Linux environment, eliminating the need for separate Windows CI runners

# Build stage
FROM node:20-bullseye AS builder

# Enable i386 architecture for Wine (32-bit support)
RUN dpkg --add-architecture i386

# Install system dependencies required for building native modules and installers
# Including Wine for Windows cross-compilation
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    gcc \
    build-essential \
    rpm \
    fakeroot \
    dpkg-dev \
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
    wine \
    wine32 \
    wine64 \
    mono-devel \
    && rm -rf /var/lib/apt/lists/*

# Configure Wine environment for cross-compilation
ENV WINEARCH=win64
ENV WINEPREFIX=/root/.wine
ENV WINEDEBUG=-all

# Initialize Wine (required for first-time setup)
RUN wine64 wineboot --init && \
    wineserver -w

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

# Build the application with installers for multiple platforms
# Linux packages: .deb, .rpm
# Windows packages: .exe (via Wine cross-compilation)
# Run builds separately for each platform since --platform accepts only one value at a time
RUN npx electron-forge make --platform=linux && \
    npx electron-forge make --platform=win32

# Optional: Publish to GitHub Releases
# This step runs if GITHUB_TOKEN is provided as a build argument
# Set GITHUB_TOKEN in NorthFlank environment variables to enable automatic releases
ARG GITHUB_TOKEN
ARG RELEASE_TAG
ARG RELEASE_DRAFT=false
ARG RELEASE_PRERELEASE=false
RUN if [ -n "$GITHUB_TOKEN" ]; then \
    echo "📦 Publishing release to GitHub..."; \
    GITHUB_TOKEN=$GITHUB_TOKEN \
    RELEASE_TAG=$RELEASE_TAG \
    RELEASE_DRAFT=$RELEASE_DRAFT \
    RELEASE_PRERELEASE=$RELEASE_PRERELEASE \
    node scripts/publish-release.js; \
    else \
    echo "ℹ️  Skipping GitHub release (GITHUB_TOKEN not set)"; \
    fi

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
COPY --from=builder /app/scripts ./scripts

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