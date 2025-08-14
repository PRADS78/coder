import { useState, useRef, useCallback } from "react";

export interface DragItem {
  id: string;
  type: string;
  data: any;
}

export interface DropResult {
  targetId?: string;
  position?: number;
  action: "move" | "copy";
}

export interface DragDropHandlers {
  onDragStart: (e: React.DragEvent, item: DragItem) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetId?: string, position?: number) => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  isDragging: boolean;
  draggedItem: DragItem | null;
  dropTarget: string | null;
}

export interface UseDragDropOptions {
  onDrop?: (item: DragItem, result: DropResult) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  acceptTypes?: string[];
  autoScroll?: boolean;
  scrollContainer?: HTMLElement | (() => HTMLElement | null);
}

export const useDragAndDrop = (
  options: UseDragDropOptions = {},
): DragDropHandlers => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const dragCounterRef = useRef(0);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const getScrollContainer = useCallback(() => {
    if (typeof options.scrollContainer === "function") {
      return options.scrollContainer();
    }
    return options.scrollContainer || null;
  }, [options.scrollContainer]);

  const handleAutoScroll = useCallback(
    (clientY: number) => {
      if (!options.autoScroll) return;

      const container = getScrollContainer();
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const threshold = 50;
      const scrollSpeed = 5;

      if (clientY < containerRect.top + threshold) {
        // Scroll up
        container.scrollTop = Math.max(0, container.scrollTop - scrollSpeed);
      } else if (clientY > containerRect.bottom - threshold) {
        // Scroll down
        container.scrollTop = Math.min(
          container.scrollHeight - container.clientHeight,
          container.scrollTop + scrollSpeed,
        );
      }
    },
    [options.autoScroll, getScrollContainer],
  );

  const startAutoScroll = useCallback(
    (clientY: number) => {
      if (scrollIntervalRef.current) return;

      scrollIntervalRef.current = setInterval(() => {
        handleAutoScroll(clientY);
      }, 16); // ~60fps
    },
    [handleAutoScroll],
  );

  const stopAutoScroll = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }, []);

  const onDragStart = (e: React.DragEvent, item: DragItem) => {
    setIsDragging(true);
    setDraggedItem(item);

    // Set drag data
    e.dataTransfer.setData("application/json", JSON.stringify(item));
    e.dataTransfer.effectAllowed = "copyMove";

    // Add drag image styling
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const onDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    setDraggedItem(null);
    setDropTarget(null);
    dragCounterRef.current = 0;
    stopAutoScroll();

    // Reset opacity
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";

    // Handle auto-scroll
    if (isDragging) {
      handleAutoScroll(e.clientY);
    }
  };

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;

    if (e.currentTarget instanceof HTMLElement) {
      const targetId = e.currentTarget.getAttribute("data-drop-target");
      if (targetId) {
        setDropTarget(targetId);
      }
    }

    // Start auto-scroll when dragging
    if (isDragging) {
      startAutoScroll(e.clientY);
    }
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;

    if (dragCounterRef.current === 0) {
      setDropTarget(null);
      stopAutoScroll();
    }
  };

  const onDrop = (e: React.DragEvent, targetId?: string, position?: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(null);
    dragCounterRef.current = 0;
    stopAutoScroll();

    try {
      const data = e.dataTransfer.getData("application/json");
      if (!data) return;

      const item = JSON.parse(data) as DragItem;

      // Check if we accept this type
      if (options.acceptTypes && !options.acceptTypes.includes(item.type)) {
        return;
      }

      const result: DropResult = {
        targetId,
        position,
        action: e.ctrlKey || e.metaKey ? "copy" : "move",
      };

      options.onDrop?.(item, result);
    } catch (error) {
      console.error("Error handling drop:", error);
    }
  };

  return {
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop,
    onDragEnter,
    onDragLeave,
    isDragging,
    draggedItem,
    dropTarget,
  };
};

export const createDragItem = (
  id: string,
  type: string,
  data: any,
): DragItem => ({
  id,
  type,
  data,
});
