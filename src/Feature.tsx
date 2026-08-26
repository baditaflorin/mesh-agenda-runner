import { type FormEvent, useMemo, useState } from "react";
import {
  MeshButton,
  MeshPresence,
  MeshStatusPill,
  MeshSurface,
  useSharedAgenda,
  type MeshConfig,
  type SharedAgendaItem,
  type YRoom,
} from "@baditaflorin/mesh-common";

type Props = { room: YRoom | null; config: MeshConfig };

const DURATION_OPTIONS = [5, 10, 15, 25, 45] as const;
const STARTER_PLAN = [
  { title: "Set the room", durationMinutes: 5 },
  { title: "Share the signal", durationMinutes: 10 },
  { title: "Make the call", durationMinutes: 20 },
  { title: "Close with owners", durationMinutes: 10 },
] as const;

export function cleanAgendaTitle(value: string): string {
  return value.trim().replace(/\s+/g, " ").slice(0, 120);
}

export function agendaMinutes(items: readonly SharedAgendaItem[]): number {
  return items.reduce((total, item) => total + item.durationMinutes, 0);
}

export function nextAgendaItem(
  items: readonly SharedAgendaItem[],
  currentId: string | null,
): SharedAgendaItem | null {
  if (!items.length) return null;
  if (!currentId) return items[0] ?? null;
  const currentIndex = items.findIndex((item) => item.id === currentId);
  return currentIndex >= 0 ? (items[currentIndex + 1] ?? null) : (items[0] ?? null);
}

function createItemId(room: YRoom | null): string {
  const suffix = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${room?.peerId ?? "local"}:${suffix}`;
}

function minuteLabel(minutes: number): string {
  return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
}

export function Feature({ room, config }: Props) {
  const agenda = useSharedAgenda(room, "agenda-runner:items");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState<number>(10);
  const items = agenda.items;
  const activeIndex = agenda.currentId
    ? items.findIndex((item) => item.id === agenda.currentId)
    : -1;
  const activeItem = activeIndex >= 0 ? (items[activeIndex] ?? null) : null;
  const nextItem = nextAgendaItem(items, agenda.currentId);
  const totalMinutes = useMemo(() => agendaMinutes(items), [items]);
  const peopleHere = room ? room.peerCount + 1 : 1;
  const completedMinutes = activeIndex > 0 ? agendaMinutes(items.slice(0, activeIndex)) : 0;
  const planProgress = items.length ? Math.max(0, activeIndex + 1) : 0;

  const addItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextTitle = cleanAgendaTitle(title);
    if (!nextTitle || !room) return;
    if (
      agenda.add({
        id: createItemId(room),
        title: nextTitle,
        durationMinutes: duration,
      })
    ) {
      setTitle("");
    }
  };

  const loadStarterPlan = () => {
    if (!room || items.length) return;
    STARTER_PLAN.forEach((item) => {
      agenda.add({ id: createItemId(room), ...item });
    });
  };

  const advance = () => {
    agenda.setCurrent(nextItem?.id ?? null);
  };

  const activateFirst = () => {
    agenda.setCurrent(items[0]?.id ?? null);
  };

  const productName = config.displayName ?? "Agenda Runner";

  return (
    <main className="agenda-page">
      <section className="agenda-command" aria-labelledby="agenda-title">
        <header className="agenda-intro">
          <p className="agenda-kicker">Shared run of show</p>
          <h1 id="agenda-title">Keep the room moving.</h1>
          <p className="agenda-intro-copy">
            A live agenda for the decisions, handoffs, and small pauses that make a session feel
            considered.
          </p>
          <div className="agenda-signals">
            <MeshPresence
              count={peopleHere}
              label={peopleHere === 1 ? "person in this room" : "people in this room"}
              state={room ? "connected" : "connecting"}
              announce="polite"
            />
            <MeshStatusPill tone={room ? "live" : "warning"} dot announce="polite">
              {room ? "Agenda shared live" : "Joining shared agenda"}
            </MeshStatusPill>
          </div>
          <p className="agenda-room-note">
            {room
              ? "Every change appears for everyone in this room."
              : "Your room is being prepared. You can plan as soon as it connects."}
          </p>
        </header>

        <MeshSurface
          as="section"
          tone="accent"
          padding="lg"
          className="agenda-stage"
          aria-labelledby="now-title"
        >
          <div className="agenda-stage-topline">
            <p className="agenda-kicker">Now</p>
            {items.length ? (
              <span className="agenda-step-count" aria-label={`${items.length} agenda items`}>
                {items.length} items
              </span>
            ) : null}
          </div>

          {activeItem ? (
            <div className="agenda-now" data-testid="active-agenda">
              <div className="agenda-now-heading">
                <div>
                  <p className="agenda-step-label">
                    Step {activeIndex + 1} of {items.length}
                  </p>
                  <h2 id="now-title">{activeItem.title}</h2>
                </div>
                <output
                  className="agenda-duration"
                  aria-label={minuteLabel(activeItem.durationMinutes)}
                >
                  <strong>{activeItem.durationMinutes}</strong>
                  <span>min</span>
                </output>
              </div>
              <p className="agenda-now-copy">
                {nextItem
                  ? `When this beat lands, ${nextItem.title} is ready next.`
                  : "This is the final beat. Close the loop when the room is ready."}
              </p>
              <div className="agenda-progress-wrap">
                <div className="agenda-progress-labels" aria-hidden="true">
                  <span>{completedMinutes} min behind</span>
                  <span>{totalMinutes} min planned</span>
                </div>
                <progress
                  className="agenda-progress"
                  value={planProgress}
                  max={items.length}
                  aria-label={`Agenda progress: step ${planProgress} of ${items.length}`}
                />
              </div>
              <div className="agenda-stage-actions">
                <MeshButton type="button" size="lg" onClick={advance} disabled={!room}>
                  {nextItem ? "Advance agenda" : "Finish agenda"}
                </MeshButton>
                <MeshButton
                  type="button"
                  variant="quiet"
                  onClick={() => agenda.setCurrent(null)}
                  disabled={!room}
                >
                  Pause focus
                </MeshButton>
              </div>
            </div>
          ) : items.length ? (
            <div className="agenda-now agenda-now-empty" data-testid="active-agenda">
              <div className="agenda-empty-mark" aria-hidden="true">
                01
              </div>
              <h2 id="now-title">Choose the first beat.</h2>
              <p>Your agenda is ready. Start the shared focus when everyone has arrived.</p>
              <MeshButton type="button" size="lg" onClick={activateFirst} disabled={!room}>
                Start the agenda
              </MeshButton>
            </div>
          ) : (
            <div className="agenda-now agenda-now-empty" data-testid="active-agenda">
              <div className="agenda-empty-mark" aria-hidden="true">
                +
              </div>
              <h2 id="now-title">Make the first beat clear.</h2>
              <p>Add a moment on the right, or start from a calm 45-minute session outline.</p>
              <MeshButton type="button" size="lg" onClick={loadStarterPlan} disabled={!room}>
                Load a 45-minute session
              </MeshButton>
            </div>
          )}
        </MeshSurface>

        <aside className="agenda-right-rail" aria-label={`${productName} controls`}>
          <MeshSurface
            as="section"
            tone="raised"
            padding="md"
            className="agenda-composer"
            aria-labelledby="add-item-title"
          >
            <div className="agenda-surface-heading">
              <div>
                <p className="agenda-kicker">Shape the flow</p>
                <h2 id="add-item-title">Add a beat</h2>
              </div>
              <MeshStatusPill tone="info" dot>
                {totalMinutes} min
              </MeshStatusPill>
            </div>
            <form onSubmit={addItem} className="agenda-form">
              <label htmlFor="agenda-item-title">What needs the room&apos;s attention?</label>
              <input
                id="agenda-item-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Align on launch decisions"
                maxLength={120}
                autoComplete="off"
              />
              <fieldset>
                <legend>Give it enough time</legend>
                <div
                  className="agenda-duration-options"
                  role="group"
                  aria-label="Agenda item duration"
                >
                  {DURATION_OPTIONS.map((minutes) => (
                    <button
                      key={minutes}
                      type="button"
                      className={duration === minutes ? "is-selected" : ""}
                      aria-pressed={duration === minutes}
                      onClick={() => setDuration(minutes)}
                    >
                      {minutes}m
                    </button>
                  ))}
                </div>
              </fieldset>
              <MeshButton type="submit" fullWidth disabled={!room || !cleanAgendaTitle(title)}>
                Add to agenda
              </MeshButton>
            </form>
          </MeshSurface>

          <MeshSurface
            as="section"
            tone="quiet"
            padding="md"
            className="agenda-plan"
            aria-labelledby="plan-title"
          >
            <div className="agenda-surface-heading agenda-plan-heading">
              <div>
                <p className="agenda-kicker">Run of show</p>
                <h2 id="plan-title">{items.length ? "The shared plan" : "Waiting for a plan"}</h2>
              </div>
              {items.length ? (
                <span className="agenda-total" aria-label={`${totalMinutes} minutes planned`}>
                  {totalMinutes}m
                </span>
              ) : null}
            </div>
            {items.length ? (
              <ol className="agenda-list" aria-label="Shared agenda items">
                {items.map((item, index) => {
                  const isCurrent = item.id === agenda.currentId;
                  return (
                    <li key={item.id} data-current={isCurrent || undefined}>
                      <button
                        type="button"
                        className="agenda-item-select"
                        onClick={() => agenda.setCurrent(item.id)}
                        aria-current={isCurrent ? "step" : undefined}
                        aria-label={`Make ${item.title} the current item`}
                      >
                        <span className="agenda-item-index">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="agenda-item-title">{item.title}</span>
                        <span className="agenda-item-duration">{item.durationMinutes}m</span>
                      </button>
                      <button
                        type="button"
                        className="agenda-item-remove"
                        onClick={() => agenda.remove(item.id)}
                        aria-label={`Remove ${item.title}`}
                      >
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div className="agenda-plan-empty">
                <p>There are no hidden lists here.</p>
                <span>Build together, then set the shared focus in one tap.</span>
              </div>
            )}
          </MeshSurface>
        </aside>
      </section>
    </main>
  );
}
