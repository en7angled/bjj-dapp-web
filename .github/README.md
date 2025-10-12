# GitHub Actions

This directory contains GitHub Actions workflows for automated CI/CD.

## Workflows

### Docker Build (`docker-build.yml`)

Automatically builds and publishes Docker images to Docker Hub when code is pushed to `main` or `develop` branches, then creates a pull request to update Kubernetes manifests.

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Image Tags:**
- `main-<short-sha>` - For main branch commits (e.g., `main-6e3fce0`)
- `develop-<short-sha>` - For develop branch commits (e.g., `develop-6e3fce0`)
- `latest` - For main branch (default branch)
- `pr-<pr-number>` - For pull requests

**Registry:** `docker.io/mariusgeorgescu/bjj-dapp-web`

**Kubernetes Integration:**
- Automatically updates `apps/bjj-dapp-web/dev/kustomization.yaml` in [mariusgeorgescu/apps-k8s-configs](https://github.com/mariusgeorgescu/apps-k8s-configs)
- Updates the `newTag` field with commit-based image tags
- Creates pull requests for image tag updates
- Only triggers on `main` and `develop` branch pushes

## Usage

Images are automatically built and published. To use a specific version:

```bash
# Latest main branch
docker pull mariusgeorgescu/bjj-dapp-web:latest

# Specific commit
docker pull mariusgeorgescu/bjj-dapp-web:main-6e3fce0

# Develop branch
docker pull mariusgeorgescu/bjj-dapp-web:develop-6e3fce0
```

## Configuration

The workflow uses placeholder values for API credentials during build. For production deployments, override these environment variables:

```bash
docker run -e API_USER=your-user -e API_PASS=your-pass mariusgeorgescu/bjj-dapp-web:latest
```

## Required GitHub Secrets

The workflow requires these secrets to be configured in the repository settings:

- `DOCKERHUB_USERNAME` - Your Docker Hub username
- `DOCKERHUB_TOKEN` - Your Docker Hub access token
- `K8S_REPO_TOKEN` - GitHub Personal Access Token with access to mariusgeorgescu/apps-k8s-configs

### Setting up K8S_REPO_TOKEN

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Create a new token with `repo` permissions
3. Add it as `K8S_REPO_TOKEN` secret in this repository
