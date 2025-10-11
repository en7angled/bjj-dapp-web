# GitHub Actions

This directory contains GitHub Actions workflows for automated CI/CD.

## Workflows

### Docker Build (`docker-build.yml`)

Automatically builds and publishes Docker images to GitHub Container Registry (ghcr.io) when code is pushed to `main` or `develop` branches.

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Image Tags:**
- `main-<commit-sha>` - For main branch commits
- `develop-<commit-sha>` - For develop branch commits  
- `latest` - For main branch (default branch)
- `pr-<pr-number>` - For pull requests

**Registry:** `ghcr.io/<username>/bjj-dapp-web`

## Usage

Images are automatically built and published. To use a specific version:

```bash
# Latest main branch
docker pull ghcr.io/<username>/bjj-dapp-web:latest

# Specific commit
docker pull ghcr.io/<username>/bjj-dapp-web:main-abc1234

# Develop branch
docker pull ghcr.io/<username>/bjj-dapp-web:develop-xyz5678
```

## Configuration

The workflow uses placeholder values for API credentials during build. For production deployments, override these environment variables:

```bash
docker run -e API_USER=your-user -e API_PASS=your-pass ghcr.io/<username>/bjj-dapp-web:latest
```
