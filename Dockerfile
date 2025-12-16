# Dockerfile for Craft Local Edge Functions (Coolify Deployment)
# Place at repository root for Coolify compatibility

FROM denoland/deno:1.40.0

# Set working directory
WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create Deno cache directory with proper permissions
RUN mkdir -p /app/.deno_cache && chown deno:deno /app/.deno_cache

# Set Deno cache directory
ENV DENO_DIR=/app/.deno_cache

# Copy functions from supabase directory
COPY --chown=deno:deno supabase/functions ./functions

# Copy server script from root
COPY --chown=deno:deno server.ts .

# Switch to non-root user for security
USER deno

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
  CMD curl --fail http://localhost:8000/_health || exit 1

# Start server with necessary permissions
CMD ["deno", "run", \
  "--allow-net", \
  "--allow-read", \
  "--allow-env", \
  "--unstable", \
  "server.ts"]
