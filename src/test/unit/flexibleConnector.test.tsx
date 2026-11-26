import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { CanvasContextMenu } from "@/pages/editor/canvas/CanvasContextMenu";
import type { ConnectorElement, RectElement } from "@/types/document";

describe("Flexible Connector / Editable Line Tool", () => {
  const dummyConnector: ConnectorElement = {
    id: "conn-1",
    type: "connector",
    name: "Flexible Connector",
    x: 50,
    y: 50,
    width: 200,
    height: 100,
    rotation: 0,
    opacity: 100,
    visible: true,
    locked: false,
    parentId: null,
    layoutDirection: "none",
    points: [
      { id: "p1", x: 0, y: 0, isCurved: false },
      { id: "p2", x: 100, y: 50, isCurved: false },
      { id: "p3", x: 200, y: 100, isCurved: false },
    ],
    curveMode: "straight",
    lineStyle: "solid",
    startArrow: false,
    endArrow: false,
    editingPoints: true,
  };

  const dummyRect: RectElement = {
    id: "rect-1",
    type: "rect",
    name: "Rectangle",
    x: 10,
    y: 10,
    width: 100,
    height: 80,
    rotation: 0,
    opacity: 100,
    visible: true,
    locked: false,
    parentId: null,
    layoutDirection: "none",
  };

  it("renders connector-specific options when right-clicking a connector", () => {
    const onAddPoint = vi.fn();
    const onEditPoints = vi.fn();
    const onConvertToCurve = vi.fn();
    const onConvertToStraight = vi.fn();
    const onDeletePoint = vi.fn();
    const onResetLineShape = vi.fn();
    const onDelete = vi.fn();
    const onClose = vi.fn();

    render(
      <CanvasContextMenu
        x={100}
        y={100}
        element={dummyConnector}
        onSelect={vi.fn()}
        onDelete={onDelete}
        onDuplicate={vi.fn()}
        onBringToFront={vi.fn()}
        onSendToBack={vi.fn()}
        onClose={onClose}
        onAddPoint={onAddPoint}
        onEditPoints={onEditPoints}
        onConvertToCurve={onConvertToCurve}
        onConvertToStraight={onConvertToStraight}
        onDeletePoint={onDeletePoint}
        onResetLineShape={onResetLineShape}
      />
    );

    // Verify all 7 line-specific actions are displayed
    expect(screen.getByText("Connector Options")).toBeDefined();
    expect(screen.getByText("Add Point")).toBeDefined();
    expect(screen.getByText("Edit Points")).toBeDefined();
    expect(screen.getByText("Convert to Curve")).toBeDefined();
    expect(screen.getByText("Convert to Straight")).toBeDefined();
    expect(screen.getByText("Delete Point")).toBeDefined();
    expect(screen.getByText("Reset Line Shape")).toBeDefined();
    expect(screen.getByText("Delete Line")).toBeDefined();

    // Click Convert to Curve
    fireEvent.click(screen.getByText("Convert to Curve"));
    expect(onConvertToCurve).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("does not render connector options for standard shapes", () => {
    render(
      <CanvasContextMenu
        x={100}
        y={100}
        element={dummyRect}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
        onBringToFront={vi.fn()}
        onSendToBack={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByText("Connector Options")).toBeNull();
    expect(screen.queryByText("Add Point")).toBeNull();
    expect(screen.queryByText("Convert to Curve")).toBeNull();
    expect(screen.getByText("Delete")).toBeDefined();
  });

  it("disables Delete Point when connector has only 2 points", () => {
    const twoPointConnector: ConnectorElement = {
      ...dummyConnector,
      points: [
        { id: "p1", x: 0, y: 0, isCurved: false },
        { id: "p2", x: 100, y: 100, isCurved: false },
      ],
    };

    render(
      <CanvasContextMenu
        x={100}
        y={100}
        element={twoPointConnector}
        onSelect={vi.fn()}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
        onBringToFront={vi.fn()}
        onSendToBack={vi.fn()}
        onClose={vi.fn()}
        onDeletePoint={vi.fn()}
      />
    );

    const deletePointBtn = screen.getByText("Delete Point").closest("button");
    expect(deletePointBtn?.hasAttribute("disabled")).toBe(true);
  });
});
