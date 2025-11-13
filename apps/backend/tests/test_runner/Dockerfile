# Test Runner Dockerfile
# This container runs unit, integration, and e2e tests

FROM node:20-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /workspace

# Install basic dependencies and Java (for Allure)
RUN apk add --no-cache bash curl openjdk11-jre

# Install Allure commandline
RUN wget https://github.com/allure-framework/allure2/releases/download/2.24.0/allure-2.24.0.tgz && \
    tar -zxvf allure-2.24.0.tgz -C /opt/ && \
    ln -s /opt/allure-2.24.0/bin/allure /usr/bin/allure && \
    rm allure-2.24.0.tgz

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages ./packages

# Install all dependencies (including dev dependencies for testing)
RUN pnpm install --frozen-lockfile --filter backend...

# Copy backend source code and test files
COPY apps/backend/tsconfig.json apps/backend/tsconfig.build.json apps/backend/nest-cli.json ./apps/backend/
COPY apps/backend/tests/test_runner/configs/ ./apps/backend/configs/
COPY apps/backend/tests/helpers/ ./apps/backend/tests/helpers/
COPY apps/backend/src/ ./apps/backend/src/

WORKDIR /workspace/apps/backend

# Create directories for Allure reports with wide permissions
RUN mkdir -p allure-results allure-report && \
    chmod -R 777 allure-results allure-report

# Environment variables for test execution
ENV NODE_ENV=test
ENV TEST_API_URL=http://backend-test:3000
ENV IS_OFFLINE=false

# Set Jest timeout
ENV JEST_TIMEOUT=60000

# Volume for Allure reports (mount this to access reports from host)
VOLUME ["/workspace/apps/backend/allure-results", "/workspace/apps/backend/allure-report"]

# Default command - keep container running
CMD ["tail", "-f", "/dev/null"]

