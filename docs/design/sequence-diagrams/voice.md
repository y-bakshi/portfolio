# Optional Voice Sequence

Provider choice is open. The initial voice contract favors push-to-talk and completed answers rather than a permanent realtime audio connection.

```mermaid
sequenceDiagram
  actor Visitor
  participant UI as Guide controls
  participant Speech as Browser or speech adapter
  participant API as Portfolio API
  Visitor->>UI: Activate microphone
  UI->>Visitor: Request browser permission if needed
  alt Permission granted and recognition supported
    UI->>Speech: Capture bounded speech
    Speech-->>UI: Transcript
    UI-->>Visitor: Editable text transcript
    Visitor->>UI: Submit text
    UI->>API: Standard chat request
    API-->>UI: Grounded answer
    Visitor->>UI: Enable/read aloud
    UI->>Speech: Speak answer within voice allowance
    Visitor->>UI: Stop playback
    UI->>Speech: Cancel audio
  else Permission denied or unsupported
    UI-->>Visitor: Keep typed input available
  end
```

If server transcription is selected, define a separate bounded upload endpoint, audio formats, retention, and cost limits before implementation. Do not store audio by default. Disclose external speech processing; browser APIs do not guarantee on-device recognition. Playback must not begin before visitor interaction.
