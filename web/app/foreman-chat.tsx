"use client";

import type { ClientSessionState, MessageStreamEvent } from "eve/client";
import {
  type EveDynamicToolPart,
  type EveMessageInputRequest,
  type EveMessagePart,
  useEveAgent,
} from "eve/react";
import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const STORAGE_KEY = "foreman-web-chat";

type SavedChat = {
  readonly events?: readonly MessageStreamEvent[];
  readonly session?: ClientSessionState;
};
type Respond = ReturnType<typeof useEveAgent>["respond"];
type InputOption = NonNullable<EveMessageInputRequest["options"]>[number];

const emptyChat: SavedChat = {};

function readSavedChat(): SavedChat {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyChat;
    }
    const saved = JSON.parse(raw) as SavedChat;
    if (
      saved.session &&
      (typeof saved.session.sessionId !== "string" ||
        !Number.isSafeInteger(saved.session.streamIndex))
    ) {
      return emptyChat;
    }
    return {
      events: Array.isArray(saved.events) ? saved.events : [],
      session: saved.session,
    };
  } catch {
    return emptyChat;
  }
}
function InputOptionButton({
  disabled,
  option,
  sendOption,
}: {
  readonly disabled: boolean;
  readonly option: InputOption;
  readonly sendOption: (optionId: string) => void;
}) {
  const select = useCallback(
    () => sendOption(option.id),
    [option.id, sendOption]
  );

  return (
    <button
      className={
        option.style === "danger"
          ? "button button-danger"
          : "button button-small"
      }
      disabled={disabled}
      onClick={select}
      type="button"
    >
      {option.label}
    </button>
  );
}

function persistChat(chat: SavedChat) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(chat));
}

function pendingRequests(parts: readonly EveMessagePart[]) {
  return parts.flatMap((part) => {
    if (part.type !== "dynamic-tool" || part.state !== "approval-requested") {
      return [];
    }
    const request = part.toolMetadata?.eve?.inputRequest;
    return request ? [request] : [];
  });
}

function statusLabel(status: EveDynamicToolPart["state"]) {
  switch (status) {
    case "input-streaming":
    case "input-available":
      return "running";
    case "approval-requested":
      return "awaiting approval";
    case "approval-responded":
      return "approval sent";
    case "output-available":
      return "complete";
    case "output-denied":
      return "not approved";
    case "output-error":
      return "failed";
    default:
      return "updated";
  }
}

function ToolProgress({ part }: { readonly part: EveDynamicToolPart }) {
  const action = part.toolMetadata?.eve;
  const name = action?.name ?? part.toolName;
  const isStation = action?.kind === "subagent-call";
  const failed = part.state === "output-error";

  return (
    <div
      className={failed ? "tool-progress tool-progress-error" : "tool-progress"}
    >
      <span aria-hidden="true" className="status-led" />
      <span>
        {isStation ? name : `tool: ${name}`} {statusLabel(part.state)}
        {part.state === "input-streaming" || part.state === "input-available"
          ? "..."
          : ""}
      </span>
      {failed ? <span className="tool-error">{part.errorText}</span> : null}
    </div>
  );
}

function InputRequestCard({
  disabled,
  request,
  respond,
}: {
  readonly disabled: boolean;
  readonly request: EveMessageInputRequest;
  readonly respond: Respond;
}) {
  const [freeform, setFreeform] = useState("");
  const label =
    request.kind === "tool-approval" ? "Approval required" : "Foreman asks";
  const sendOption = useCallback(
    (optionId: string) => {
      void respond([{ optionId, requestId: request.requestId }]);
    },
    [request.requestId, respond]
  );
  const sendFreeform = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const text = freeform.trim();
      if (text) {
        void respond([{ requestId: request.requestId, text }]);
      }
    },
    [freeform, request.requestId, respond]
  );
  const updateFreeform = useCallback(
    (event: FormEvent<HTMLInputElement>) =>
      setFreeform(event.currentTarget.value),
    []
  );

  return (
    <section className="input-request">
      <p className="eyebrow">{label}</p>
      <p>{request.prompt}</p>
      {request.options?.length ? (
        <div className="input-options">
          {request.options.map((option) => (
            <InputOptionButton
              disabled={disabled}
              key={option.id}
              option={option}
              sendOption={sendOption}
            />
          ))}
        </div>
      ) : null}
      {request.allowFreeform ? (
        <form className="freeform-response" onSubmit={sendFreeform}>
          <input
            aria-label="Your response"
            disabled={disabled}
            onChange={updateFreeform}
            placeholder="Type a response"
            value={freeform}
          />
          <button
            className="button button-small"
            disabled={disabled || !freeform.trim()}
            type="submit"
          >
            Reply
          </button>
        </form>
      ) : null}
    </section>
  );
}

function AuthorizationPrompt({
  part,
}: {
  readonly part: Extract<EveMessagePart, { type: "authorization" }>;
}) {
  if (part.state === "completed") {
    return (
      <section className="authorization">
        <p className="eyebrow">Connection</p>
        <p>
          {part.displayName} authorization {part.outcome}.
        </p>
      </section>
    );
  }

  return (
    <section className="authorization">
      <p className="eyebrow">Connection required</p>
      <p>{part.description}</p>
      {part.authorization?.userCode ? (
        <code>{part.authorization.userCode}</code>
      ) : null}
      {part.authorization?.url ? (
        <a href={part.authorization.url} rel="noreferrer" target="_blank">
          Connect {part.displayName}
        </a>
      ) : null}
    </section>
  );
}

function MessageParts({
  disabled,
  parts,
  respond,
}: {
  readonly disabled: boolean;
  readonly parts: readonly EveMessagePart[];
  readonly respond: Respond;
}) {
  return parts.map((part, index) => {
    const key = `${part.type}-${index}`;

    if (part.type === "text") {
      return <p key={key}>{part.text}</p>;
    }
    if (part.type === "reasoning") {
      return (
        <details className="reasoning" key={key}>
          <summary>Foreman&apos;s notes</summary>
          <p>{part.text}</p>
        </details>
      );
    }
    if (part.type === "dynamic-tool") {
      const requests = pendingRequests([part]);
      return (
        <div className="tool-part" key={key}>
          <ToolProgress part={part} />
          {requests.map((request) => (
            <InputRequestCard
              disabled={disabled}
              key={request.requestId}
              request={request}
              respond={respond}
            />
          ))}
        </div>
      );
    }
    if (part.type === "authorization") {
      return <AuthorizationPrompt key={key} part={part} />;
    }
    if (part.type === "file") {
      return (
        <p className="file-part" key={key}>
          Attached: {part.filename ?? part.mediaType}
        </p>
      );
    }
    return null;
  });
}

function ChatSession({
  savedChat,
  startNewSession,
}: {
  readonly savedChat: SavedChat;
  readonly startNewSession: () => void;
}) {
  const eventsRef = useRef<readonly MessageStreamEvent[]>(
    savedChat.events ?? []
  );
  const sessionRef = useRef<ClientSessionState | undefined>(savedChat.session);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [draft, setDraft] = useState("");
  const agent = useEveAgent({
    initialEvents: savedChat.events,
    initialSession: savedChat.session,
    onEvent(event) {
      eventsRef.current = [...eventsRef.current, event];
      persistChat({ events: eventsRef.current, session: sessionRef.current });
    },
    onFinish(snapshot) {
      eventsRef.current = snapshot.events;
      sessionRef.current = snapshot.session;
      persistChat({ events: snapshot.events, session: snapshot.session });
    },
    onSessionChange(session) {
      sessionRef.current = session;
      persistChat({ events: eventsRef.current, session });
    },
  });
  const isBusy = agent.status === "submitted" || agent.status === "streaming";
  const isError = agent.status === "error";
  const hasPendingRequest = agent.data.messages.some(
    (message) => pendingRequests(message.parts).length > 0
  );

  useEffect(() => {
    eventsRef.current = agent.events;
    sessionRef.current = agent.session;
    persistChat({ events: agent.events, session: agent.session });
  }, [agent.events, agent.session]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agent.data.messages, agent.status]);

  const send = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const message = draft.trim();
      if (!message || isBusy || isError) {
        return;
      }
      setDraft("");
      void agent.send(message).catch(() => setDraft(message));
    },
    [agent, draft, isBusy, isError]
  );
  const submitOnEnter = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        formRef.current?.requestSubmit();
      }
    },
    []
  );
  const reset = useCallback(() => {
    agent.reset();
    window.localStorage.removeItem(STORAGE_KEY);
    startNewSession();
  }, [agent, startNewSession]);
  const updateDraft = useCallback(
    (event: FormEvent<HTMLTextAreaElement>) =>
      setDraft(event.currentTarget.value),
    []
  );

  return (
    <main className="factory-shell">
      <aside className="factory-sidebar">
        <div aria-hidden="true" className="mark">
          F
        </div>
        <div>
          <p className="eyebrow">eve game factory</p>
          <h1>Foreman</h1>
        </div>
        <div className="factory-status">
          <span aria-hidden="true" className="status-led" />
          {isBusy
            ? "Line active"
            : hasPendingRequest
              ? "Awaiting input"
              : "Line ready"}
        </div>
        <button className="new-session" onClick={reset} type="button">
          + New session
        </button>
      </aside>

      <section className="chat-panel">
        <header className="hero">
          <p className="eyebrow">Shift supervisor online</p>
          <h2>Build a small game from one good idea.</h2>
          <p>
            Describe a 2D retro game, its goal, and the feeling you want.
            Foreman will plan, build, and playtest a draft pull request.
          </p>
        </header>

        <div aria-live="polite" className="messages">
          {agent.data.messages.length === 0 ? (
            <div className="empty-state">
              <span aria-hidden="true" className="empty-spark">
                ✦
              </span>
              <p>Describe a 2D retro game to start the production line.</p>
              <span>
                Example: “A tiny moon-base delivery game with three levels.”
              </span>
            </div>
          ) : (
            agent.data.messages.map((message) => (
              <article
                className={`message message-${message.role}`}
                key={message.id}
              >
                <p className="message-label">
                  {message.role === "assistant" ? "Foreman" : "You"}
                </p>
                <MessageParts
                  disabled={isBusy}
                  parts={message.parts}
                  respond={agent.respond}
                />
              </article>
            ))
          )}
          {isBusy ? (
            <div className="turn-status">
              <span aria-hidden="true" className="status-led" />
              {agent.status === "submitted"
                ? "Opening the work order..."
                : "Foreman is on the floor..."}
            </div>
          ) : null}
          {isError ? (
            <section className="error-state" role="alert">
              <p className="eyebrow">Work order interrupted</p>
              <p>
                {agent.error?.message ??
                  "The agent could not complete this turn."}
              </p>
              <button
                className="button button-small"
                onClick={reset}
                type="button"
              >
                Start a new session
              </button>
            </section>
          ) : null}
          <div ref={endOfMessagesRef} />
        </div>

        <form className="composer" onSubmit={send} ref={formRef}>
          <label htmlFor="game-idea">Your game brief</label>
          <textarea
            disabled={isBusy || isError}
            id="game-idea"
            onChange={updateDraft}
            onKeyDown={submitOnEnter}
            placeholder="Describe a 2D retro game..."
            rows={3}
            value={draft}
          />
          <div className="composer-actions">
            <span>Enter to send · Shift+Enter for a new line</span>
            <button
              className="button"
              disabled={isBusy || isError || !draft.trim()}
              type="submit"
            >
              Send brief
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export function ForemanChat() {
  const [savedChat, setSavedChat] = useState<SavedChat | null>(null);
  const [sessionKey, setSessionKey] = useState(0);

  useEffect(() => {
    setSavedChat(readSavedChat());
  }, []);

  const startNewSession = useCallback(() => {
    setSessionKey((key) => key + 1);
    setSavedChat(emptyChat);
  }, []);

  if (!savedChat) {
    return (
      <main className="factory-shell loading-shell">
        <p>Opening the factory floor...</p>
      </main>
    );
  }

  return (
    <ChatSession
      key={`${sessionKey}-${savedChat.session?.sessionId ?? "new"}`}
      savedChat={savedChat}
      startNewSession={startNewSession}
    />
  );
}
