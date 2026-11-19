# Architect step: infrastructure tools, state storage and cloud CLIs

Reference list for the architect step. For every deployment target (staging, production) and every resource it needs (database, object storage, queue, hosting, cache, DNS, CDN and the rest), the agent asks the user whether to use an existing resource or create a new one, showing size, region and rough monthly cost. It also asks how infrastructure is built: (a) by running the provider's CLI commands directly, with the commands recorded in the project's architecture document, or (b) as infrastructure as code (IaC), with files in the repository applied by a tool. The scaffold step creates the resources after the user confirms the cost. An agent reads this file to propose options for both ways: the IaC tools and what they need, where IaC state is kept, the exact CLI commands per host for option (a), and how to show a price before anything is created. The agent proposes, the user chooses. The list is a starting point, not a configuration; the agent researches further when a host or resource is not covered here.

Research date: 2026-11-19.

Version numbers are deliberately left out because they go stale. Each tool names where its latest release is published, and the agent reads the version from there when it sets up the project.

## 0. How to read this file

### 0.1 Markers

- **[V]**: confirmed during this research on the project's or vendor's own page, docs or repository. For GitHub projects this includes the GitHub API on 2026-11-19 showing the repository not archived, with commits in recent weeks.
- **[S]**: confirmed only from a secondary source (blogs, vendor comparisons, search-result text).
- **[K]**: from prior knowledge, not re-checked this time. Verify before relying on it.
- **slow**: maintained but with thin activity or a last release more than a year old. Check again before proposing it.
- **`*`** before a tool name: the usual default for the situation named.
- **paid**: needs a paid plan for the feature named. **SA**: source-available licence (not OSI open source). Paid and SA items are listed so the user can choose them, never proposed as the default for a project that has not said it pays for tools.

A marker at the end of a row's Notes cell applies to the whole row; a marker right after one fact applies to that fact only.

### 0.2 Column key

- **Clouds**: what the tool can create.
- **Format**: what the files in the repository are written in.
- **State**: where the tool keeps its record of what it manages, and what must exist before the first run (section 3).
- **Preview**: the command that shows what will be created, changed or deleted without doing it. This is what the agent shows the user before applying.
- **Import**: how an existing resource is brought under the tool's management without recreating it (needed when the user picks "use an existing resource").
- **Published at**: where the newest release is. Shorthands: `gh:owner/repo` (GitHub releases), `npm:x`, `pypi:x`, `brew:x`, `service` (runs inside the cloud; nothing to install), `bundled` (ships with another CLI).

## 1. The two ways at a glance

| | (a) Direct CLI commands | (b) Infrastructure as code |
|---|---|---|
| What lives in the repository | The commands, in the architecture document, with the chosen sizes and regions | Configuration files, applied by a tool |
| Showing the user what will happen | The agent lists the commands and the price per resource | The tool's preview (`tofu plan`, `pulumi preview`, `what-if`, change set) plus a price estimate |
| Needs a state store | No | Yes for OpenTofu, Terraform and Pulumi; no for CloudFormation, CDK (one bootstrap stack), Bicep and Infra Manager (section 3) |
| Recreating staging like production | Re-run the recorded commands by hand with other names; easy to miss a flag | Apply the same files with other variables |
| Seeing later changes made in the console | Not detected | The next preview shows the drift |
| Removing everything | Delete each resource by hand | One destroy command |
| Extra tool to learn and install | None beyond the provider's CLI | The IaC tool, its language and its state |

## 2. IaC tools

### 2.1 Which tool fits which situation

| Situation | Usual default | Alternatives |
|---|---|---|
| Several clouds, or platform hosts (Vercel, Netlify, Cloudflare, Render, Neon and the rest) | `*` OpenTofu | Terraform (**SA**), Pulumi |
| AWS only | `*` OpenTofu | AWS CDK, CloudFormation, Pulumi, Terraform (**SA**) |
| Azure only | `*` Bicep with deployment stacks | OpenTofu, Pulumi |
| Google Cloud only | `*` OpenTofu | Infrastructure Manager (runs Terraform for you), Pulumi |
| Programming language instead of HCL wanted | `*` Pulumi | AWS CDK (AWS only) |
| The project already runs Kubernetes and wants cloud resources as Kubernetes objects | `*` Crossplane | AWS Controllers for Kubernetes, Azure Service Operator, Config Connector |
| Configuring servers or virtual machines after they exist | `*` Ansible | (not a provisioning tool; pair it with one of the above) |

The defaults above are the common choice in each situation; the user decides. [K]

### 2.2 Tools

| Tool | Clouds | Format | State | Preview | Import | Licence and paid parts | Published at | Notes |
|---|---|---|---|---|---|---|---|---|
| `*` OpenTofu | Any cloud or host that has a provider; uses the same provider protocol as Terraform, served from the OpenTofu registry [K] | HCL (`.tf`, also `.tofu`) [K] | A state file in a backend: `local`, `s3`, `azurerm`, `gcs`, `pg`, `http`, `kubernetes`, `consul`, `cos`, `oss`, `remote` [V]. Built-in encryption of state and plan files with a passphrase (PBKDF2), AWS KMS, GCP KMS, Azure Key Vault, OpenBao or an external program [V] | `tofu plan`; `tofu plan -out=plan.bin` then `tofu apply plan.bin` applies exactly what was shown [K] | `import` block with `id` or `identity`, `for_each` on import blocks; the import happens on apply after the plan is approved [V]. `-generate-config-out` writes resource blocks (marked experimental; not with `for_each`) [V] | MPL-2.0 [V]; no paid parts. Linux Foundation project [V], CNCF sandbox since April 2025 [S] | `gh:opentofu/opentofu` | Fork of Terraform made after the 2023 licence change [K]. Repository active, releases in November 2026 [V]. |
| Terraform | Same providers as OpenTofu | HCL (`.tf`) | A state file in a backend: `local`, `remote`, `azurerm`, `consul`, `cos`, `gcs`, `http`, `kubernetes`, `oci`, `oss`, `pg`, `s3` [V], or HCP Terraform through a `cloud` block [K] | `terraform plan` (`-out` as for OpenTofu) [K] | `import` block; `terraform plan -generate-config-out=<new file>` (experimental) [V] | **SA**: BUSL-1.1 from 1.6.0 on, licensor IBM [V]; see 2.3. HCP Terraform is the paid service (2.4) | `gh:hashicorp/terraform` | Repository active, releases in November 2026 [V]. |
| Pulumi | Any cloud or host with a Pulumi provider; Terraform providers are bridged into Pulumi [K] (`pulumi/pulumi-terraform-bridge` active [V]) | TypeScript/JavaScript, Python, Go, C#, Java, YAML [K] | Pulumi Cloud (default), or a self-managed backend: `file://`, `s3://`, `azblob://`, `gs://`, S3-compatible servers (MinIO, Ceph), `postgres://` [V]. Self-managed backends lock each stack with a lock file under `locks/`, on by default [V]. Secrets in state are encrypted with the Pulumi Cloud key or with a passphrase, AWS KMS, Azure Key Vault, GCP KMS or HashiCorp Vault [K] | `pulumi preview` (`--diff`, `--save-plan <file>`, `--expect-no-changes`) [V]; `pulumi up` shows the preview and asks before applying [K] | `pulumi import <type> <name> <id>` prints the code to add; `--file import.json` for many; imported resources are protected from deletion by default [V]. `import` resource option in code [K] | CLI and SDKs Apache-2.0 and usable without Pulumi Cloud [V]. Pulumi Cloud: Free (1 user, no resource limit), Essentials $40/month up to 500 resources, Pro $400/month up to 2,000, Enterprise by contract (**paid**) [V] | `gh:pulumi/pulumi` | Self-managed backends lack Pulumi Cloud's backups, access control and audit log; the project provides those itself [V]. Pulumi ESC (secrets and configuration) is part of the Pulumi CLI as `pulumi env` [V]. |
| AWS CDK | AWS only | TypeScript/JavaScript, Python, Java, C#, Go [K] | Synthesizes CloudFormation templates; the stacks are the state, held by AWS [K]. Each account and region needs `cdk bootstrap` first: a `CDKToolkit` stack with an S3 bucket, an ECR repository and IAM roles [V] | `cdk diff` [V]; `cdk deploy` asks for approval of security-related changes by default [K] | `cdk import` (CloudFormation resource import) [V]; `cdk migrate` turns existing resources, stacks or templates into a new CDK app [V] | Apache-2.0 [V]; free apart from the bootstrap bucket's storage [K] | `npm:aws-cdk-lib` (library), `npm:aws-cdk` (CLI, `gh:aws/aws-cdk-cli`) | Also `cdk drift`, `cdk refactor`, `cdk orphan` [V]. Both repositories active [V]. |
| AWS CloudFormation | AWS, plus third-party types from the CloudFormation registry [V] | YAML or JSON templates [K] | Stacks held by AWS; nothing to create first [K] | Change sets: `aws cloudformation create-change-set` then `describe-change-set`; `aws cloudformation deploy --no-execute-changeset` creates one for review [K] | IaC generator (scans existing resources and writes a template), resource import, auto-import of resources with matching names, stack refactoring [V] | Free for `AWS::*` and `Alexa::*` types [V]. Third-party resource types and custom hooks are charged per handler operation after a free tier [V] | `bundled` (AWS CLI) | AWS SAM (`gh:aws/aws-sam-cli`, Apache-2.0) is a CloudFormation extension for serverless apps; `sam deploy` shows the change set [K]. |
| `*` Azure Bicep (and ARM JSON templates) | Azure only [K] | Bicep, compiled to ARM JSON [V] | No state file: Azure Resource Manager compares the template with the live resources [K]. Deployment stacks (`az stack group create ... --action-on-unmanage detachAll\|deleteResources\|deleteAll`) record which resources the template manages and detach or delete the ones removed from it [V] | `az deployment group what-if`, or `az deployment group create --confirm-with-what-if` (asks before deploying) [V]. Stacks have their own what-if [V]. What-if can report noise, such as default properties shown as deleted, and cannot evaluate some expressions [V] | No import step: deploying a resource with the same type and name updates the existing one [K]. `az bicep decompile` turns an exported ARM template into Bicep [K] | MIT [V]; free | `gh:Azure/bicep`; installed through the Azure CLI (`az bicep install`) [K] | Repository active [V]. |
| Google Cloud Infrastructure Manager | Google Cloud | Terraform configurations ("blueprints") [V] | Kept by the service for each deployment and revision, with logs; it creates a Cloud Storage bucket for its artifacts [V] | Preview deployments [V]; previews are not charged [S] | Not described on the pages read; Terraform `import` blocks in the configuration [K] | Terraform 1.3.10, 1.4.7 and 1.5.7 (MPL) are the free tier; 1.16.5 is a paid tier (BUSL) [V], billed per resource under management with 500 resources per month free per billing account [S]. Cloud Build minutes and Cloud Storage are billed separately [S] | `service` (`gcloud infra-manager`) [K] | Successor of Deployment Manager (section 7). OpenTofu is not mentioned [V]. |
| Crossplane | Any cloud with a Crossplane provider [K] | Kubernetes YAML (managed resources, compositions) [V] | Resources are Kubernetes objects; needs a Kubernetes cluster running all the time [K] | No plan step documented [V]; Crossplane reconciles continuously and reverts changes made outside it [V] | Annotation `crossplane.io/external-name` with `managementPolicies: ["Observe"]` to adopt without changing [V] | Apache-2.0 [V]; vendor platforms on top are **paid** [K] | `gh:crossplane/crossplane` | Repository active [V]. Heavy for a project that does not already run Kubernetes. [K] |
| Terragrunt | Wrapper around OpenTofu or Terraform [V] | HCL (`terragrunt.hcl`, stacks) [V] | The wrapped tool's backend; can create the S3 or GCS state bucket itself [K] | `terragrunt plan`, `terragrunt run --all plan` [K] | As the wrapped tool | MIT [V]. Terragrunt Scale (Pipelines, Drift Detection, Patcher) is **paid**, Pipelines free up to 25 units [V] | `gh:gruntwork-io/terragrunt` | 1.0 released March 2026 [V]. Pays off when many environments repeat the same modules. |
| Terramate | Orchestrator for OpenTofu, Terraform and Terragrunt stacks [K] | HCL [K] | The wrapped tool's backend [K] | The wrapped tool's plan, run only for changed stacks [K] | As the wrapped tool | MPL-2.0 [V]; Terramate Cloud **paid** [K] | `gh:terramate-io/terramate` | Repository active [V]. |
| SST | AWS and Cloudflare built in; other providers through Pulumi [V] | TypeScript (`sst.config.ts`) [V] | Pulumi engine underneath [V]; state in the user's own cloud account [K] | `sst diff` [K] | [K] not checked | MIT [V]; SST Console optional SaaS with a free tier [V] | `gh:anomalyco/sst` | An application framework rather than a general IaC tool. Repository moved to the `anomalyco` organisation [V]. |
| Serverless Framework | AWS (Lambda) [K] | YAML (`serverless.yml`) [K] | CloudFormation stacks [K] | [K] not checked | [K] not checked | Version 4 free for organisations with under $2M annual revenue, **paid** credits above [V]; licence not OSI open source (GitHub shows no recognised licence) [V] | `npm:serverless` | Version 3 was the open-source line and is unmaintained since 31 December 2024 [V]. |
| Ansible | Servers and virtual machines over SSH; cloud modules exist but it keeps no record of created resources [K] | YAML playbooks [K] | None: tasks are idempotent against the hosts [K] | `--check` simulates; `--diff` shows before and after; modules without check-mode support are skipped silently, so a dry run can miss changes [V] | n/a | GPL-3.0 [V]; Red Hat Ansible Automation Platform **paid** [K] | `pypi:ansible`, `pypi:ansible-core`, `gh:ansible/ansible` | For configuring servers, not for creating cloud resources. Repository active [V]. |
| AWS Controllers for Kubernetes, Azure Service Operator, Config Connector (Google) | One cloud each | Kubernetes YAML [K] | Kubernetes API [K] | None [K] | Per operator [K] | Apache-2.0, MIT, Apache-2.0 [V] | `gh:aws-controllers-k8s/community`, `gh:Azure/azure-service-operator`, `gh:GoogleCloudPlatform/k8s-config-connector` | Only when the project already runs Kubernetes. Repositories active [V]. |

### 2.3 Terraform's licence for an individual or a small team

- From 1.6.0 on, Terraform is under the Business Source License 1.1. The Additional Use Grant allows production use as long as the use does not include offering Terraform to third parties on a hosted or embedded basis that competes with IBM's paid versions. Each release converts to MPL 2.0 four years after it is published. [V]
- An individual or a team using Terraform to manage its own project's infrastructure is within the grant; using it internally is not treated as competing. [V]
- It matters when the project itself is a product that runs Terraform for its customers, or when the user wants only OSI open-source tools. OpenTofu is the MPL-2.0 alternative. [K]
- Releases before 1.6.0 stay under MPL 2.0. [K]
- Google's Infrastructure Manager charges for its BUSL Terraform version and not for the MPL ones (section 2.2). [V]

### 2.4 Managed runners and pull request automation

| Tool | What it does | Licence and paid parts | Published at | Notes |
|---|---|---|---|---|
| HCP Terraform | Runs plan and apply remotely, keeps state, shows plans on pull requests [K] | Free up to 500 managed resources with unlimited users [V]; Essentials, Standard and Premium from $0.10, $0.47 and $0.99 per resource per month (**paid**) [V] | `service` | The older Free plan ended on 31 March 2026 and organisations were moved to this one [V]. Usable from Terraform; OpenTofu compatibility with the `cloud` block is not confirmed [K]. |
| Pulumi Cloud | State, secrets, history, deployments [V] | See section 2.2 | `service` | |
| Atlantis | Self-hosted server that runs plan on each pull request and posts it as a comment; apply on approval [K] | Apache-2.0 [V] | `gh:runatlantis/atlantis` | Repository active [V]. Needs a server running. |
| Digger | Runs plan and apply inside the project's own CI (for example GitHub Actions) and comments on the pull request [K] | MIT [V]; hosted parts **paid** [K] | `gh:diggerhq/digger` | Repository active [V]. |
| Spacelift, env0, Scalr, Terramate Cloud | Hosted runners and governance for OpenTofu and Terraform [K] | **paid**, some with free tiers [K] | `service` | Listed for completeness. |

A plain CI job that runs `tofu plan` on pull requests and uploads the plan text needs none of these. [K]

### 2.5 IaC support of platform hosts

| Host | Terraform / OpenTofu provider | Pulumi | Host's own config file |
|---|---|---|---|
| Vercel | `vercel/vercel`, official [V repo active] | `pulumiverse/vercel`, community [V repo active] | `vercel.json` [V] |
| Netlify | `netlify/netlify`, official [V repo active] | not checked | `netlify.toml` [K] |
| Fly.io | No maintained official provider: `fly-apps/terraform-provider-fly` is archived (last push 2023) [V]; community fork `andrewbaxter/fly`, last push February 2025 (slow) [V] | not checked | `fly.toml` [V] |
| Render | `render-oss/render`, official [V repo active]; Render recommends Blueprints where possible [S] | not checked | Blueprint `render.yaml` [V] |
| Railway | No official provider; community `terraform-community-providers/railway` [V repo active] | not checked | `railway.json` / `railway.toml` [K] |
| Heroku | `heroku/heroku`, official [V] | not checked | `app.json`, `heroku.yml` [K] |
| Cloudflare | `cloudflare/cloudflare`, official [V] | `pulumi/pulumi-cloudflare` [V repo active] | `wrangler.jsonc` (recommended), `wrangler.json`, `wrangler.toml` [V] |
| DigitalOcean | `digitalocean/digitalocean`, official [V] | `pulumi/pulumi-digitalocean` [V repo active] | App Platform app spec (YAML/JSON) [V] |
| Supabase | `supabase/supabase`, official [V] | not checked | `supabase/config.toml`, pushed with `supabase config push` [V command exists; K details] |
| Neon | `neondatabase/neon`, official, beta, continues the archived community provider `kislerdm/neon` [V] | The Pulumi package based on the community provider is marked deprecated [S] | none |

A host's own config file usually covers the app's settings (build, routes, regions), not the account-level resources such as databases or domains. [K]

## 3. State storage

### 3.1 What each tool needs

| Tool and backend | What must exist before the first run | Locking | Running cost | Notes |
|---|---|---|---|---|
| OpenTofu / Terraform, `s3` | An S3 bucket; versioning strongly recommended for recovery [V] | `use_lockfile = true` writes `<key>.tflock` next to the state (off by default) [V]. DynamoDB locking (`dynamodb_table`) is deprecated and will be removed [V] | Cents per month for storage [K] | IAM: `s3:ListBucket`, `s3:GetObject`, `s3:PutObject`, plus `s3:DeleteObject` on the lock file [V]. S3-compatible stores (MinIO, R2 and others) work through the same backend with endpoint settings [K]. |
| OpenTofu / Terraform, `azurerm` | A storage account and a blob container [K] | Yes, with Blob Storage's native capabilities [V] | Cents per month [K] | Microsoft Entra ID authentication recommended; SAS token and access key not recommended for new setups [V]. |
| OpenTofu / Terraform, `gcs` | A Cloud Storage bucket; object versioning highly recommended [V] | Yes [V] | Cents per month [K] | |
| OpenTofu / Terraform, `pg` | A PostgreSQL database [K] | Yes, advisory locks [K] | The database's cost, or none if one already exists [K] | Useful when the project already has a PostgreSQL server outside the infrastructure it creates. [K] |
| OpenTofu / Terraform, `http` | Any HTTP endpoint implementing the protocol, for example a Git host's managed state [K] | Optional, per endpoint [K] | Per host [K] | |
| OpenTofu / Terraform, `local` | Nothing [K] | Local only [K] | None | Fine for one person on one machine; unsuitable when CI or a second person applies, and the file holds secrets (3.3). [K] |
| Terraform, HCP Terraform | An HCP account, organisation and workspace; a token for CI [K] | Yes [K] | Free up to 500 managed resources [V] | |
| Pulumi, self-managed | A bucket (`s3://`, `azblob://`, `gs://`), a PostgreSQL database, or a directory [V] | Lock file per stack, on by default [V] | Cents per month [K] | A secrets passphrase or KMS key per stack [K]. |
| Pulumi, Pulumi Cloud | An account; `PULUMI_ACCESS_TOKEN` for CI [K] | Yes [K] | Free tier, then **paid** (section 2.2) [V] | |
| AWS CDK | `cdk bootstrap` once per account and region (S3 bucket, ECR repository, IAM roles) [V] | CloudFormation serialises stack updates [K] | Storage of assets [K] | |
| CloudFormation, Bicep, Infrastructure Manager | Nothing; the cloud keeps the record [K for CloudFormation and Bicep; V for Infrastructure Manager] | Handled by the service [K] | None for state [K] | |
| Crossplane and Kubernetes operators | A Kubernetes cluster [K] | Kubernetes API [K] | The cluster's cost [K] | |

### 3.2 The bootstrap problem

The state store is itself a cloud resource, and the tool that will use it cannot keep its own state in it before it exists. Common ways out for small projects, stated as options for the user:

| Option | How | Trade-off |
|---|---|---|
| A. Create the state store with the provider's CLI once | A few commands (bucket with versioning, encryption and public access blocked; container; or GCS bucket), recorded in the architecture document next to the IaC choice [K] | Simplest; the state store itself is outside IaC. |
| B. A small bootstrap configuration with local state | A separate directory that creates the bucket with local state; afterwards its own state can be moved into the bucket with `tofu init -migrate-state` [K] | Everything is code; one more directory to understand. |
| C. Let Terragrunt create it | Terragrunt's remote state settings create the bucket on first run [K] | Adds Terragrunt. |
| D. Use a managed backend | HCP Terraform (free up to 500 resources) or Pulumi Cloud (Free plan) [V] | Nothing to create; an external account and token, and paid tiers beyond the free limits. |
| E. Choose a tool whose state the cloud keeps | CloudFormation, CDK (one bootstrap command), Bicep with deployment stacks, Infrastructure Manager [V] | Ties the project to one cloud. |

### 3.3 Practice that matters for any backend

- One state per environment: a separate key or prefix (for example `staging/` and `production/`), or a separate bucket per account or project, so a plan for staging cannot touch production. [K]
- State files hold secrets in plain text, such as generated database passwords and connection strings, unless the tool encrypts them (OpenTofu state encryption, Pulumi secrets). The bucket needs restricted access and encryption at rest, and the state file never goes into the repository. [K for the risk; V for the OpenTofu feature]
- Versioning on the state bucket gives a way back after a bad apply or an accidental delete. [V]

## 4. Direct CLI creation (option a)

### 4.1 Rules for secrets on any CLI

- A value given as a command argument lands in shell history and process lists. Vendor docs say so for AWS Secrets Manager and for Vercel's `--token`. [V]
- Prefer, in this order: the CLI generating the secret itself (RDS `--manage-master-user-password`); reading from stdin; reading from a file (`file://`, `@file`, `--env-file`, `< .env`); an interactive masked prompt. [V for the commands named in 4.2 and 4.3]
- `echo value | cli ...` still writes the value into shell history; pipe from a file or a password manager instead. [V Vercel docs]
- The dotenv file used as input is never committed; it is deleted or kept outside the repository after use. [K]
- Tokens for CI go into the CI secret store as environment variables, never into flags. [V for Vercel, Netlify, Fly, Neon flag warnings]

### 4.2 Cloud providers

| | AWS (`aws`) | Azure (`az`) | Google Cloud (`gcloud`) |
|---|---|---|---|
| Published at | `gh:aws/aws-cli` (version 2 installers from AWS) [K] | `gh:Azure/azure-cli` [V repo active] | Google Cloud CLI installer and package repositories [K] |
| Interactive login | `aws login`: browser sign-in with console credentials, temporary credentials refreshed for up to 12 hours; `aws login --remote` without a local browser [V]. IAM Identity Center: `aws configure sso`, `aws sso login` [V] | `az login`: browser sign-in with a subscription selector [V]; `--use-device-code` without a browser [K]. Multi-factor authentication is required for user accounts [V] | `gcloud auth login` (browser); `gcloud auth application-default login` for SDKs and IaC tools [K] |
| Non-interactive (CI) | An IAM role assumed through OIDC from the CI, or `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` [K] | Service principal (recommended for scripts) or managed identity [V]; OIDC federation from CI [K] | Workload Identity Federation from the CI, or `gcloud auth activate-service-account --key-file` [K] |
| Managed PostgreSQL | `aws rds create-db-instance --db-instance-identifier <id> --engine postgres --db-instance-class <class> --allocated-storage <GB> --master-username <user> --manage-master-user-password`: RDS generates the password and stores it in Secrets Manager (the secret is charged) [V]. Smallest classes such as `db.t4g.micro` [K]. Lightsail alternative with fixed monthly bundles: `aws lightsail create-relational-database` [K] | `az postgres flexible-server create -g <rg> -n <name> -l <region> --tier Burstable --sku-name Standard_B1ms --admin-user <user>` [K for the Burstable/B1ms pairing]. `--tier` defaults to GeneralPurpose and storage to 128 GiB, so leaving them out costs more [V]. With no arguments the CLI generates names and password and enables public access [V] | `gcloud sql instances create <name> --database-version=POSTGRES_<n> --edition=enterprise --tier=db-f1-micro --region=<region>`; shared-core tiers (`db-f1-micro`, `db-g1-small`) only on the Enterprise edition; `--region` defaults to `us-central` [V] |
| Web service | Amazon ECS Express Mode: `aws ecs create-express-gateway-service --image <uri> --execution-role-arn <arn> --infrastructure-role-arn <arn>`, URL `https://<service>.ecs.<region>.on.aws/`, no extra charge beyond the resources it creates [S, AWS docs and blog in search results]. App Runner is closed to new customers and AWS recommends ECS Express Mode [V] | `az webapp up` (App Service) or `az containerapp up` (Container Apps) [K] | `gcloud run deploy <service> --source . --region <region>`: builds with the Dockerfile if present, otherwise with buildpacks [V] |
| Secrets and settings without echo | `aws secretsmanager create-secret --name <n> --secret-string file://secret.json`; the docs warn against values on the command line [V]. `aws ssm put-parameter --type SecureString --value file://<path>` [K]. ECS reads them through the task definition's `secrets` [K] | `az webapp config appsettings set -g <rg> -n <app> --settings @settings.json`; values are redacted in the output [V]. `az keyvault secret set --vault-name <v> --name <n> --file <path>` [K] | `gcloud secrets create <n> --data-file=-` reads stdin, or `--data-file=<path>` [V]; `gcloud run deploy --set-secrets=KEY=<secret>:latest` [V]; plain settings with `--env-vars-file <file>` (YAML or ENV format) [V] |
| Read back the connection details | `aws rds describe-db-instances --db-instance-identifier <id>` gives the endpoint and `MasterUserSecret.SecretArn`; `aws secretsmanager get-secret-value --secret-id <arn>` gives user and password [V]. There is no single URL; the agent assembles it [K] | `az postgres flexible-server show-connection-string -s <server> -u <user> -d <db>` prints connection strings for several languages, with placeholders unless the values are passed [V] | `gcloud sql instances describe <name> --format='value(connectionName)'` for the Cloud SQL connectors and Auth Proxy, `ipAddresses` for direct IP [K]. No single URL [K] |
| Price before creating | `aws pricing get-products --service-code <code> --filters ...` (Price List Query API) [V]. `aws lightsail get-relational-database-bundles` returns a monthly `price` per bundle [V] | Azure Retail Prices API `https://prices.azure.com/api/retail/prices?$filter=...`, no authentication [V]. No `az` command for prices [K] | Cloud Billing Pricing API, needs an API key, for example `GET https://cloudbilling.googleapis.com/v1beta/skus/<SKU_ID>/price?key=<API_KEY>` (pre-GA) [V] |
| Pricing pages | `https://aws.amazon.com/pricing/`, calculator `https://calculator.aws/` [K] | `https://azure.microsoft.com/pricing/`, calculator `https://azure.microsoft.com/pricing/calculator/` [K] | `https://cloud.google.com/pricing`, calculator `https://cloud.google.com/products/calculator` [K] |

### 4.3 Platform hosts

| Host and CLI | Published at | Login | Create a web service or app | Managed PostgreSQL | Settings and secrets without echo | Read back the connection string | Price shown by the CLI | Pricing page |
|---|---|---|---|---|---|---|---|---|
| Vercel, `vercel` | `npm:vercel` [V] | `vercel login`; CI: `VERCEL_TOKEN` (preferred over `--token`, which shows in process lists); tokens at vercel.com/account/tokens or `vercel tokens create` [V] | `vercel project create <name>`, then `vercel deploy` [V] | No own database; Marketplace: `vercel integration add neon` with `--name`, `--billing-plan`, `-e production`, `--prefix`; `--help` on it lists products and billing plans [V] | `vercel env add NAME --environment production < file`; `cat file \| vercel env update NAME --environment preview --yes`; with no value it prompts [V]. One variable per call; no bulk dotenv import [V]. Production and Preview variables default to type Secret [V] | The integration sets `DATABASE_URL` (prefix changes the name) and pulls it [V]. `vercel env pull` cannot read back Secret-type values [V]; `vercel env run -- <cmd>` injects without a file [V] | Billing plans listed by `integration add --help`; no price prompt documented [V] | `https://vercel.com/pricing` [K] |
| Netlify, `netlify` | `npm:netlify-cli` [V] | `netlify login` (browser); CI: `NETLIFY_AUTH_TOKEN` (personal access token) [V] | `netlify sites:create --name <n>`; or `netlify init` (deploys from Git), `netlify deploy` [V] | Netlify Database: `netlify database init` (`--yes`), provisioned on deploy; Free plan includes it with limits [V] | `netlify env:import <file>` reads a dotenv file (`--replace-existing`) [V]. `netlify env:set KEY value` puts the value in argv; `--secret` makes it unreadable later [V] | `NETLIFY_DB_URL` at run time; `netlify database status --show-credentials`, `netlify database connect --json` [V] | None documented [V] | `https://www.netlify.com/pricing/` [V] |
| Fly.io, `fly` (`flyctl`) | `gh:superfly/flyctl`, install script or Homebrew [V] | `fly auth login`; CI: `FLY_API_TOKEN` from `fly tokens create deploy` (app-scoped) or `fly tokens create org`; the token contains a space and needs quoting [V] | `fly launch --name <n> -r <region> --no-deploy` (writes `fly.toml`); `--db mpg` also creates Managed Postgres [V] | `fly mpg create --name <n> --region <r> --plan <plan> --volume-size <GB>`; smallest plan Basic about $38/month plus storage [V]; no free tier [V] | `fly secrets import` reads `NAME=VALUE` lines from stdin (`< .env`), `--stage` to set without deploying [V]. `fly secrets set NAME=VALUE` puts values in argv [V] | `fly mpg attach <cluster> -a <app>` sets `DATABASE_URL` (pooled) as a secret [V]. No CLI command prints the URL; the dashboard shows it; `fly secrets list` shows digests only [V] | Not documented; an interactive plan picker with prices is likely [K] | `https://fly.io/docs/about/pricing/` [V] |
| Render, `render` | `gh:render-oss/cli`, Homebrew, WinGet [V] | `render login` (browser); CI: `RENDER_API_KEY` (keys do not expire) [V] | `render services create --name <n> --type web_service --repo <url> --runtime <rt> --build-command ... --start-command ... --plan <p> --region <r>` (needs `--repo`, `--image` or `--from`) [V] | `render pg create --name <n> --plan <plan> --region <r>`; plans start at `free` (expires after 30 days, 1 GB, no backups) and `0.1c-256mb` [V] | No CLI command for environment variables; `services create --env-var K=V` puts values in argv [V]. Use a Blueprint with `sync: false` (value entered in the dashboard), the dashboard, an environment group or the REST API [K] | `render pg get <id> --include-sensitive-connection-info` prints internal and external URLs [V]; Blueprints link it with `fromDatabase` [K] | None [V] | `https://render.com/pricing` [K] |
| Railway, `railway` | `npm:@railway/cli`, Homebrew, Scoop, install script [V] | `railway login` (`--browserless` over SSH); CI: `RAILWAY_TOKEN` (project) or `RAILWAY_API_TOKEN` (account or workspace) [V] | `railway init`, then `railway add --service <n>` or `--repo <owner/repo>` or `--image <img>`, then `railway up` [V] | `railway add --database postgres` [V]; usage-based billing, no per-database plan [K] | `railway variable set KEY --stdin` (for example `< secret.txt`) [V]. `railway variable set KEY=value` puts values in argv [V]. No dotenv import in the CLI; the dashboard's raw editor accepts a pasted `.env` [V] | The Postgres service exposes `DATABASE_URL`; the app references `${{Postgres.DATABASE_URL}}` [V]; `railway variable list -s Postgres --kv` prints it [V flags; K for this use] | None; `railway usage` shows usage [V] | `https://railway.com/pricing` [K] |
| Heroku, `heroku` | `npm:heroku`, Homebrew, installers from cli-assets.heroku.com [V] | `heroku login` (browser); CI: `HEROKU_API_KEY`, long-lived token from `heroku authorizations:create -d <desc> -S` [V] | `heroku create <app> --region <r>` [V] | `heroku addons:create heroku-postgresql:essential-0 -a <app> --wait`; `essential-0` is the smallest (1 GB, $5/month) [V] | `heroku config:set` accepts only `KEY=VALUE` arguments and prints them back; it has no stdin or file option [V]. Use the Platform API `PATCH /apps/<app>/config-vars` with a JSON body from a file [V path; K command], or the dashboard [K] | `heroku config:get DATABASE_URL -a <app>`; `heroku pg:credentials:url -a <app>` [V] | `heroku addons:plans heroku-postgresql` prints hourly and maximum monthly price [V source code] | `https://www.heroku.com/pricing` [V] |
| Cloudflare, `wrangler` | `npm:wrangler`, installed locally in the project [V] | `wrangler login` (`--browser=false` prints the link); CI: `CLOUDFLARE_API_TOKEN` plus `CLOUDFLARE_ACCOUNT_ID`; token from the dashboard's API Tokens page [V] | `npm create cloudflare@latest` [K] or `wrangler init`, then `wrangler deploy` [V] | No managed PostgreSQL. D1 (SQLite): `wrangler d1 create <n> --location <hint>`. Hyperdrive connects Workers to an external PostgreSQL: `wrangler hyperdrive create <n> --connection-string=...` (password in argv; no prompt or file option documented) [V]. R2: `wrangler r2 bucket create <n>`; KV: `wrangler kv namespace create <n>`; Queues: `wrangler queues create <n>` [V] | `wrangler secret put <KEY>` prompts or reads a pipe; `wrangler secret bulk <file>` reads JSON or `.env`, or stdin, up to 100 per call; `wrangler deploy --secrets-file <file>` [V] | Not applicable; Workers get bindings [V] | None [K] | `https://developers.cloudflare.com/workers/platform/pricing/` (Workers Paid from $5/month per account; free limits per product) [V] |
| DigitalOcean, `doctl` | `gh:digitalocean/doctl`, Homebrew, Snap [V] | No browser login [K]; `doctl auth init` prompts for a token; CI: `DIGITALOCEAN_ACCESS_TOKEN` (avoid `-t`) [V] | `doctl apps create --spec app.yaml` (`--spec -` reads stdin, `--upsert`, `--wait`) [V] | `doctl databases create <n> --engine pg --size db-s-1vcpu-1gb --region <r> --num-nodes 1`; smallest size $15/month [V]. An app spec `databases:` component with `production: false` gives a development database [V] | App spec `envs` entries with `type: SECRET` are encrypted on first submission [V]; `${<db>.DATABASE_URL}` binds the database URL without writing a secret [V]. Feed the spec on stdin, or keep the spec file with plain values out of the repository [V] | `doctl databases connection <id> --format URI --no-header` (`--private` for the private network) [V] | `doctl apps tier instance-size list` shows monthly and per-second prices [V source code]; `doctl databases options slugs` shows no prices [V source code] | `https://www.digitalocean.com/pricing/managed-databases` [V] |
| Supabase, `supabase` | `npm:supabase` (project dev dependency), Homebrew tap, Scoop, `gh:supabase/cli` [V] | `supabase login` (browser, `--no-browser`); CI: `SUPABASE_ACCESS_TOKEN` [V] | Not a web host; a project is a PostgreSQL database plus APIs | `supabase projects create <n> --org-id <id> --region <r>`; in a terminal it prompts for missing values, including a masked database password (blank generates one); without a terminal `--org-id`, `--db-password` and `--region` are required and `--db-password` puts the password in argv [V source code]. Free plan allows two projects [V] | `supabase secrets set --env-file <path>` (Edge Functions secrets) [V]; `NAME=VALUE` arguments put values in argv [V] | No CLI command prints the main database URL; the dashboard's Connect button shows direct and pooler URLs [V] | None [K] | `https://supabase.com/pricing` [V] |
| Neon, `neon` (alias `neonctl`) | `npm:neon`, Homebrew `neonctl`, binaries from `gh:neondatabase/neon-pkgs` [V] | `neon auth` (browser); CI: `NEON_API_KEY` (avoid `--api-key`); keys from the console or `neon api-keys create` [V] | Not a web host | `neon projects create --name <n> --region-id <region>`; prints connection URIs with the password unless `--no-secrets` [V]. Branches per environment: `neon branches create --name <n> --parent <branch>` [V] | Not applicable | `neon connection-string <branch> --project-id <id> --pooled` (output contains the password) [V] | None [K] | `https://neon.com/pricing` [K] |

## 5. Cost visibility before creating

| Tool or source | What it shows | Works with | Needs | Paid parts | Notes |
|---|---|---|---|---|---|
| Infracost CLI (`infracost scan <dir>`, `infracost inspect --summary`) | Monthly cost estimate from IaC files, before anything is created [V] | Terraform, Terragrunt, CloudFormation [V]; the pricing page also names AWS CDK [V]; AWS, Azure and Google Cloud, over 1,100 resource types [V] | `infracost auth login` (browser, or `--oauth-use-device-flow`); CI: `INFRACOST_CLI_AUTHENTICATION_TOKEN` [V] | Free CI/CD tier with 1,000 runs per month; Starter $250/month (deprecated on 30 November 2026), Cloud $1,000/month, Enterprise by contract (**paid**) [V] | CLI Apache-2.0, `gh:infracost/cli` [V]. OpenTofu and Pulumi are not named on the pages read [V]. The older `gh:infracost/infracost` repository (`infracost breakdown`, `infracost diff`) still publishes releases [V releases; K commands]. |
| Cloud price APIs | Unit prices per SKU and region | AWS `aws pricing get-products` [V]; Azure Retail Prices API without authentication [V]; Google Cloud Pricing API with an API key [V] | AWS credentials; nothing; an API key | Free [K] | The agent multiplies unit prices by the chosen size and hours itself. |
| Fixed-price bundles | A monthly price per size | AWS Lightsail bundles (`price` field) [V]; DigitalOcean App Platform instance sizes [V]; Heroku add-on plans [V] | The CLI's normal login | n/a | The clearest numbers to show a user. |
| `aws cloudformation estimate-template-cost` | A URL to the old AWS Simple Monthly Calculator [V] | CloudFormation templates | AWS credentials | n/a | That calculator was retired in favour of the AWS Pricing Calculator [K]; do not rely on the URL. |
| AWS Pricing Calculator API (`aws bcm-pricing-calculator`) | Workload and bill estimates [K] | AWS | AWS credentials [K] | [K] not checked | Not verified this time. |
| Pricing pages and calculators | List prices | Every provider (sections 4.2 and 4.3) | A browser | n/a | The fallback for platform hosts, none of which show a price before creating except Heroku's plan list and DigitalOcean's app sizes. |

Previews (`tofu plan`, `pulumi preview`, `what-if`, change sets) show what changes, never what it costs. [K]

## 6. When direct CLI creation is enough and when IaC pays off

Stated as trade-offs; the user decides.

| Factor | Points toward (a) direct CLI | Points toward (b) IaC |
|---|---|---|
| Number of resources | A handful (a database, one web service, a bucket) | Many, or networks, roles and permissions between them |
| Environments | One environment, or staging that may differ from production | Staging must match production, or environments are created and destroyed often (PR previews) |
| Review | The user reads the commands in the architecture document once | Changes are reviewed in pull requests with a plan attached |
| Host | Platform hosts with a simple CLI (Fly.io, Railway, Render) where the provider for IaC is missing, community-run or archived (section 2.5) | Clouds with mature providers (AWS, Azure, Google Cloud, Cloudflare, DigitalOcean) |
| Drift | Few people touch the console | Several people or tools change resources and someone must notice |
| Tear-down | Rare | Needed (throwaway environments, cost control) |
| Extra cost and effort | None beyond the CLI | A state store (section 3), one more tool and language, provider upgrades |
| Recovery | Re-run recorded commands; easy to miss a flag | Re-apply the files into a new account or region |

A mixed approach is common: IaC for the cloud resources and the host's own config file (`fly.toml`, `render.yaml`, app spec) for the app's settings, or CLI commands for one-off account setup (the state bucket, DNS delegation) and IaC for the rest. [K]

## 7. Dead, archived or replaced (do not propose)

| Tool or feature | Status | Use instead |
|---|---|---|
| CDK for Terraform (CDKTF, `hashicorp/terraform-cdk`) | Sunset announced for 10 December 2025; repository archived [V]. Prebuilt provider bindings such as `cdktf/cdktf-provider-aws` archived [V] | `cdktf synth --hcl` to convert to HCL, then OpenTofu or Terraform; AWS CDK for AWS-centric code; Pulumi for a programming language [V] |
| Google Cloud Deployment Manager | Support ended 31 March 2026; maximum extension to 31 March 2027; shut down after 30 June 2027. Resources it created keep working [V] | Infrastructure Manager (DM Convert translates configurations to Terraform) or another tool [V] |
| AWS App Runner | Closed to new customers; existing customers continue [V] | Amazon ECS Express Mode [V] |
| DynamoDB locking for the S3 backend | Deprecated, to be removed [V] | `use_lockfile = true` [V] |
| HCP Terraform legacy Free plan | Ended 31 March 2026 [V] | The Free tier up to 500 resources [V] |
| Standalone Pulumi ESC CLI (`esc`, `pulumi/esc`) | Retired; repository archived [V] | `pulumi env` in the Pulumi CLI [V] |
| Fly.io Terraform provider (`fly-apps/terraform-provider-fly`) | Archived, last push 2023 [V] | Fly CLI with `fly.toml`; the community fork is slow [V] |
| Neon community Terraform provider (`kislerdm/neon`) | Archived [V] | `neondatabase/neon` [V] |
| Infracost Starter plan | Deprecated on 30 November 2026 [V] | Free CI/CD tier or the Cloud plan [V] |
| Serverless Framework version 3 | Unmaintained since 31 December 2024 [V] | Version 4 (**paid** above $2M revenue), AWS SAM, AWS CDK, SST |
| Winglang (`winglang/wing`) | Last release February 2025, little activity since [V] | Pulumi, AWS CDK, SST |
| AWS Simple Monthly Calculator (`estimate-template-cost` output) | Retired [K] | AWS Pricing Calculator, Infracost |
| Netlify `netlify db init` (Neon-based, `NETLIFY_DATABASE_URL`) | Replaced by `netlify database init` [S] | `netlify database init` [V] |

## 8. Gaps

- **Infracost with OpenTofu and Pulumi**: the pages read name only Terraform, Terragrunt, CloudFormation and CDK. OpenTofu configurations are HCL and may work, but this was not confirmed. For Pulumi, offer prices from the cloud price APIs (section 5). [V for what is named]
- **Price before creating on platform hosts**: only Heroku's add-on plan list and DigitalOcean's app sizes show prices from the CLI; Fly.io's interactive plan picker was not confirmed. Offer the pricing page and state the plan name with its listed price. [V]
- **Connection strings without a CLI command**: Fly.io Managed Postgres and Supabase show them only in the dashboard. Offer the attach command (Fly sets `DATABASE_URL` itself) or ask the user to paste the URL into a prompt or a file that is not committed. [V]
- **Secrets that must go in argv**: Render (no environment variable command), Heroku `config:set`, Cloudflare Hyperdrive's connection string, and Supabase `--db-password` without a terminal. Offer the dashboard, the provider's REST API with a JSON body from a file, or the interactive prompt where one exists. [V]
- **Cloudflare** has no managed PostgreSQL; D1 is SQLite, and Hyperdrive only connects to an external database. [V]
- **Infrastructure Manager**: import of existing resources and the exact paid-tier prices were not read on the vendor's own pages. [S]
- **AWS ECS Express Mode** flags were seen in search results, not read on the CLI reference page. [S]
- **Azure Bicep import** and the Burstable `Standard_B1ms` pairing for PostgreSQL flexible server are from prior knowledge. [K]
- **HCP Terraform with OpenTofu** (the `cloud` block) was not checked. [K]
- **Vercel's GitHub releases** stop in July 2026 although the repository is active; the CLI's releases are on npm. [V]
