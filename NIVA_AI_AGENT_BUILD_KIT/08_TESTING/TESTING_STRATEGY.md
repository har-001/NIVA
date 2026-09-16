# Testing Strategy

Layers:
- Unit
- Integration
- API
- Critical end-to-end

Mandatory safety tests:
- Invalid tool calls rejected
- Unauthorized actions rejected
- Restart/shutdown require confirmation
- Secrets not logged
- Recording cannot silently start
- Communication respects policy
- Provider failures reported honestly
- AI output cannot bypass authorization
