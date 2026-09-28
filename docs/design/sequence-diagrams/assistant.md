# Assistant Request Sequence

Status: planned. Session bootstrap is separate from each chat request.

```mermaid
sequenceDiagram
  actor Visitor
  participant UI as Vue guide
  participant API as FastAPI / Cloud Run
  participant DB as Firestore
  participant KB as Versioned knowledge
  participant LLM as Model adapter
  Visitor->>UI: Submit portfolio question
  UI->>API: POST chat + App Check + cookie + idempotency key
  API->>API: Validate origin, token, session, payload
  API->>DB: Atomically check limits and reserve cost
  alt Quota exhausted or store unavailable
    API-->>UI: 429 or 503 with fallback guidance
  else Reservation accepted
    API->>KB: Retrieve verified evidence
    API->>DB: Check safe versioned answer cache
    alt Cache miss
      API->>LLM: Bounded grounded prompt
      LLM-->>API: Candidate answer and action proposals
    end
    API->>API: Validate citations and allowlisted actions
    API->>DB: Settle reservation; optional redacted question
    API-->>UI: Answer, citations, actions, usage
    UI-->>Visitor: Text answer and project spotlight
    Visitor->>UI: Choose open case study or speak answer
  end
```

Provider calls stay outside database transaction retry callbacks. Cached answers avoid inference charges but remain subject to inexpensive abuse limits. Transcript changes and navigation actions must ignore stale responses after cancellation.
