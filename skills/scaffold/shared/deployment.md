# Deployment, environments and PR previews

/architect chooses the deployment with the user from this document, and /scaffold sets up the deployment pipeline for the chosen option. Goals:

- Merged code deploys to staging automatically; a version tag deploys to production, and production deployments need manual approval.
- Every PR gets a temporary preview URL where the user can see the change, destroyed when the PR closes. /spike draft PRs use it for the user to verify too.
- Problems can be rolled back in one step: redeploy the previous version tag.

## Environments

| Environment | When it deploys | Purpose |
|---|---|---|
| Local | During development, `docker compose -f infra/docker-compose.yml up` | Development and debugging; multi-instance behavior is visible here too |
| PR preview | Automatically for every PR, destroyed when the PR closes | Seeing the effect of a change, verifying spikes |
| Staging | Automatically after merging into the integration branch: develop for Git Flow, main for GitHub Flow | Overall verification before release |
| Production | After pushing a version tag `v*`, with manual approval | For users |

Manual approval for production uses GitHub Environments: create an environment named `production` with the maintainers as Required reviewers, and set `environment: production` on the deployment job. Store the platform's token as a secret of that environment, so only approved jobs can read it. Private repositories on GitHub Free cannot set Required reviewers; there, trigger production deployments manually with `workflow_dispatch`.

## Choosing a platform

| Application type | Common platforms | PR previews | How to connect |
|---|---|---|---|
| Frontend only (static files after the build) | Vercel, Netlify, Cloudflare Pages, Azure Static Web Apps | Built in: every PR gets a URL, posted as a PR comment | Connect the GitHub repository on the platform's website and set the component directory, build command and output directory; no workflow needed |
| Containerized backend or full stack | Render, Railway, Fly.io, Google Cloud Run, Azure Container Apps, AWS App Runner | Built into Render and Railway; on other platforms a PR workflow deploys a temporary instance named after the PR number and deletes it when the PR closes | A workflow builds the image, pushes it to GitHub Container Registry (GHCR), then calls the platform's deploy command |
| Your own server | A cloud VM with docker compose | Usually no per-PR previews; staging takes their place | A workflow builds the image, pushes it to GHCR, then pulls the new image on the server over SSH and restarts |
| Kubernetes | A cloud provider's managed cluster | One namespace per PR | Rarely worth it for one maintainer, unless a cluster already exists |

Recommendation for one maintainer: a static hosting platform with built-in PR previews for the frontend; for the backend, a platform with container support, usage-based pricing and PR previews (e.g. Render, Railway), or a service like Cloud Run that costs nothing when scaled to zero. Use the platform's managed database and let it handle backups.

## Deployment pipeline

/scaffold writes `.github/workflows/deploy.yml` from `shared/deploy.yml`: it builds an image for each containerized component and deploys to staging or production depending on the trigger. Images are tagged with the commit SHA and the version, so a rollback redeploys the image of an older tag. Platforms with their own Git integration (e.g. static hosting) can do without this workflow; configure on the platform which branch deploys to which environment.

Schema changes deploy with the application: migration scripts run before the new version starts and must stay compatible with the old version's code (add the column, migrate the data, drop the old column, over several releases), so rolling back the application never requires rolling back the database.

## What the user does

The user registers and configures the platform accounts, payment methods and domains. /scaffold only generates the workflows and configuration files, and tells the user what to do on the platform and which tokens go into which GitHub environment.
