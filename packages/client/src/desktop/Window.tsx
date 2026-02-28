import { useCallback, useRef, type ReactNode, type PointerEvent } from "react";
import { useUIStore, type WindowState } from "../stores/ui.js";

interface WindowProps {
  windowState: WindowState;
  children: ReactNode;
}

export function Window({ windowState: w, children }: WindowProps) {
  const { focusWindow, moveWindow, resizeWindow, closeWindow, minimizeWindow, maximizeWindow, restoreWindow } = useUIStore();
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null);

  // ── Drag ──

  const onTitlePointerDown = useCallback(
    (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("[data-traffic-light]")) return;
      e.preventDefault();
      focusWindow(w.id);
      dragRef.current = { startX: e.clientX, startY: e.clientY, origX: w.position.x, origY: w.position.y };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [w.id, w.position.x, w.position.y, focusWindow],
  );

  const onTitlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      moveWindow(w.id, dragRef.current.origX + dx, dragRef.current.origY + dy);
    },
    [w.id, moveWindow],
  );

  const onTitlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  // ── Resize ──

  const onResizePointerDown = useCallback(
    (e: PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      focusWindow(w.id);
      resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: w.size.width, origH: w.size.height };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [w.id, w.size.width, w.size.height, focusWindow],
  );

  const onResizePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!resizeRef.current) return;
      const dx = e.clientX - resizeRef.current.startX;
      const dy = e.clientY - resizeRef.current.startY;
      const newW = Math.max(300, resizeRef.current.origW + dx);
      const newH = Math.max(200, resizeRef.current.origH + dy);
      resizeWindow(w.id, newW, newH);
    },
    [w.id, resizeWindow],
  );

  const onResizePointerUp = useCallback(() => {
    resizeRef.current = null;
  }, []);

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
      {/* Title bar */}
      <div
        className="h-8 bg-neutral-800 flex items-center px-3 gap-2 shrink-0 cursor-default select-none"
        onPointerDown={onTitlePointerDown}
        onPointerMove={onTitlePointerMove}
        onPointerUp={onTitlePointerUp}
      >
        {/* Traffic lights */}
        <div className="flex items-center gap-1.5" data-traffic-light>
          <button
            onClick={() => closeWindow(w.id)}
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

        <span className="text-white/60 text-xs flex-1 text-center">{w.title}</span>
      </div>

      {/* Content */}
      <div className="flex-1 bg-neutral-900 overflow-auto">{children}</div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
        onPointerDown={onResizePointerDown}
        onPointerMove={onResizePointerMove}
        onPointerUp={onResizePointerUp}
      />
    </div>
  );
}
