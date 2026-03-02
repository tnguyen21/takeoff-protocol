import { useCallback, useRef, type ReactNode, type PointerEvent } from "react";
import { useUIStore, type WindowState } from "../stores/ui.js";
import { AppIcon } from "../apps/icons.js";
import { soundManager } from "../sounds/index.js";

const MIN_WIDTH = 300;
const MIN_HEIGHT = 200;
const MENUBAR_H = 28;
const DOCK_H = 64;
const TITLEBAR_H = 32;
const MIN_VISIBLE_X = 100; // px of titlebar that must remain horizontally visible

type ResizeEdge = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

const EDGE_CURSOR: Record<ResizeEdge, string> = {
  n: "n-resize",
  ne: "ne-resize",
  e: "e-resize",
  se: "se-resize",
  s: "s-resize",
  sw: "sw-resize",
  w: "w-resize",
  nw: "nw-resize",
};

interface ResizeState {
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  origW: number;
  origH: number;
  edge: ResizeEdge;
}

interface WindowProps {
  windowState: WindowState;
  children: ReactNode;
}

export function Window({ windowState: w, children }: WindowProps) {
  const { focusWindow, moveWindow, moveResizeWindow, closeWindow, minimizeWindow, maximizeWindow, restoreWindow } =
    useUIStore();
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<ResizeState | null>(null);

  // ── Drag ──

  const onTitlePointerDown = useCallback(
    (e: PointerEvent) => {
      if (w.isMaximized) return;
      if ((e.target as HTMLElement).closest("[data-traffic-light]")) return;
      e.preventDefault();
      focusWindow(w.id);
      dragRef.current = { startX: e.clientX, startY: e.clientY, origX: w.position.x, origY: w.position.y };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [w.id, w.position.x, w.position.y, w.isMaximized, focusWindow],
  );

  const onTitlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const rawX = dragRef.current.origX + dx;
      const rawY = dragRef.current.origY + dy;

      // Clamp so titlebar always stays reachable
      const containerH = window.innerHeight - MENUBAR_H - DOCK_H;
      const clampedY = Math.min(Math.max(rawY, 0), containerH - TITLEBAR_H);
      const clampedX = Math.min(Math.max(rawX, -(w.size.width - MIN_VISIBLE_X)), window.innerWidth - MIN_VISIBLE_X);

      moveWindow(w.id, clampedX, clampedY);
    },
    [w.id, w.size.width, moveWindow],
  );

  const onTitlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const onTitleDoubleClick = useCallback(() => {
    if (w.isMaximized) {
      restoreWindow(w.id);
    } else {
      maximizeWindow(w.id);
    }
  }, [w.id, w.isMaximized, maximizeWindow, restoreWindow]);

  // ── Resize ──

  const onResizePointerDown = useCallback(
    (e: PointerEvent) => {
      if (w.isMaximized) return;
      e.preventDefault();
      e.stopPropagation();
      focusWindow(w.id);
      const edge = (e.currentTarget as HTMLElement).dataset.resizeEdge as ResizeEdge;
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: w.position.x,
        origY: w.position.y,
        origW: w.size.width,
        origH: w.size.height,
        edge,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [w.id, w.position.x, w.position.y, w.size.width, w.size.height, w.isMaximized, focusWindow],
  );

  const onResizePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!resizeRef.current) return;
      const { startX, startY, origX, origY, origW, origH, edge } = resizeRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let newX = origX;
      let newY = origY;
      let newW = origW;
      let newH = origH;

      if (edge.includes("e")) {
        newW = Math.max(MIN_WIDTH, origW + dx);
      }
      if (edge.includes("s")) {
        newH = Math.max(MIN_HEIGHT, origH + dy);
      }
      if (edge.includes("w")) {
        const desired = origW - dx;
        newW = Math.max(MIN_WIDTH, desired);
        newX = origX + (origW - newW);
      }
      if (edge.includes("n")) {
        const desired = origH - dy;
        newH = Math.max(MIN_HEIGHT, desired);
        newY = origY + (origH - newH);
      }

      moveResizeWindow(w.id, newX, newY, newW, newH);
    },
    [w.id, moveResizeWindow],
  );

  const onResizePointerUp = useCallback(() => {
    resizeRef.current = null;
  }, []);

  const resizeHandleProps = (edge: ResizeEdge) => ({
    "data-resize-edge": edge,
    style: { cursor: EDGE_CURSOR[edge] },
    onPointerDown: onResizePointerDown,
    onPointerMove: onResizePointerMove,
    onPointerUp: onResizePointerUp,
  });

  return (
    <div
      className="absolute rounded-lg overflow-hidden shadow-2xl border border-white/10 flex flex-col"
      style={{
        transform: `translate3d(${w.position.x}px, ${w.position.y}px, 0)`,
        width: w.size.width,
        height: w.size.height,
        zIndex: w.zIndex,
      }}
      onPointerDown={() => focusWindow(w.id)}
    >
      {/* Edge resize handles */}
      <div className="absolute top-0 left-0 right-0 h-1 z-10" {...resizeHandleProps("n")} />
      <div className="absolute bottom-0 left-0 right-0 h-1 z-10" {...resizeHandleProps("s")} />
      <div className="absolute top-0 right-0 bottom-0 w-1 z-10" {...resizeHandleProps("e")} />
      <div className="absolute top-0 left-0 bottom-0 w-1 z-10" {...resizeHandleProps("w")} />

      {/* Corner resize handles */}
      <div className="absolute top-0 left-0 w-3 h-3 z-20" {...resizeHandleProps("nw")} />
      <div className="absolute top-0 right-0 w-3 h-3 z-20" {...resizeHandleProps("ne")} />
      <div className="absolute bottom-0 left-0 w-3 h-3 z-20" {...resizeHandleProps("sw")} />
      <div className="absolute bottom-0 right-0 w-3 h-3 z-20" {...resizeHandleProps("se")} />

      {/* Title bar */}
      <div
        className="h-8 bg-neutral-800 flex items-center px-3 gap-2 shrink-0 cursor-default select-none"
        onPointerDown={onTitlePointerDown}
        onPointerMove={onTitlePointerMove}
        onPointerUp={onTitlePointerUp}
        onDoubleClick={onTitleDoubleClick}
      >
        {/* Traffic lights */}
        <div className="flex items-center gap-1.5" data-traffic-light>
          <button
            onClick={() => { soundManager.play("pop"); closeWindow(w.id); }}
            className="w-3 h-3 rounded-full bg-[#ff5f57] hover:brightness-110"
          />
          <button
            onClick={() => minimizeWindow(w.id)}
            className="w-3 h-3 rounded-full bg-[#febc2e] hover:brightness-110"
          />
          <button
            onClick={() => (w.isMaximized ? restoreWindow(w.id) : maximizeWindow(w.id))}
            className="w-3 h-3 rounded-full bg-[#28c840] hover:brightness-110"
          />
        </div>

        <span className="text-white/60 text-xs flex-1 flex items-center justify-center gap-1">
          <AppIcon appId={w.appId} size={14} color="rgba(255,255,255,0.6)" />
          {w.title}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 bg-neutral-900 overflow-auto">{children}</div>
    </div>
  );
}
