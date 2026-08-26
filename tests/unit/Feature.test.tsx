import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createMockRoom } from "@baditaflorin/mesh-common/testing";
import { agendaMinutes, cleanAgendaTitle, Feature, nextAgendaItem } from "../../src/Feature";
import { config } from "../../src/config";

describe("Agenda Runner", () => {
  it("normalizes agenda titles and computes the next focused beat", () => {
    const items = [
      { id: "one", title: "Set context", durationMinutes: 5 },
      { id: "two", title: "Make a decision", durationMinutes: 15 },
    ];

    expect(cleanAgendaTitle("  Set   the room  ")).toBe("Set the room");
    expect(agendaMinutes(items)).toBe(20);
    expect(nextAgendaItem(items, null)).toEqual(items[0]);
    expect(nextAgendaItem(items, "one")).toEqual(items[1]);
    expect(nextAgendaItem(items, "two")).toBeNull();
  });

  it("adds a shared beat and can make it the room focus", async () => {
    const room = createMockRoom({ peerId: "facilitator" });
    render(<Feature room={room} config={config} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Keep the room moving." }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("What needs the room's attention?"), {
      target: { value: "Confirm the launch scope" },
    });
    fireEvent.click(screen.getByRole("button", { name: "15m" }));
    fireEvent.click(screen.getByRole("button", { name: "Add to agenda" }));

    const makeCurrent = await screen.findByRole("button", {
      name: "Make Confirm the launch scope the current item",
    });
    fireEvent.click(makeCurrent);

    await waitFor(() => {
      expect(screen.getByTestId("active-agenda")).toHaveTextContent("Confirm the launch scope");
      expect(screen.getByRole("progressbar")).toHaveAttribute("value", "1");
    });
  });

  it("keeps the primary agenda action disabled while a room is connecting", () => {
    render(<Feature room={null} config={config} />);
    expect(screen.getByRole("button", { name: "Load a 45-minute session" })).toBeDisabled();
    expect(screen.getByText("Joining shared agenda")).toBeInTheDocument();
  });
});
