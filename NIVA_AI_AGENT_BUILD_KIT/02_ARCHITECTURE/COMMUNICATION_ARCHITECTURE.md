# Communication Architecture

User intent → contact resolution → authorization/policy → communication orchestrator → provider adapter → authorized provider/device → verified result → audit log.

Provider adapters expose only capabilities actually supported.

## Incoming Calls
Disabled by default. Explicit configuration must define allowed contacts, unknown-caller policy, emergency rules, maximum duration, AI scope, notifications, recording and disclosure policy.

## Recording
Never silently record. Require explicit enablement, provider support and applicable participant notification/consent handling.
