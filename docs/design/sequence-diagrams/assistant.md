# Assistant Request Sequence

Status: implemented. The session is created once, before the first question; each question is then one chat request.

```mermaid
sequenceDiagram
  actor Visitor
  participant UI as React guide
  participant W as Worker (Hono)
  participant G as Guard (Durable Object)
  participant DB as D1
  participant LLM as Gemini
  Note over UI,W: Once per visitor: Turnstile token to POST /api/session sets the signed chat cookie
  Visitor->>UI: Ask a question
  UI->>W: POST /api/chat with the chat cookie
  W->>W: Check origin, size and cookie
  W->>G: Check limits and reserve the largest cost
  alt Limit hit, cap reached or kill switch on
    W-->>UI: 429 or 503 with when to retry
    UI-->>Visitor: A plain "cannot answer just now" reply
  else Admitted
    W->>DB: Look for a stored answer (suggestion buttons)
    alt Stored answer found
      DB-->>W: Text and cites
    else Not stored
      W->>LLM: Embed the question
      W->>DB: Compare with the notes' vectors
      W->>LLM: Rules, last turns, closest notes as data, question
      LLM-->>W: Answer streamed back
      W->>W: Check the cites, add the contact pointer, apply the off-topic rule
    end
    W->>G: Settle the real cost
    W->>DB: Save the exchange and a usage event
    W-->>UI: Text streamed as events, then the cited cards
    UI-->>Visitor: Answer, with Show on the page buttons
    Visitor->>UI: Press a source button
    UI-->>Visitor: Card scrolled to and highlighted, or its page opened
  end
```

The model call stays outside the Durable Object, so a retry cannot spend twice. A cached answer skips the model but still passes the limits. After a cancelled request, a late response is ignored by the page.
