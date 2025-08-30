"use client";
import { useState, useRef, useEffect } from "react";

interface CircularToolboxProps {
  selectedTool: "pen" | "eraser";
  selectedColor: string;
  strokeWidth: number;
  onToolChange: (tool: "pen" | "eraser") => void;
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onUndo: () => void;
  onClear: () => void;
  onMinimize: () => void;
  isVisible: boolean;
}

export default function CircularToolbox({
  selectedTool,
  selectedColor,
  strokeWidth,
  onToolChange,
  onColorChange,
  onStrokeWidthChange,
  onUndo,
  onClear,
  onMinimize,
  isVisible,
}: CircularToolboxProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const toolboxRef = useRef<HTMLDivElement>(null);

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    // Allow dragging from the main circular button or header area
    const target = e.target as HTMLElement;
    if (
      target.closest(".toolbox-header") ||
      target.closest(".toolbox-title") ||
      target.closest(".toolbox-main-button")
    ) {
      e.preventDefault();
      setIsDragging(true);

      // Calculate offset from current position, not from element bounds
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
      console.log("🎯 Started dragging toolbox from position:", position);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // In fullscreen mode, allow dragging anywhere
      // Otherwise, constrain to screen bounds
      let constrainedX = newX;
      let constrainedY = newY;

      if (!document.fullscreenElement) {
        const maxX = window.innerWidth - 220; // toolbox width
        const maxY = window.innerHeight - 300; // toolbox height
        constrainedX = Math.max(0, Math.min(newX, maxX));
        constrainedY = Math.max(0, Math.min(newY, maxY));
      }

      // Update position immediately for smooth dragging
      setPosition({
        x: constrainedX,
        y: constrainedY,
      });

      // Log less frequently to avoid console spam
      if (Math.abs(newX - position.x) > 5 || Math.abs(newY - position.y) > 5) {
        console.log("🎯 Dragging toolbox to:", {
          x: constrainedX,
          y: constrainedY,
        });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreenNow = !!document.fullscreenElement;
      setIsFullscreen(isFullscreenNow);

      // If entering fullscreen, position toolbox in center
      if (isFullscreenNow && !position.x && !position.y) {
        setPosition({
          x: window.innerWidth / 2 - 110, // center horizontally
          y: window.innerHeight / 2 - 150, // center vertically
        });
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    handleFullscreenChange(); // Check initial state

    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [position.x, position.y]);

  // Removed automatic cursor following - toolbar only moves when dragged

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragOffset, handleMouseMove]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed z-[9999]"
      style={{
        left: position.x || "auto",
        top: position.y || "auto",
        right: position.x ? "auto" : "24px",
        bottom: position.y ? "auto" : "24px",
      }}
    >
      {/* Main circular button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`toolbox-main-button w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center text-xl cursor-move ${
          isDragging
            ? "bg-purple-600 hover:bg-purple-700 scale-110 shadow-xl"
            : "bg-blue-600 hover:bg-blue-700"
        } text-white hover:scale-105`}
        title={
          isExpanded ? "Collapse toolbox" : "Expand toolbox (drag to move)"
        }
        onMouseDown={handleMouseDown}
      >
        {isExpanded ? "−" : isDragging ? "🎯" : "⚙️"}
      </button>

      {/* Expanded tools */}
      {isExpanded && (
        <div
          ref={toolboxRef}
          className="absolute bottom-16 right-0 bg-white rounded-xl shadow-2xl border border-gray-200 p-3 min-w-[220px]"
          title="Remote tools toolbox"
        >
          {/* Header - Draggable area */}
          <div
            className="toolbox-header flex items-center justify-between mb-3 cursor-move select-none hover:bg-gray-50 rounded-lg p-1 transition-colors"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-2">
              <h3 className="toolbox-title text-xs font-semibold text-gray-800">
                Remote Tools
              </h3>
            </div>
            <div className="flex gap-1">
              <button
                onClick={onMinimize}
                className="w-6 h-6 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full flex items-center justify-center text-xs transition-colors"
                title="Minimize fullscreen"
              >
                ⛶
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="w-6 h-6 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs transition-colors"
                title="Close toolbox"
              >
                ×
              </button>
            </div>
          </div>

          {/* Tool Selection */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Tool:
            </label>
            <div className="flex gap-1">
              <button
                onClick={() => onToolChange("pen")}
                className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                  selectedTool === "pen"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                ✏️ Pen
              </button>
              <button
                onClick={() => onToolChange("eraser")}
                className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                  selectedTool === "eraser"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                🧽 Eraser
              </button>
            </div>
          </div>

          {/* Color and Size Controls */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-xs font-medium text-gray-700">
                Color:
              </label>
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => onColorChange(e.target.value)}
                className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
                title="Remote drawing color"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700">Size:</label>
              <input
                type="range"
                min="1"
                max="20"
                value={strokeWidth}
                onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs text-gray-600 w-4">{strokeWidth}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1 mb-2">
            <button
              onClick={onUndo}
              className="flex-1 px-2 py-1.5 rounded text-xs bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium"
              title="Remote Undo (Ctrl+Z)"
            >
              ↩️ Undo
            </button>
            <button
              onClick={onClear}
              className="flex-1 px-2 py-1.5 rounded text-xs bg-red-500 text-white hover:bg-red-600 font-medium"
              title="Remote Clear (Ctrl+K)"
            >
              🗑️ Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
