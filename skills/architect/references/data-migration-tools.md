# Architect step: data migration tools by data kind and stack

Reference list for the architect step. The step lists every kind of persistent data the project keeps outside its program code that must stay consistent with the code's version (databases, files in object storage, files on a file system, on-device stores and the rest below), and the user picks one migration tool per data kind. An agent reads this file to propose a tool for each data kind on the project's chosen stacks: versioned migration scripts, one fixed apply command that finds the target's current version, applies only the missing scripts and records what ran, and a migration test that brings old-shaped data to the new version. The agent proposes, the user chooses, and scaffold installs the latest release of the chosen tool. The list is a starting point, not a configuration.

Research date: 2026-11-18.

Version numbers are deliberately left out because they go stale. Each tool names where its latest release is published, and the agent reads the version from there when it sets up the project.

## 0. How to read this file

### 0.1 Markers

- **[V]**: confirmed during this research on the project's own page, docs or repository. For GitHub projects this includes the GitHub API on 2026-11-18 showing the repository not archived, with commits in recent months.
- **[S]**: confirmed only from a secondary source (blogs, aggregators, vendor comparisons, package indexes showing a release date).
- **[K]**: from prior knowledge, not re-checked this time. Verify before relying on it.
- **slow**: maintained but with thin activity or a last release more than a year old. Check again before proposing it as the default.
- **`*`** before a tool name: the usual default for that stack.
- **paid**: needs a paid edition or licence for the feature named. **SA**: source-available licence (not OSI open source). Paid and SA items are listed so the user can choose them, never proposed as the default for a project that has not said it pays for tools.

A marker at the end of a row's Notes cell applies to the whole row; a marker right after one fact applies to that fact only.

### 0.2 Column key

- **Scripts**: `SQL` plain SQL files; `code` migrations written in the host language; `both`; `DSL` the tool's own format (YAML/XML/JSON changelog, `.http` requests, Cypher, and so on).
- **Version detection & history**: how the tool finds what has already run. `history table` means one row per applied script (name, checksum, time), so the target holds the full record. `version marker` means only the current version is stored (for example a single-row table, `PRAGMA user_version`, the IndexedDB version number); the tool still applies only the missing steps, but the target does not keep a per-script record.
- **Down**: `Y` down/rollback scripts supported; `N` forward only; `paid` only in a paid edition.
- **Runs from**: `pipeline` a CLI or one-shot job in CI/deploy; `startup` the server application applies migrations when it starts; `device` the application applies them on the user's machine or browser when it opens the store (cannot run from CI against users' data); `both` the tool supports pipeline and startup.
- **Published at**: where the newest release is. Shorthands: `mvn:group:artifact` (Maven Central), `pypi:x`, `npm:x`, `nuget:x`, `go:module`, `gem:x`, `crates:x`, `packagist:vendor/name`, `hex:x`, `pub:x`, `spm:owner/repo` (Swift Package Manager from GitHub), `cpan:x`, `gh:owner/repo` (GitHub releases), `bundled` (ships with the framework, SDK or platform).

## 1. Data kinds at a glance

| Data kind | Is it migrated with versioned scripts? | Standard tool exists? | Where the migration runs | Notes |
|---|---|---|---|---|
| Relational SQL databases (server) | Yes | Yes, on every stack (sections 2 and 3) | pipeline (preferred) or startup | The model described in the intro is the industry norm here. [V] |
| SQLite / embedded SQL inside a server or CLI the team deploys | Yes | Yes, the same tools as relational | pipeline or startup | Most SQL tools support SQLite. [V] |
| Document DBs: MongoDB | Yes, or lazy per-document upgrade | Yes, several (section 4.1) | pipeline or startup | Large collections are often upgraded lazily plus a background backfill. [K] |
| Document DBs: Couchbase, Firestore, Cosmos DB | Sometimes | Couchbase: one (JVM only). Firestore: none maintained. Cosmos DB: Flyway preview only | pipeline or startup | Common practice is a version field per document and lazy upgrade. [S] |
| Key-value / wide-column: DynamoDB | Data: sometimes. Tables and indexes: infrastructure as code | No standard; one JVM tool, a few small Node tools | pipeline (backfill job) | Table and index definitions usually live in Terraform/CloudFormation/CDK, not in a migration tool. [K] |
| Wide-column: Cassandra, ScyllaDB | Yes (CQL scripts) | Yes, a few (section 4.2) | pipeline or startup | Schema changes are not transactional; scripts must be idempotent. [K] |
| Redis used as a cache | No | Not needed | n/a | Cache is rebuilt: flush, or put a version in the key prefix. [K] |
| Redis used as a primary store | Sometimes | No standard tool | pipeline or startup | Teams write a small runner that stores the data version in a key. [K] |
| Search indexes (Elasticsearch, OpenSearch) | Mappings and templates: yes. Documents: usually re-indexed, not migrated | One maintained tool (JVM) | startup or pipeline | Common pattern is a new versioned index, reindex, then an alias swap. [S] |
| Graph DBs (Neo4j) | Yes (Cypher scripts) | Yes, one (section 4.4) | pipeline or startup | [V] |
| Time-series: TimescaleDB, ClickHouse, QuestDB | Yes (SQL) | Yes, SQL tools that support them | pipeline | TimescaleDB is PostgreSQL, so any PostgreSQL tool works. [K] |
| Time-series: InfluxDB, Prometheus | Rarely | No | n/a | Schemaless or derived data; teams write to a new measurement/bucket and backfill. [K] |
| Data warehouse tables (Snowflake, BigQuery, Redshift, Databricks SQL) | Raw/landing tables: yes. Modelled tables: rebuilt declaratively | Yes for raw tables (section 5) | pipeline | Transformed tables built by dbt or SQLMesh are not migrated with versioned scripts. [K] |
| Lakehouse tables (Iceberg, Delta Lake, Hudi) | Schema: built-in metadata evolution. Data rewrites: jobs | No migration tool needed for schema; no standard runner for data rewrites | pipeline (job) | Iceberg schema changes are metadata-only. [V] |
| Files in object storage (S3, GCS, Azure Blob): JSON, CSV, Parquet, binary, object metadata | Sometimes | No standard tool | pipeline (job) or lazy on read | Section 6. [S] |
| Files on a server file system | Sometimes | No standard tool | startup or a fixed upgrade command of the app | Section 6. [K] |
| On-device databases (Android, iOS, Flutter, browser, desktop, C++) | Yes | Yes on mobile, browser, .NET, Rust and JS desktop; no standard for C/C++ | device | Cannot run from CI against user data; section 7. [V] |
| Files the app keeps on the user's device (settings, documents, caches) | Sometimes | No standard tool | device | A version field in the file and upgrade code in the app. [K] |
| Message and event schemas (Kafka with Schema Registry, Protobuf, Avro) | No: compatibility rules | Compatibility checkers, not migration tools | pipeline (check only) | Old messages stay as written; section 8. [V] |
| Event-sourced event stores | No: events are immutable | Upcasters in the framework | read time | Old events are converted when read, or copied to a new stream. [K] |
| Config files and secrets | No | Not migration tools | n/a | Section 9. [K] |

## 2. Relational SQL: language-agnostic CLIs

These run from any stack's pipeline, including C/C++, Swift, Dart and other stacks without a strong in-language tool.

| Tool | Scripts | Version detection & history | Down | Fixed apply command | Runs from | Test approach | License | Published at | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `*` Flyway | both (SQL files; Java migrations in JVM projects [K]) | history table `flyway_schema_history` [V] | paid (undo is Teams [V]; Community writes a new forward script) | `flyway migrate` [V] | both (Spring Boot runs it at startup when on the classpath [K]) | `flyway migrate -target=<N-1>`, seed, `flyway migrate` [K] | Community Apache-2.0 [V]; Teams and Enterprise paid: undo (Teams), dry-run check (Teams), diff, generate, drift check (Enterprise) [V] | `mvn:org.flywaydb:flyway-core`, CLI and Docker `gh:flyway/flyway` | Also supports Snowflake, BigQuery, Databricks, ClickHouse, Redshift; Cassandra and MongoDB through "native connectors" (MongoDB JSON/JS migrations, JS needs `mongosh`; Cassandra in preview). No database is limited to paid editions. [V] |
| Liquibase | DSL (XML/YAML/JSON changelogs) or SQL (formatted SQL) [K] | history table `DATABASECHANGELOG` plus lock table `DATABASECHANGELOGLOCK` [K] | Y (`rollback`, `rollback-count`, `rollback-to-date` in Community [K]) | `liquibase update` [K] | both (Spring Boot startup integration [K]) | `liquibase update-count <n>` or `update-to-tag`, seed, `liquibase update`; `update-testing-rollback` [K] | **SA**: Community 5.0 and later under FSL-1.1-ALv2, each release converts to Apache 2.0 after two years [V]; Liquibase Secure paid [V] | `mvn:org.liquibase:liquibase-core`, `gh:liquibase/liquibase` | From 5.0 Community ships without most extensions and drivers; install them with `liquibase lpm` [V]. Extensions: MongoDB (open-source, limited change types; full support only in the paid Secure extension [S]), Cassandra [V]. |
| Atlas | SQL files (versioned mode); also a declarative mode [V] | history table `atlas_schema_revisions` [V] | Y (`atlas migrate down`) [V] | `atlas migrate apply` [K] | pipeline | Testing framework (`migrate test`) is **paid** [V]; otherwise Testcontainers plus `migrate apply` with an amount [K] | Community binary Apache-2.0; default binary under the Atlas EULA; Pro **paid** [V] | `gh:ariga/atlas` | Open edition covers PostgreSQL, MySQL, MariaDB, SQLite, TiDB, LibSQL only. SQL Server, Oracle, Snowflake, ClickHouse, Redshift, Spanner, Databricks, CockroachDB are **paid** [V]. |
| dbmate | SQL (`-- migrate:up` / `-- migrate:down` in one file) [V] | history table `schema_migrations` [V] | Y (`dbmate rollback`) [V] | `dbmate migrate` (or `dbmate up`, which also creates the database) [V] | pipeline | Testcontainers; no documented "migrate to version" option, so tests apply files in steps by directory [V] | MIT [V] | `gh:amacneil/dbmate` | MySQL, MariaDB, PostgreSQL, SQLite, ClickHouse, BigQuery, Spanner; PostgreSQL-only migration lock. [V] |
| golang-migrate CLI | SQL or driver-native files (e.g. MongoDB JSON commands, CQL) [V] | version marker: `schema_migrations` holds the current version and a dirty flag, not per-script history [K] | Y | `migrate -path <dir> -database <url> up` [K] | both (library or CLI) | `migrate goto <N-1>`, seed, `migrate up` [K] | MIT [K] | `go:github.com/golang-migrate/migrate/v4`, `gh:golang-migrate/migrate` | Also supports Cassandra/ScyllaDB and MongoDB, so it is one of the few CLIs covering non-relational stores. [V] |
| Sqitch | SQL (deploy, revert, verify script per change) [K] | registry tables (`changes`, `events`) in a `sqitch` schema [K] | Y (`sqitch revert`) [K] | `sqitch deploy` [K] | pipeline | `sqitch deploy --to <change>`, seed, `sqitch deploy`; `sqitch verify` runs the verify scripts [K] | MIT [V] | `gh:sqitchers/sqitch`, `cpan:App-Sqitch` | Dependency-ordered changes rather than version numbers. Repo active, releases slow. [V] |
| goose CLI | both (SQL, or Go functions) [V] | history table `goose_db_version` [V] | Y (`down`, `down-to`) [V] | `goose up` [V] | both | `goose up-to <N-1>`, seed, `goose up` [V] | MIT [K] | `go:github.com/pressly/goose/v3` | PostgreSQL, MySQL, SQLite, SQL Server, ClickHouse, YDB, Vertica and more. [V] |
| grate | SQL folders (up, views, sprocs, run-once and run-always) [K] | history tables in a `grate` schema [K] | N (forward only) [K] | `grate --connectionstring=... --files=...` [K] | pipeline | Testcontainers [K] | MIT [V] | `gh:grate-devs/grate`, `nuget:grate` | Successor of RoundhousE. [V] |
| Bytebase | SQL, through a web console and API [K] | history kept in Bytebase's own store [K] | Y [K] | API / GitOps integration rather than one CLI [K] | pipeline (server) | n/a | Open core: free community edition, paid tiers [K] | `gh:bytebase/bytebase` | A review-and-approval platform; heavier than the CLIs above. [V repo active] |

State-based (declarative) tools compare a desired schema with the live database and generate the change instead of running versioned scripts: Atlas declarative mode, `sqldef` (`gh:sqldef/sqldef`), Skeema for MySQL (`gh:skeema/skeema`), SchemaHero for Kubernetes (`gh:schemahero/schemahero`). They do not keep a history of applied scripts and cannot express data transformations, so they do not fit the versioned-script model; list them only if the user asks for declarative schema management. [V repos active]

Zero-downtime PostgreSQL tools that run expand/contract migrations so old and new code work at the same time: `pgroll` (`gh:xataio/pgroll`, Apache-2.0) and `reshape` (`gh:fabianlindfors/reshape`, MIT, slow). Both keep their own migration history. [V repos active]

## 3. Relational SQL: tools per stack

| Stack | Tool | Scripts | Version detection & history | Down | Fixed apply command | Runs from | Test approach | License | Published at | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Java / Kotlin | `*` Flyway | both | history table | paid | `flyway migrate`, or Maven/Gradle plugin goal | both | Testcontainers; `Flyway.configure().target("N-1").load().migrate()`, seed, migrate to latest [K] | Community Apache-2.0; editions paid | `mvn:org.flywaydb:flyway-core` | See section 2. [V] |
| Java / Kotlin | Liquibase | DSL or SQL | history table | Y | `liquibase update` or Maven/Gradle plugin | both | Testcontainers; `update-count` / `update-to-tag`, seed, `update` [K] | **SA** (FSL) | `mvn:org.liquibase:liquibase-core` | See section 2. [V] |
| Kotlin | Exposed migration module | generates SQL scripts from table definitions for another tool to run [K] | none of its own [K] | n/a | n/a | n/a | n/a | Apache-2.0 [V] | `mvn:org.jetbrains.exposed:exposed-migration` | Pair with Flyway. Do not use `SchemaUtils.create`/auto-sync in production; it keeps no history. [K] |
| Python | `*` Alembic (SQLAlchemy) | code (Python files that call operations or raw SQL) [K] | version marker: `alembic_version` holds the current head revision(s) only [K] | Y | `alembic upgrade head` [K] | pipeline | pytest-alembic: built-in tests single head, upgrade, model matches DDL, up/down consistency; data tests through its runner [V] | MIT [V] | `pypi:alembic`, `pypi:pytest-alembic` | Revisions form a graph, not a number sequence; branches must be merged. [K] |
| Python (Django) | `*` Django migrations | code (operations, `RunPython`, `RunSQL`) [K] | history table `django_migrations` [K] | Y (migrate to an earlier name) [K] | `python manage.py migrate` [K] | pipeline | django-test-migrations: `Migrator.apply_initial_migration(...)`, seed through the old state, `apply_tested_migration(...)`, assert [V]; `makemigrations --check` for drift [K] | BSD-3-Clause [K]; django-test-migrations MIT [V] | `bundled`, `pypi:django-test-migrations` | [K] |
| Python | yoyo-migrations | both (SQL or Python steps) [K] | history and log tables (`_yoyo_migration`, `_yoyo_log`) [K] | Y [K] | `yoyo apply` [K] | pipeline | Testcontainers [K] | Apache-2.0 [S] | `pypi:yoyo-migrations` | slow: last release August 2024. [S] |
| Python | Piccolo migrations | code [K] | history table [K] | Y [K] | `piccolo migrations forwards all` [K] | pipeline | Testcontainers [K] | MIT [V] | `pypi:piccolo` | Only if the project uses the Piccolo ORM. [V repo active] |
| Node / TypeScript | `*` Prisma Migrate | SQL (generated, editable) [K] | history table `_prisma_migrations`; warns when an applied migration was edited [V] | N (down SQL is generated separately and run by hand) [V] | `prisma migrate deploy` [V] | pipeline (docs say it belongs in CI/CD) [V] | No "migrate to version" option for deploy [V]; tests apply a subset of migration folders to a Testcontainers database, seed, then `migrate deploy` [K] | Apache-2.0 [V] | `npm:prisma` | Uses an advisory lock during deploy. [V] |
| Node / TypeScript | Drizzle Kit | SQL (generated, editable) [K] | history table `__drizzle_migrations` [K] | N [K] | `drizzle-kit migrate`, or `migrate()` in code [K] | both | Testcontainers [K] | Apache-2.0 [V] | `npm:drizzle-kit` | [V repo active] |
| Node / TypeScript | Knex migrations | code [K] | history table `knex_migrations` plus lock table [K] | Y | `knex migrate:latest` [K] | both | `migrate:up` one at a time, seed, `migrate:latest` [K] | MIT [V] | `npm:knex` | [V repo active] |
| Node / TypeScript | TypeORM migrations | code [K] | history table `migrations` [K] | Y | `typeorm migration:run -d <datasource>` [K] | both | Testcontainers [K] | MIT [V] | `npm:typeorm` | [V repo active] |
| Node / TypeScript | MikroORM migrations | code [K] | history table `mikro_orm_migrations` [K] | Y | `mikro-orm migration:up` [K] | both | `migration:up --to <name>`, seed, `migration:up` [K] | MIT [V] | `npm:@mikro-orm/migrations` | [V repo active] |
| Node / TypeScript | Sequelize CLI / Umzug | code [K] | history table `SequelizeMeta` (Umzug storage) [K] | Y | `sequelize-cli db:migrate` [K] | both | Umzug `up({ to })`, seed, `up()` [K] | MIT [V] | `npm:sequelize-cli`, `npm:umzug` | Umzug is a generic runner and can drive non-SQL steps with a custom storage. [K] |
| Node / TypeScript | node-pg-migrate | code or SQL [K] | history table `pgmigrations` [K] | Y | `node-pg-migrate up` [K] | pipeline | `up <n>`, seed, `up` [K] | MIT [V] | `npm:node-pg-migrate` | PostgreSQL only. [V repo active] |
| Node / TypeScript | Kysely Migrator | code [K] | history table `kysely_migration` plus lock [K] | Y | `migrateToLatest()` called from a small script [K] | both | `migrateTo(name)`, seed, `migrateToLatest()` [K] | MIT [V] | `npm:kysely` | No CLI in core; projects add a script. [K] |
| Node / TypeScript | db-migrate | both [K] | history table `migrations` [K] | Y | `db-migrate up` [K] | pipeline | Testcontainers [K] | MIT [S] | `npm:db-migrate` | [V repo active] |
| Node / TypeScript | graphile-migrate | SQL (current.sql committed into numbered files) [K] | history table in a `graphile_migrate` schema [K] | N [K] | `graphile-migrate migrate` [K] | pipeline | Testcontainers [K] | MIT [V] | `npm:graphile-migrate` | PostgreSQL only. [V repo active] |
| .NET | `*` EF Core migrations | code (C# migration classes generating SQL) | history table `__EFMigrationsHistory` [V] | Y (target an earlier migration) [V] | migration bundle: `dotnet ef migrations bundle` in CI, then `./efbundle --connection ...` at deploy; or `dotnet ef migrations script --idempotent` for reviewed SQL [V] | pipeline (one-shot job recommended; `MigrateAsync()` at startup possible with EF 9+ locking) [V] | Testcontainers; `IMigrator.MigrateAsync("<N-1 name>")`, seed, `MigrateAsync()`; `dotnet ef migrations has-pending-model-changes` in CI [V] | MIT [V] | `nuget:Microsoft.EntityFrameworkCore.Design`, `nuget:dotnet-ef` | Docs say not to make every replica migrate from its entrypoint. SQLite cannot generate idempotent scripts. [V] |
| .NET | DbUp | SQL (embedded scripts) [K] | history table `SchemaVersions` [K] | N [K] | the project's own small console app that calls `PerformUpgrade()` [K] | both | Testcontainers; run a subset of scripts, seed, run all [K] | MIT [V] | `nuget:dbup-core` | slow: last push February 2026. [V] |
| .NET | FluentMigrator | code [K] | history table `VersionInfo` [K] | Y | `dotnet fm migrate` or runner in code [K] | both | `MigrateUp(<version>)`, seed, `MigrateUp()` [K] | Apache-2.0 [V] | `nuget:FluentMigrator.Runner`, `nuget:FluentMigrator.DotNet.Cli` | [V repo active] |
| .NET | grate | SQL | history tables | N | `grate ...` | pipeline | Testcontainers | MIT | `nuget:grate` | See section 2. [V] |
| .NET | Evolve | SQL [K] | history table `changelog` [K] | N [K] | `evolve migrate` [K] | both | Testcontainers [K] | MIT [V] | `nuget:Evolve` | slow: last push September 2025. [V] |
| Go | `*` golang-migrate | SQL | version marker (current version + dirty flag) [K] | Y | `migrate ... up` | both | `goto <N-1>`, seed, `up` | MIT | `go:github.com/golang-migrate/migrate/v4` | [V] |
| Go | goose | both | history table | Y | `goose up` | both | `up-to <N-1>`, seed, `up` | MIT | `go:github.com/pressly/goose/v3` | [V] |
| Go | Atlas | SQL | history table | Y | `atlas migrate apply` | pipeline | see section 2 | Apache-2.0 / Pro **paid** | `gh:ariga/atlas` | Default migration engine for the `ent` ORM. [K] |
| Go | tern | SQL [K] | version marker table [K] | Y [K] | `tern migrate` [K] | pipeline | `tern migrate --destination <n>` [K] | MIT [V] | `go:github.com/jackc/tern/v2` | PostgreSQL only. [V repo active] |
| Go | GORM `AutoMigrate` | none (syncs structs to tables) | none | N | n/a | startup | n/a | MIT [K] | `go:gorm.io/gorm` | Not a versioned tool: no history, no data steps, never drops. Do not propose for production; use golang-migrate, goose or Atlas instead. [K] |
| Ruby | `*` Active Record migrations (Rails) | code (Ruby DSL or SQL via `execute`) [K] | history table `schema_migrations` [K] | Y (`db:rollback`) [K] | `bin/rails db:migrate` [K] | pipeline (release phase) [K] | `bin/rails db:migrate VERSION=<N-1>`, seed with SQL, `db:migrate`; `strong_migrations` checks unsafe operations [K] | MIT [V] | `bundled` (`gem:activerecord`), `gem:strong_migrations` | [K] |
| Ruby | Sequel migrations | code [K] | history table `schema_migrations` or `schema_info` [K] | Y [K] | `sequel -m <dir> <url>` [K] | pipeline | `-M <version>`, seed, migrate [K] | MIT [V] | `gem:sequel` | [V repo active] |
| PHP | `*` Laravel migrations | code [K] | history table `migrations` [K] | Y (`migrate:rollback`) [K] | `php artisan migrate --force` [K] | pipeline | `RefreshDatabase` runs all; old-shape data tests use `migrate --path` on a subset, seed, `migrate` [K] | MIT [V] | `bundled` | [K] |
| PHP | Doctrine Migrations (Symfony) | code [K] | history table `doctrine_migration_versions` [K] | Y [K] | `bin/console doctrine:migrations:migrate --no-interaction` [K] | pipeline | `migrate <version>`, seed, `migrate` [K] | MIT [V] | `packagist:doctrine/migrations` | [V repo active] |
| PHP | Phinx | code [K] | history table `phinxlog` [K] | Y [K] | `phinx migrate -e <env>` [K] | pipeline | `migrate -t <version>`, seed, `migrate` [K] | MIT [V] | `packagist:robmorgan/phinx` | slow: last push July 2026. [V] |
| Rust | `*` sqlx migrations | SQL [V] | history table `_sqlx_migrations` [K] | Y (reversible migrations, `sqlx migrate revert`) [V] | `sqlx migrate run` or `sqlx::migrate!()` at startup [V] | both | `#[sqlx::test(migrations = ...)]` runs migrations on a test database [K]; old-shape tests apply a subset folder, seed, run all [K] | Apache-2.0 / MIT [V] | `crates:sqlx-cli`, `crates:sqlx` | Repository moved to `transact-rs/sqlx`. [V] |
| Rust | Diesel migrations | SQL (`up.sql` / `down.sql`) [K] | history table `__diesel_schema_migrations` [K] | Y [K] | `diesel migration run`, or `embed_migrations!` + `run_pending_migrations` at startup [K] | both | Testcontainers [K] | Apache-2.0 / MIT [V] | `crates:diesel_cli`, `crates:diesel_migrations` | [V repo active] |
| Rust | SeaORM migrations | code [K] | history table `seaql_migrations` [K] | Y [K] | `sea-orm-cli migrate up` [K] | both | `Migrator::up(db, Some(n))`, seed, `up(db, None)` [K] | Apache-2.0 / MIT [V] | `crates:sea-orm-migration`, `crates:sea-orm-cli` | [V repo active] |
| Rust | refinery | both [K] | history table `refinery_schema_history` [K] | N [K] | `refinery migrate` or embedded runner [K] | both | `set_target(Target::Version(n))`, seed, run [K] | MIT [V] | `crates:refinery` | [V repo active] |
| C / C++ (server or CLI) | no in-language standard; use a CLI from section 2 (Flyway, Liquibase, dbmate, golang-migrate, Sqitch, goose) [K] | SQL | per CLI | per CLI | per CLI | pipeline | per CLI with Testcontainers or a Docker database in CI [K] | per CLI | per CLI | The C++ ORM ODB (CodeSynthesis) generates schema migration statements and keeps a `schema_version` table; it is GPL or commercial dual-licensed. [S] |
| Swift (server, Vapor) | `*` Fluent migrations | code [K] | history table `_fluent_migrations` [K] | Y (`migrate --revert`) [K] | `swift run App migrate --yes` [K] | both (`autoMigrate()` at startup) [K] | Testcontainers or a Docker database; XCTVapor `app.autoMigrate()` [K] | MIT [V] | `spm:vapor/fluent-kit` | [V repo active] |
| Dart (server) | no dominant tool; drift (with its PostgreSQL backend) or a CLI from section 2 [K] | code (drift) or SQL (CLI) | drift: schema version number [K] | N | per tool | startup (drift) or pipeline (CLI) | drift `SchemaVerifier` (section 7) [K] | MIT [V] | `pub:drift`, `pub:drift_postgres` | Most Dart projects are Flutter apps; see section 7. [K] |
| Elixir | `*` Ecto migrations | code [K] | history table `schema_migrations` [K] | Y [K] | `mix ecto.migrate`; in releases `bin/<app> eval "<App>.Release.migrate"` [K] | pipeline | `Ecto.Migrator.run(repo, :up, to: <version>)`, seed, run all [K] | Apache-2.0 [V] | `hex:ecto_sql` | [V repo active] |

## 4. Non-relational server-side stores

### 4.1 Document databases

| Data kind | Stack | Tool | Scripts | Version detection & history | Down | Fixed apply command | Runs from | Test approach | License | Published at | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| MongoDB | Node, or any stack from the pipeline | `*` migrate-mongo | code (JS `up`/`down`) [K] | history collection `changelog` [K] | Y [K] | `migrate-mongo up` [K] | pipeline | Testcontainers or `mongodb-memory-server`: run `up` for scripts before N, seed old documents, run `up`, assert [K] | MIT [V] | `npm:migrate-mongo` | Last release December 2025. [S] |
| MongoDB | any (CLI) | Flyway native connector | DSL (JSON migrations) or JS (needs `mongosh`); one type per project [V] | history collection (Flyway schema history) [K] | paid (undo is Teams) | `flyway migrate` [V] | pipeline | as for Flyway | Community Apache-2.0 | `gh:flyway/flyway` | JS migrations cannot use transactions; no dry-run for MongoDB. [V] |
| MongoDB | any (CLI) | golang-migrate (mongodb driver) | DSL (JSON database commands) [K] | version marker collection [K] | Y | `migrate -database mongodb://... up` | pipeline | as for golang-migrate | MIT | `go:github.com/golang-migrate/migrate/v4` | [V driver listed] |
| MongoDB | JVM | Liquibase MongoDB extension | DSL (changelog with Mongo change types) [S] | history collection [K] | Y [K] | `liquibase update` | both | as for Liquibase | Open-source extension supports a limited set of change types; the full extension is **paid** (Liquibase Secure) [S] | `gh:liquibase/liquibase-mongodb` | [V repo active] |
| MongoDB, DynamoDB, Couchbase, SQL, and non-transactional targets | Java / Kotlin | Flamingock | code (Java/Kotlin change classes) or DSL (YAML templates) [V] | audit store (MongoDB, SQL, DynamoDB or Couchbase) records what ran, when, by whom [V] | Y (rollback methods) [S] | runs inside the application [V]; a CLI is documented but not described on the pages read [V] | startup | Testcontainers; start with an audit store holding the old state [K] | Apache-2.0 community edition; cloud edition announced "coming soon" [V] | `mvn:io.flamingock:flamingock-core`, `gh:flamingock/flamingock-java` | Successor of Mongock by the same authors. Can target S3, Kafka and other systems through a generic non-transactional target system. [V] |
| MongoDB | .NET | Mongo.Migration | code; each document carries a version field and is upgraded when read or at startup [K] | per-document version field [K] | Y [K] | in code [K] | startup / read time | unit tests on document upgraders [K] | MIT [V] | `nuget:Mongo.Migration` | A lazy-migration library, not a script runner. [V repo active] |
| Couchbase | Java / Kotlin | Flamingock | code or YAML | audit store in Couchbase | Y | in the application | startup | Testcontainers | Apache-2.0 | `mvn:io.flamingock:flamingock-core` | [V] |
| Couchbase indexes | any (CLI) | couchbase-index-manager | declarative index definitions [K] | none (compares desired and actual) [K] | n/a | `couchbase-index-manager sync <dir>` [K] | pipeline | n/a | Apache-2.0 [V] | `gh:brantburnett/couchbase-index-manager` | Indexes only, not data. [V repo active] |
| Firestore | any | none maintained | | | | | | Firebase emulator plus a hand-written runner | | | `fireway` is archived [V]; its forks are small and inactive [S]. Teams store a schema version in each document and upgrade on read, or run a one-off Admin SDK script and record it in a `migrations` collection. [K] |
| Cosmos DB | any (CLI) | Flyway native connector | JS or JSON [V] | Flyway history [K] | paid | `flyway migrate` | pipeline | as for Flyway | Community Apache-2.0 | `gh:flyway/flyway` | **Preview**: needs `FLYWAY_NATIVE_CONNECTORS=true` on Redgate editions; JS needs `mongosh` [V]. Otherwise teams use a version field with lazy upgrade, or the change feed to rewrite documents. [K] |

### 4.2 Key-value and wide-column

| Data kind | Stack | Tool | Scripts | Version detection & history | Down | Fixed apply command | Runs from | Test approach | License | Published at | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Cassandra, ScyllaDB | any (CLI) | `*` golang-migrate (cassandra driver) | CQL files [V] | version marker table in the keyspace [K] | Y | `migrate -database cassandra://... up` | pipeline | Testcontainers Cassandra or ScyllaDB; `goto <N-1>`, seed, `up` [K] | MIT | `go:github.com/golang-migrate/migrate/v4` | Supports ScyllaDB too. [V] |
| Cassandra | any (CLI) | Flyway native connector | CQL files (configure the `.cql` suffix) [S] | history table `flyway_schema_history` in a keyspace [V] | paid | `flyway migrate` | pipeline | as for Flyway | Community Apache-2.0 | `gh:flyway/flyway` | **Preview**. [V] |
| Cassandra | JVM | Liquibase Cassandra extension | DSL or CQL [K] | history table [K] | Y [K] | `liquibase update` | both | as for Liquibase | **SA** (follows Liquibase licensing) [K] | `gh:liquibase/liquibase-cassandra` | [V repo active] |
| Cassandra | Java | cassandra-migration (Contrast Security) | CQL and Java [K] | history table [K] | N [K] | library call at startup [K] | startup | Testcontainers [K] | Apache-2.0 [V] | `gh:Contrast-Security-OSS/cassandra-migration` | slow. [V] |
| Cassandra | Python | cql-track | CQL files with `-- @down` sections and checksums [S] | history table [S] | Y [S] | `cql-track` CLI [S] | pipeline | Testcontainers [K] | MIT [V] | `pypi:cql-track` | Young project, one maintainer. [S] |
| DynamoDB | Java / Kotlin | Flamingock | code or YAML | audit store in DynamoDB | Y | in the application | startup | Testcontainers with LocalStack or DynamoDB Local [K] | Apache-2.0 | `mvn:io.flamingock:flamingock-core` | [V] |
| DynamoDB | Node | OneTable migrate / CLI | code (`up`/`down`) [S] | history stored as items in the table [S] | Y [S] | `onetable migrate` [S] | pipeline | DynamoDB Local [K] | MIT [S] | `npm:onetable-cli` | Only for projects using the OneTable library; last CLI release September 2024 (slow). [S] |
| DynamoDB | other stacks | none standard | | | | | | | | | Table, GSI and TTL definitions go in infrastructure as code (Terraform, CloudFormation, CDK). Item changes: a version attribute per item with upgrade on read, and a backfill script (parallel `Scan` + conditional writes) recorded in a history item or in the app's SQL history table. [K] |
| Redis | any | none standard | | | | | | | | | As a cache: not migrated. As a store: a runner stores the data version in a key (for example `schema:version`) and applies numbered Lua or code steps; keys often carry a version prefix. [K] |

### 4.3 Search indexes

| Data kind | Stack | Tool | Scripts | Version detection & history | Down | Fixed apply command | Runs from | Test approach | License | Published at | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Elasticsearch, OpenSearch | Java / Kotlin | `*` elasticsearch-evolution | DSL (`.http` request files named `V1.0__desc.http`) or Java [V] | history index `es_evolution`; checksum validation on migrate [V] | N [K] | runs from the Spring Boot starter at startup, or from the core library in a small Java main [V] | startup (pipeline through a small main) | Testcontainers Elasticsearch/OpenSearch: apply scripts before N, index old documents, run all, assert mappings and documents [K] | Apache-2.0 [V] | `mvn:com.senacor.elasticsearch.evolution:spring-boot-starter-elasticsearch-evolution`, `gh:senacor/elasticsearch-evolution` | OpenSearch 2.x and 3.x supported. No CLI. [V] |
| Elasticsearch, OpenSearch | any | none standard | | | | | | | | | Usual pattern: the application reads and writes through an alias; a mapping change creates `index-vN`, reindexes from the old index (or from the source database), then swaps the alias atomically [S]. Index templates and ILM policies often live in infrastructure as code. [K] |

### 4.4 Graph databases

| Data kind | Stack | Tool | Scripts | Version detection & history | Down | Fixed apply command | Runs from | Test approach | License | Published at | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Neo4j | any (CLI), JVM | `*` neo4j-migrations | Cypher files, or Java classes [V] | history stored as a chain of migration nodes in the graph [V] | N [K] | `neo4j-migrations apply` [K] | both (CLI native binaries for macOS, Linux, Windows without a JVM; Maven plugin; Spring Boot starter; Quarkus extension) [V] | Testcontainers Neo4j; apply up to a version, create old nodes, apply all, assert [K] | Apache-2.0 [V] | `gh:michael-simons/neo4j-migrations`, `mvn:eu.michael-simons.neo4j:neo4j-migrations` | Neo4j Labs project maintained by the driver and SDN/OGM team; supports Neo4j 3.5 through the 2026 releases. [V] |

## 5. Data warehouses and lakehouse tables

| Data kind | Stack | Tool | Scripts | Version detection & history | Down | Fixed apply command | Runs from | Test approach | License | Published at | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Snowflake | any (CLI) | `*` schemachange | SQL (`V<version>__desc.sql` versioned, `R__` repeatable, `A__` always) [V] | history table `METADATA.SCHEMACHANGE.CHANGE_HISTORY` [V] | N [V] | `schemachange deploy` [V] | pipeline | a cloned (zero-copy) database at the old version, run deploy, assert [K] | Apache-2.0; community tool under Snowflake-Labs, "not an official Snowflake offering", no support [V] | `pypi:schemachange`, `gh:Snowflake-Labs/schemachange` | [V] |
| Snowflake, BigQuery, Databricks, Redshift, ClickHouse | any (CLI) | Flyway | SQL | history table | paid | `flyway migrate` | pipeline | as for Flyway | Community Apache-2.0 | `gh:flyway/flyway` | All supported in Community. [V] |
| Snowflake, BigQuery, Databricks, Redshift | any (CLI) | Liquibase extensions | DSL or SQL | history table | Y | `liquibase update` | pipeline | as for Liquibase | **SA** | `mvn:org.liquibase.ext:*` | [K] |
| BigQuery, ClickHouse, Spanner | any (CLI) | dbmate | SQL | history table | Y | `dbmate migrate` | pipeline | as for dbmate | MIT | `gh:amacneil/dbmate` | [V] |
| Snowflake, Databricks, Redshift, ClickHouse, Spanner | any (CLI) | Atlas | SQL | history table | Y | `atlas migrate apply` | pipeline | paid testing | **paid** for these databases | `gh:ariga/atlas` | [V] |
| Modelled warehouse tables | SQL + Python | dbt, SQLMesh | SQL models (declarative) | none of the versioned kind; dbt rebuilds models each run, incremental models use `on_schema_change` [K]; SQLMesh plans changes against versioned environments [K] | n/a | `dbt build`; `sqlmesh plan` / `sqlmesh run` [K] | pipeline | dbt tests and unit tests on models [K] | Apache-2.0 [V] | `pypi:dbt-core`, `pypi:sqlmesh` | Not migration tools. Use them for derived tables, and a versioned tool only for tables that hold source data. [K] |
| Iceberg tables | Spark, Trino, Flink, PyIceberg | built-in schema and partition evolution | SQL `ALTER TABLE` (run by any of the SQL tools above, or a job) | table metadata keeps every schema version [V] | n/a (time travel reads old snapshots) [K] | the job or tool that runs the `ALTER TABLE` | pipeline | write files with the old schema into a local catalog, alter, read back [K] | Apache-2.0 | `bundled` | Add, drop, rename, reorder and type widening are metadata-only; no data files are rewritten; partition evolution keeps old files in the old layout. [V] |
| Delta Lake tables | Spark, Databricks, delta-rs | built-in schema evolution | `ALTER TABLE`, `mergeSchema` on write; rename and drop need column mapping [K] | transaction log keeps every version [K] | n/a (time travel) [K] | the job that runs the change | pipeline | local Spark or delta-rs test [K] | Apache-2.0 [V repo] | `bundled` | [K] |

Data rewrites in lakehouse tables (backfilling a new column, splitting a field) are batch jobs. No standard runner records which rewrite jobs ran; teams record them in the orchestrator (Airflow, Dagster) or in a small history table. [K]

## 6. Files in object storage and on file systems

There is **no established generic tool** that keeps versioned migration scripts for files in S3, GCS or Azure Blob (or on a file system), detects the current data version and records history. Searches turned up only bucket-to-bucket copy tools and small single-purpose packages. [S] Teams use one of the patterns below, usually with a small runner they write themselves.

| Pattern | How the version is detected | How history is recorded | Runs from | Test approach | When it fits |
|---|---|---|---|---|---|
| A. Small custom runner with numbered scripts in the repo | a marker object (for example `_meta/schema-version.json`) or a manifest object in the bucket/prefix; a `VERSION` file in a data directory | an appended history object or file, or a row in the application's SQL database | pipeline (a fixed command such as `<app> migrate-files`) | MinIO, LocalStack, Azurite or the GCS emulator in Testcontainers: upload old-format files and old metadata, run the runner, read back and assert [K] | Any stack; few, well-defined prefixes. [K] |
| B. Code migrations in the relational migration tool the project already uses | the relational tool's history table | the same history table | pipeline or startup | the relational tool's test plus an object-storage emulator [K] | The project already has a SQL database. Flyway Java migrations, Liquibase `customChange`, Alembic and Django `RunPython`, Knex/Umzug code migrations, goose Go migrations, Rails migrations can all call the storage SDK. [K] |
| C. Flamingock non-transactional target | Flamingock audit store | Flamingock audit store | startup | Testcontainers with LocalStack/MinIO [K] | Java/Kotlin projects; the closest thing to a generic tool. [V] |
| D. Version in each file, upgrade on read (lazy migration) | a `schema_version` field in the file content, or object user metadata (`x-amz-meta-schema-version` on S3, metadata on GCS and Azure Blob) [K] | none centrally; optional write-back and a background backfill job | read time in the application, plus a job | unit tests: one fixture file per old version, read through the upgrader, assert the new shape [K] | Large or unbounded sets of files; event payloads; user uploads. [K] |
| E. Table format with built-in evolution | table metadata | table metadata | pipeline | section 5 | Tabular data (Parquet) that can move into Iceberg, Delta or Hudi tables. [V] |
| F. Self-describing formats with compatibility rules | schema embedded in each file (Avro, Parquet) or a schema ID | schema registry or repo | pipeline (compatibility check) | compatibility check in CI | Files written by many producers over time; readers resolve old schemas. [K] |

Points that matter when files are migrated:

- Object storage writes are not transactional with anything else. Every step must be idempotent and resumable (skip objects already at the new version), and the runner records a step as done only after the last object is processed. [K]
- S3 object metadata cannot be edited in place: changing it means copying the object onto itself with replaced metadata. For millions of objects teams use S3 Batch Operations driven by an S3 Inventory manifest. Azure Blob can replace metadata without rewriting content; GCS can patch metadata. [K]
- With versioning enabled on the bucket, the rewrite keeps the old object version, which gives a way back. [K]
- Files on a server file system follow the same patterns. Server applications that own a data directory usually ship their own fixed upgrade command or upgrade at startup (for example Nextcloud `occ upgrade`), with a version file in the data directory. [K]

## 7. On-device databases and files (the app migrates itself)

These stores live on the user's phone, browser or desktop. The migration code ships inside the app and runs when the app opens the store after an update, so the deploy pipeline cannot apply it. CI can only run the migration test. Users can skip releases, so every old version still in the field must upgrade to the latest, and downgrades are usually not supported. [V]

| Data kind | Stack | Tool | Scripts | Version detection & history | Down | Apply | Test approach | License | Published at | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| SQLite on Android / KMP | Kotlin | `*` Room | code (`Migration(from, to)`) or generated (`@AutoMigration`, with `AutoMigrationSpec` for renames and deletes) [V] | version marker: the `version` in `@Database` stored in the SQLite file (`PRAGMA user_version`) [K]; schema JSON per version exported to the repo [V] | N (`fallbackToDestructiveMigrationOnDowngrade` deletes data) [V] | when the database is opened [V] | `MigrationTestHelper`: `createDatabase(N-1)`, insert rows with SQL, `runMigrationsAndValidate(N, ...)`, assert data; plus a "migrate all" test from version 1 [V] | Apache-2.0 [K] | `mvn:androidx.room3:room3-runtime`, `mvn:androidx.room3:room3-testing` | Current major uses the `androidx.room3` group. The Room docs title is "Test migrations". [V] |
| SQLite on Android / KMP / iOS | Kotlin Multiplatform | SQLDelight | SQL (`<from-version>.sqm` files) [V] | version marker (`user_version`) [K] | N | when the driver opens the database [K] | `verifySqlDelightMigration` Gradle task (part of `check`) applies all migrations to stored `<version>.db` schema files and checks the result matches the latest schema [V]; data tests insert into an old schema in a JVM test [K] | Apache-2.0 [V] | `mvn:app.cash.sqldelight:*`, `gh:sqldelight/sqldelight` | [V] |
| Core Data store | iOS / macOS | `*` Core Data model versions | lightweight (inferred) migration, mapping models, staged migration (`NSStagedMigrationManager`, recent OS versions) [K] | model version hash stored in the store metadata [K] | N | when the persistent store is loaded [K] | XCTest with a fixture store file saved from each old model version; load with the current model, assert [K] | `bundled` (Apple) | `bundled` | [K] |
| SwiftData store | iOS / macOS | `*` SwiftData `VersionedSchema` + `SchemaMigrationPlan` | lightweight or custom stages (`willMigrate` / `didMigrate`) [S] | schema version checksums in the store [S] | N | when the `ModelContainer` is created [S] | XCTest: create a container with the old `VersionedSchema`, insert, reopen with the migration plan, assert [K] | `bundled` (Apple) | `bundled` | [S] |
| SQLite on iOS / macOS | Swift | GRDB `DatabaseMigrator` | code (registered named migrations, SQL inside) [V] | history table `grdb_migrations` [K] | N | `migrator.migrate(dbQueue)` at app start [V] | `migrator.migrate(db, upTo: "vN-1")`, insert, `migrator.migrate(db)`, assert [V] | MIT [V] | `spm:groue/GRDB.swift` | `eraseDatabaseOnSchemaChange` is for development only. [V] |
| SQLite on iOS / macOS | Swift | SQLite.swift | manual: read and set `PRAGMA user_version` [K] | version marker | N | app code at start | fixture database per old version [K] | MIT [V] | `spm:stephencelis/SQLite.swift` | No migration runner of its own. [K] |
| SQLite in Flutter / Dart | Dart | `*` drift | code (`MigrationStrategy`, step-by-step migrations generated by `make-migrations`) [V] | version marker (`schemaVersion`, stored as `user_version`) [K] | N | when the database opens [K] | `drift_dev schema dump` per version, `schema generate` creates old schema classes; `SchemaVerifier.startAt(N-1)`, insert with versioned data classes, `migrateAndValidate(db, N)`; `make-migrations` generates the tests [V] | MIT [V] | `pub:drift`, `pub:drift_dev` | [V] |
| SQLite in Flutter | Dart | sqflite | code in `onUpgrade(db, oldVersion, newVersion)` [K] | version marker (`user_version`) [K] | Y (`onDowngrade`) [K] | `openDatabase(version: n, ...)` [K] | `sqflite_common_ffi` in unit tests: open at the old version, insert, reopen at the new version [K] | BSD-2-Clause [V] | `pub:sqflite` | [V repo active] |
| Realm | Swift, Kotlin, Dart, JS | Realm `schemaVersion` + migration block | code [K] | schema version in the Realm file [K] | N | when the Realm is opened [K] | fixture Realm file per old version [K] | Apache-2.0 [V] | `spm:realm/realm-swift` etc. | MongoDB deprecated the Atlas Device SDKs (Realm) in September 2024 with end of life on 30 September 2025; community branches without sync remain [S]. Do not propose for new projects. |
| IndexedDB in the browser | JS / TS | `*` Dexie | `db.version(n).stores({...}).upgrade(tx => ...)` [V] | IndexedDB database version number (`onupgradeneeded`) [V] | N | `db.open()` in the page [V] | `fake-indexeddb` in unit tests or a real browser in Playwright: open the database with the old version declaration, add records, open with the new one, assert [K] | Apache-2.0 [V] | `npm:dexie` | A failed upgrade step rolls back the whole upgrade. [V] |
| IndexedDB in the browser | JS / TS | native API or `idb` | code in `onupgradeneeded` switching on `oldVersion` [K] | IndexedDB version number [K] | N | `indexedDB.open(name, version)` | as above | ISC [K] | `npm:idb` | [K] |
| SQLite in Electron / Node desktop | JS / TS | Drizzle `migrate()`, Kysely Migrator or Umzug with `better-sqlite3` | SQL or code | history table | N | at app start [K] | Node test opens a fixture database from an old release, runs the migrator, asserts [K] | MIT / Apache-2.0 | see section 3 | Same tools as the server, run on the device. [K] |
| SQLite in Tauri apps | Rust / JS | `tauri-plugin-sql` migrations | SQL in Rust `Migration { version, description, sql, kind }` [V] | history table kept by the plugin [K] | Y (`MigrationKind::Down`) [V] | when the plugin loads the database [K] | Rust test with a fixture database [K] | Apache-2.0 / MIT [V] | `crates:tauri-plugin-sql` | [V] |
| SQLite in Rust desktop / CLI | Rust | rusqlite_migration, refinery | SQL / code | rusqlite_migration uses `PRAGMA user_version` [S]; refinery uses a history table [K] | rusqlite_migration Y [K] | at app start | `to_version(n)`, insert, `to_latest()` [K] | Apache-2.0 / MIT [K] | `crates:rusqlite_migration`, `crates:refinery` | [S] |
| SQLite in .NET desktop / MAUI | C# | EF Core with `Database.MigrateAsync()` | code | history table | Y | at app start [V] | as for EF Core, with a SQLite file [K] | MIT | `nuget:Microsoft.EntityFrameworkCore.Sqlite` | SQLite migration locks can be left behind if the process is killed. [V] |
| SQLite in C / C++ desktop or embedded | C / C++ | none standard | numbered SQL scripts embedded in the binary [S] | `PRAGMA user_version` read at start [S] | N | app code at start: run every script above the stored version in a transaction and set `user_version` in the same transaction [S] | GoogleTest/Catch2 test with a fixture database per old version [K] | n/a | n/a | Qt, SOCI and sqlite_orm have no versioned migration runner [K]. ODB generates migrations (GPL or commercial) [S]. |
| Settings and document files the app writes | any | none standard | upgrader functions keyed by a `version` field in the file [K] | version field in the file | N | when the app reads the file [K] | fixture file per old version, read, assert [K] | n/a | n/a | [K] |

## 8. Message and event schemas

Messages already written to Kafka (or another log) are **not migrated**. Producers and consumers agree through compatibility rules checked when a new schema is registered, and old messages stay as written; consumers resolve them at read time (Avro fills missing fields with defaults). [V]

| Data kind | Tool | What it does | Fixed command in CI | License | Published at | Notes |
|---|---|---|---|---|---|---|
| Kafka topics with Confluent Schema Registry (Avro, Protobuf, JSON Schema) | Schema Registry compatibility levels: `BACKWARD` (default), `FORWARD`, `FULL`, their `_TRANSITIVE` forms, `NONE` [V] | rejects a new schema that breaks the chosen rule | Schema Registry Maven plugin `test-compatibility` goal against the target registry [V] | Confluent Community License for Schema Registry [K] | `mvn:io.confluent:kafka-schema-registry-maven-plugin` | Upgrade order depends on the level: `BACKWARD` upgrade consumers first, `FORWARD` producers first, `FULL` either. [V] |
| Protobuf contracts (any transport) | `buf breaking` | compares `.proto` files with the last release and fails on breaking changes [K] | `buf breaking --against <ref>` [K] | Apache-2.0 [K] | `gh:bufbuild/buf` | [K] |
| Topic configuration, partitions, ACLs | infrastructure as code (Terraform providers for Kafka or Confluent) [K] | declares topics and ACLs | `terraform apply` | per provider | per provider | `kafka-gitops` and `julie` are dormant (section 10). [V] |
| Event-sourced streams | framework upcasters (for example Axon upcasters) [K] | convert old event versions when read | n/a | per framework | per framework | Or copy-and-transform into a new stream, then switch readers. [K] |

## 9. Config files and secrets

Not migrated with data migration tools. [K]

- Config files in the repository change together with the code in the same commit; there is no deployed data to migrate.
- Per-environment config belongs to infrastructure as code or GitOps (Terraform, Helm values, Kubernetes ConfigMaps) and is applied by those tools.
- Config that users or admins edit at run time and that is stored in the database is database data: migrate it with the database's tool.
- Config files on the user's device are covered by the last row of section 7.
- Secrets are rotated and provisioned through the secret store (Vault, cloud secret managers) and IaC. Migration scripts must not contain secret values, because the scripts live in the repository.

## 10. Testing migrations

### 10.1 Names used in industry

- **Migration test** is the most common name: Room's docs section is "Test migrations", drift's is "Testing migrations", pytest-alembic calls its suite migration tests. [V]
- **Schema migration test** and **database migration test** are used for server databases. [K]
- **Upgrade test** (or "app upgrade test") is used for mobile and desktop apps and for installed products, where the test installs or opens data from an old release and upgrades it. [K]
- **Data migration test** is ambiguous: it often means testing a one-off move between platforms (ETL). Avoid it for this test. [K]
- Related checks: **schema drift check** (the code's model matches what the migrations produce: Django `makemigrations --check`, EF Core `has-pending-model-changes`, pytest-alembic `model_definitions_match_ddl`, Room schema validation) [V]; **up/down (round-trip) test** (`up_down_consistency` in pytest-alembic) [V]; **migration rehearsal** (running the migrations against a copy or snapshot of production before release). [K]

### 10.2 The shape of the test

The test follows the same steps on every stack: bring a throwaway target to version N-1 using the tool's own "migrate to version" option (or by applying only the older scripts), insert data in the old shape with raw statements (not with the current model classes, which expect the new shape), run the same apply command used in deployment, then assert the version recorded by the tool, the new shape, and that the inserted data survived with the expected transformations. A second test runs every migration from the first version on an empty target and compares the result with the current schema. [V for Room and drift; K elsewhere]

### 10.3 Per tool

| Tool or stack | Throwaway target | Move to the old version | Built-in helper |
|---|---|---|---|
| Flyway | Testcontainers database | `target` setting / `-target=` [K] | none; JUnit + Testcontainers [K] |
| Liquibase | Testcontainers database | `update-count`, `update-to-tag` [K] | `update-testing-rollback` for rollback [K] |
| Atlas | dev database (Docker) | `migrate apply <amount>` [K] | `atlas migrate test` (**paid**) [V] |
| golang-migrate, goose, dbmate, Sqitch | Testcontainers or a CI service container | `goto`, `up-to`, step-by-step files, `deploy --to` [V for goose; K for others] | none [K] |
| Alembic | Testcontainers or a CI service container | `upgrade <rev>` | pytest-alembic built-in tests and `alembic_runner` for data tests [V] |
| Django | test database | `migrate <app> <name>` | django-test-migrations `Migrator` / `MigratorTestCase` [V] |
| Rails | test database | `db:migrate VERSION=` [K] | none standard [K] |
| Laravel, Doctrine, Phinx | test database | `--path` subset, `migrate <version>`, `-t <version>` [K] | none standard [K] |
| Prisma | Testcontainers | apply a copy of the older migration folders [K] | none; `prisma migrate diff --exit-code` for drift [K] |
| EF Core | Testcontainers (`Testcontainers.MsSql`, `.PostgreSql`) | `IMigrator.MigrateAsync("<name>")` [V] | `has-pending-model-changes` [V] |
| sqlx, Diesel, SeaORM, refinery | Testcontainers (`testcontainers-rs`) | subset folder, `up(db, Some(n))`, `set_target` [K] | `#[sqlx::test]` [K] |
| Ecto | test database | `Ecto.Migrator.run(..., to: v)` [K] | none [K] |
| MongoDB tools | Testcontainers MongoDB, `mongodb-memory-server` | run scripts before N [K] | none [K] |
| elasticsearch-evolution, neo4j-migrations | Testcontainers Elasticsearch/OpenSearch, Neo4j | scripts before N in a separate location [K] | none [K] |
| Room | instrumented or Robolectric test | `MigrationTestHelper.createDatabase(N-1)` [V] | `MigrationTestHelper` [V] |
| SQLDelight | JVM test | stored `<version>.db` files [V] | `verifySqlDelightMigration` [V] |
| drift | Dart unit test | `SchemaVerifier.startAt(N-1)` [V] | `SchemaVerifier`, generated tests [V] |
| GRDB | XCTest | `migrate(db, upTo:)` [V] | none [K] |
| Core Data, SwiftData, Realm, C++ SQLite | XCTest / GoogleTest | fixture store file saved from each old release, kept in the repo [K] | none [K] |
| Dexie / IndexedDB | `fake-indexeddb` or Playwright | open with the old version declaration [K] | none [K] |
| Files in object storage | MinIO, LocalStack, Azurite, GCS emulator in Testcontainers | upload fixture files and metadata of the old version [K] | none [K] |

Testcontainers is maintained for Java, Python, .NET, Node, Go, Rust and Ruby. [V]

## 11. Running in CI and deployment

- **Pipeline (a one-shot job) is the default for server databases.** EF Core's docs recommend a migration bundle built in CI and run as a one-shot deployment job, and warn against every application replica migrating from its entrypoint [V]. Prisma's docs say `migrate deploy` belongs in the CI/CD pipeline [V]. The job uses a deployment identity with schema rights; the application's run-time identity does not need them. [V]
- **Startup migration** is supported by Flyway and Liquibase (Spring Boot), EF Core (`MigrateAsync`), sqlx, Diesel, Fluent and others. It needs a lock so that several instances do not migrate at once: EF Core 9 and later, Prisma, Liquibase and Flyway take locks; dbmate locks only on PostgreSQL. [V for EF Core, Prisma, dbmate; K for Flyway, Liquibase]
- **Old code keeps running during a rolling deployment.** When the migration runs before the new code is live, each migration must be readable by the previous release (expand first, contract in a later release). pgroll and reshape automate this for PostgreSQL; `strong_migrations` checks it in Rails. [V repos; K behaviour]
- **Forward-only is common.** Flyway Community has no undo, DbUp and grate have no down scripts, and many teams fix a bad migration with a new forward migration. [V for Flyway]
- **History differs by tool.** Tools with a version marker (Alembic, golang-migrate, `user_version`, IndexedDB) know the current version but do not keep a per-script record in the target. If a per-script record is required, choose a tool with a history table (Flyway, Liquibase, goose, dbmate, Sqitch, Django, Rails, EF Core and most ORMs). [K]
- **No transaction spans data kinds.** An issue that changes both a SQL table and files in object storage runs two tools in a fixed order, and each step must be safe to repeat. [K]

## 12. Dead, archived or replaced tools (do not propose)

| Tool | Status | Use instead |
|---|---|---|
| Mongock (`flamingock/mongock`) | maintenance mode, end of life at the end of 2026, by its own authors [V] | Flamingock (JVM), migrate-mongo, Flyway MongoDB connector |
| Mongock Professional | ends with Mongock [V] | as above |
| fireway (Firestore, `kevlened/fireway`) | archived; forks small and inactive [V] | a custom runner (section 6, pattern A) or lazy upgrade |
| cassandra-migrate (`Cobliteam/cassandra-migrate`, Python) | archived, last PyPI release 2021 [V] | golang-migrate, cql-track, Flyway Cassandra connector |
| cassandra-migration (`hhandoko/cassandra-migration`, formerly builtamont) | archived [V] | as above |
| cassandra-migration-tool-java (smartcat-labs) | no commits since 2022 [V] | as above |
| `mattes/migrate` | archived; continued as golang-migrate [V] | golang-migrate |
| `elastic/elasticsearch-migration` | archived (was a cluster upgrade helper, not a schema tool) [V] | elasticsearch-evolution or the alias/reindex pattern |
| RoundhousE | replaced by grate [K] | grate |
| Realm (Atlas Device SDKs) | deprecated by MongoDB, end of life 30 September 2025 [S] | Room, SQLDelight, GRDB, SwiftData, drift |
| kafka-gitops (`devshawn/kafka-gitops`), JulieOps (`kafka-ops/julie`) | no commits since 2023 and mid-2024 [V] | Terraform providers for Kafka/Confluent |
| dynamit-cli (DynamoDB) | last release 2021 [S] | Flamingock or a custom runner |
| GORM `AutoMigrate`, Exposed `SchemaUtils` auto-create, Prisma `db push`, EF Core `EnsureCreated` in production | not versioned migration tools: no history, no data steps [K]; EF Core docs say not to call `EnsureCreated` before `Migrate` [V] | the stack's versioned tool |

## 13. Gaps

- **Files in object storage and on file systems** have no standard tool on any stack. Offer the user: (A) a small runner the project writes, with numbered scripts in the repo, a marker object holding the current version and a history object or table, run by one fixed command; (B) code migrations inside the relational tool the project already uses, so the history lands in its history table; (C) Flamingock on Java/Kotlin; (D) a version field per file with upgrade on read plus a background backfill, when the set of files is large; (E) moving tabular data into Iceberg or Delta tables. Each step must be idempotent and resumable. [S]
- **C/C++**: server and CLI projects use a language-agnostic CLI (Flyway Community, dbmate, golang-migrate, Sqitch, goose) from the pipeline. C/C++ desktop or embedded apps with SQLite have no standard runner: offer embedded numbered SQL scripts with `PRAGMA user_version`, or ODB if its GPL/commercial licence suits the project. [S]
- **DynamoDB, Firestore, Cosmos DB, Redis** have no standard tool outside the JVM (Flamingock) and Flyway's Cosmos DB preview. Offer table and index definitions in infrastructure as code, plus pattern A or D for item and document changes. [S]
- **Search indexes outside the JVM**: offer the alias, versioned index and reindex pattern driven by a small runner, or elasticsearch-evolution through a small Java main if the user accepts a JVM in the pipeline. [S]
- **Lakehouse data rewrites**: schema changes are built in, but rewrite jobs have no standard runner; offer recording them in the orchestrator or a small history table. [K]
- **On-device stores** cannot be migrated from the pipeline on any stack. The fixed command does not apply to them; the migration runs inside the app, and CI runs the migration test against fixture data from every old version still supported. [V]
- **Message and event schemas** are not migrated; offer a compatibility check (Schema Registry `test-compatibility`, `buf breaking`) in CI instead of migration scripts. [V]
