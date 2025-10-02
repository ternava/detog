+++
title = "Taxonomy"
+++

# Taxonomy of feature toggle definitions

<style>
/* basic table styling */
table {
  width: 100%;
  max-width: 100%;
  table-layout: fixed;         
  border-collapse: collapse;
  margin: 1rem 0;
}
table th,
table td {
  border: 1px solid #ccc;
  padding: 0.5rem;
  text-align: left;
  word-wrap: break-word;       
  white-space: pre-wrap;
}
table tr:nth-child(even) {
  background-color: #f9f9f9;
}
</style>


| Dimension               | Kubernetes                                                                             | GitLab                                                              | Envoy                                                                                |
|-------------------------|----------------------------------------------------------------------------------------|---------------------------------------------------------------------|--------------------------------------------------------------------------------------|
| **Naming Conventions**  | `CamelCase`, implicit subsystem prefixes                                               | `snake_case`, subsystem prefixes                                   | `snake_case`, full prefixes                                                          |
| **Definition Mechanisms** | Go constants (e.g. `pkg/features/kube_features.go`)                                   | YAML/DB via UI                                                      | C++ macros (e.g. `runtime_features.cc`)                                              |
| **Types & Stages**      | Boolean, Alpha/Beta/GA                                                                 | Boolean, %-rollout, dev/staging/prod                                | Boolean, reloadable vs restart                                                       |
| **Activation Methods**  | CLI flags, config files                                                                | UI/API, env vars                                                    | Runtime YAML/config                                                                  |
| **Lifecycle Management**| Alpha → Beta → GA → Removal via KEP                                                    | Experiment → Gradual enable → Cleanup                               | Experiment → Default enable → Removal                                                 |

## Detailed examples

<details>
<summary>1. Kubernetes Feature Gates</summary>

| Dimension             | Description                                                                    | Example                                                         |
|-----------------------|--------------------------------------------------------------------------------|-----------------------------------------------------------------|
| Naming Conventions    | CamelCase with implicit subsystem prefixes                                     | `EphemeralContainers`                                           |
| Definition Mechanisms | Defined as Go constants (e.g. `pkg/features/kube_features.go`)                 | `const EphemeralContainers Feature = "EphemeralContainers"`     |
| Types & Stages        | Boolean toggles with Alpha → Beta → GA lifecycle                               | Alpha → Beta → GA                                               |
| Activation Methods    | CLI flags (`--feature-gates`) or config files, checked via feature gate API    | `--feature-gates=EphemeralContainers=true`                     |
| Lifecycle Management  | Gates deprecated and removed post-GA via Kubernetes Enhancement Proposals (KEPs) | Removal in version X.Y                                          |

</details>

<details>
<summary>2. GitLab Feature Flags</summary>

| Dimension             | Description                                                                    | Example                                                         |
|-----------------------|--------------------------------------------------------------------------------|-----------------------------------------------------------------|
| Naming Conventions    | `snake_case` with subsystem prefixes                                          | `ci_pipeline_persistence`                                       |
| Definition Mechanisms | YAML/database-backed, managed via UI/API                                       | Flipper flag defined in `config/flags.yml`                      |
| Types & Stages        | Boolean, percentage rollouts, conditional (e.g., user group, plan type)        | 10% rollout to beta users                                       |
| Activation Methods    | Admin UI, API, or environment variables                                        | `Feature.enabled?(:ci_pipeline_persistence, current_user)`      |
| Lifecycle Management  | Experiment → gradual enable → cleanup (audit tools available in GitLab UI)     | Flag cleanup via “Feature Flags” dashboard                      |

</details>

<details>
<summary>3. Envoy Runtime Guards</summary>

| Dimension             | Description                                                                    | Example                                                         |
|-----------------------|--------------------------------------------------------------------------------|-----------------------------------------------------------------|
| Naming Conventions    | `snake_case` with full prefixes                                                | `envoy_reloadable_features_http3_happy_eyeballs`                |
| Definition Mechanisms | C++ macros in `source/common/runtime/runtime_features.cc`                      | `RUNTIME_GUARD(envoy_reloadable_features_http3_happy_eyeballs)` |
| Types & Stages        | Boolean, reloadable vs. restart toggles                                        | “reloadable” (no restart needed)                                |
| Activation Methods    | Runtime config (YAML or admin API)                                             | Runtime YAML file under `/etc/envoy/runtime.yaml`               |
| Lifecycle Management  | Added for experiments, default flipped when stable, removed when obsolete      | Macro removed in commit abc123                                 |

</details>