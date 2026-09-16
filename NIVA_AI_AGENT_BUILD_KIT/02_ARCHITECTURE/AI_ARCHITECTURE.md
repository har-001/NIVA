# AI Architecture

Components:
- Provider abstraction
- Conversation manager
- Context manager
- Tool registry
- Typed schemas
- Policy engine
- Planner
- Executor
- Result verifier
- Streaming
- Cancellation

Flow:
User request → intent/context → proposed tool → schema validation → permission/policy → confirmation if required → execution → verified result → response.

The LLM must never directly execute arbitrary shell commands.
