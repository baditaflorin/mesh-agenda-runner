import { useState } from "react";
import { useSharedAgenda } from "@baditaflorin/mesh-common";
import type { MeshConfig, YRoom } from "@baditaflorin/mesh-common";

type Props = { room: YRoom | null; config: MeshConfig };
export function Feature({ room, config }: Props) {
  const agenda = useSharedAgenda(room, "live-agenda");
  const [title, setTitle] = useState("");
  const add = () => {
    if (agenda.add({ id: `${room?.peerId ?? "local"}-${Date.now()}`, title, durationMinutes: 10 }))
      setTitle("");
  };
  return (
    <main className="feature-placeholder">
      <h1>{config.appName}</h1>
      <p>{config.description}</p>
      <p className="feature-status">
        Current: {agenda.items.find((item) => item.id === agenda.currentId)?.title ?? "Not started"}
      </p>
      <label>
        Agenda item{" "}
        <input value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <button type="button" onClick={add}>
        Add item
      </button>
      <ol>
        {agenda.items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              aria-pressed={agenda.currentId === item.id}
              onClick={() => agenda.setCurrent(item.id)}
            >
              {item.title} · {item.durationMinutes}m
            </button>
            <button
              type="button"
              aria-label={`Remove ${item.title}`}
              onClick={() => agenda.remove(item.id)}
            >
              Remove
            </button>
          </li>
        ))}
      </ol>
    </main>
  );
}
