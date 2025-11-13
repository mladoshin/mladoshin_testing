# Integration Test Runner Dockerfile
# This container runs HTTP-based integration tests against backend API

FROM node:20-alpine

WORKDIR /app

# Install basic dependencies and Java (for Allure)
RUN apk add --no-cache bash curl openjdk11-jre

# Install Allure commandline
RUN wget https://github.com/allure-framework/allure2/releases/download/2.24.0/allure-2.24.0.tgz && \
    tar -zxvf allure-2.24.0.tgz -C /opt/ && \
    ln -s /opt/allure-2.24.0/bin/allure /usr/bin/allure && \
    rm allure-2.24.0.tgz

# Copy package files first for better layer caching
COPY tests/integration_runner/package.json tests/integration_runner/package-lock.json* ./

# Install dependencies
RUN npm ci --only=production=false

# Copy TypeScript configuration
COPY tests/integration_runner/tsconfig.json ./

# Copy Jest configuration
COPY tests/integration_runner/jest.config.ts ./

# Copy test helpers from backend root
COPY tests/helpers/ ./tests/helpers/

# Copy all source files including integration tests
# Pattern: /apps/backend/src/modules/**/tests/**/integration/*.spec.ts
# These tests use HTTP client to call real backend endpoints
COPY src/ ./src/

# Create directories for Allure reports
RUN mkdir -p allure-results allure-report

# Environment variables for test execution
ENV NODE_ENV=test
ENV TEST_API_URL=http://backend:3000
ENV IS_OFFLINE=false

# Set Jest timeout for integration tests
ENV JEST_TIMEOUT=30000

# Health check - verify we can reach the backend
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f ${TEST_API_URL}/health || exit 1

# Volume for Allure reports (mount this to access reports from host)
VOLUME ["/app/allure-results", "/app/allure-report"]

# Run integration tests
# Pattern matches: src/modules/**/tests/**/integration/*.spec.ts
CMD ["npm", "run", "test:integration"]
