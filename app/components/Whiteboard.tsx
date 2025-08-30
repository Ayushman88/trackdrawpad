"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { io, Socket } from "socket.io-client";

interface Point {
  x: number;
  y: number;
}

interface DrawingPath {
  id: string;
  points: Point[];
  color: string;
  strokeWidth: number;
  tool: "pen" | "eraser";
}

interface CursorEvent {
  type:
    | "mousedown"
    | "mousemove"
    | "mouseup"
    | "touchstart"
    | "touchmove"
    | "touchend";
  x: number;
  y: number;
  pressure?: number;
  timestamp: number;
  tool?: "pen" | "eraser";
  color?: string;
  strokeWidth?: number;
}

export default function Whiteboard() {
  const [drawings, setDrawings] = useState<DrawingPath[]>([]);
  const [localCurrentPath, setLocalCurrentPath] = useState<DrawingPath | null>(
    null
  );
  const [remoteCurrentPath, setRemoteCurrentPath] =
    useState<DrawingPath | null>(null);
  const [isLocalDrawing, setIsLocalDrawing] = useState(false);
  const [isRemoteDrawing, setIsRemoteDrawing] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [selectedTool, setSelectedTool] = useState<"pen" | "eraser">("pen");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [remoteCursor, setRemoteCursor] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const isRemoteDrawingRef = useRef(false);
  const remoteCurrentPathRef = useRef<DrawingPath | null>(null);
  const drawingsRef = useRef<DrawingPath[]>([]);
  const lastUndoTimeRef = useRef<number>(0);

  useEffect(() => {
    // Detect mobile device
    const checkDevice = () => {
      const mobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      setIsMobile(mobile);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  useEffect(() => {
    isRemoteDrawingRef.current = isRemoteDrawing;
  }, [isRemoteDrawing]);

  useEffect(() => {
    remoteCurrentPathRef.current = remoteCurrentPath;
  }, [remoteCurrentPath]);

  // Keep drawings ref in sync with state
  useEffect(() => {
    drawingsRef.current = drawings;
  }, [drawings]);

  useEffect(() => {
    const connectSocket = () => {
      const socket = io("http://localhost:3000");
      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("✅ Whiteboard connected to Socket.IO server");
        console.log("🆔 Whiteboard socket ID:", socket.id);
        console.log("🔗 Whiteboard socket connected:", socket.connected);
        setIsConnected(true);
        setConnectionError(null);
      });

      socket.on("cursor-event", (data: CursorEvent) => {
        console.log("🎯 Whiteboard received cursor event:", data);
        console.log("🔧 Tool info:", {
          tool: data.tool,
          color: data.color,
          strokeWidth: data.strokeWidth,
        });
        handleRemoteCursorEvent(data);
      });

      // Debug: Log socket connection
      console.log("🔍 Whiteboard socket connected successfully");

      // Verify event listeners are attached
      console.log("🔍 Attaching whiteboard-command listener...");

      socket.on("whiteboard-command", (command: { action: string }) => {
        console.log("🎯 Whiteboard received command:", command);
        console.log("🎯 Command action:", command.action);
        console.log("🎯 Current drawings count:", drawingsRef.current.length);
        console.log("🎯 Socket ID:", socket.id);
        console.log("🎯 Socket connected:", socket.connected);
        console.log("🎯 Command type:", typeof command);
        console.log("🎯 Command keys:", Object.keys(command));
        console.log("🎯 SVG ref available:", !!svgRef.current);

        // Ensure we're ready to process commands
        if (!svgRef.current) {
          console.log("⚠️ SVG not ready, queuing command for later");
          // Queue the command to be processed when SVG is ready
          setTimeout(() => {
            console.log("🔄 Retrying command:", command);
            // Re-emit the command to ourselves
            socket.emit("whiteboard-command", command);
          }, 100);
          return;
        }

        switch (command.action) {
          case "clear":
            console.log("🗑️ Clearing whiteboard from remote command");
            setDrawings([]);
            setLocalCurrentPath(null);
            setRemoteCurrentPath(null);
            console.log("🗑️ Whiteboard cleared successfully");
            break;
          case "undo":
            console.log("↩️ Undoing last drawing from remote command");
            const now = Date.now();
            // Prevent multiple undo operations within 100ms
            if (now - lastUndoTimeRef.current < 100) {
              console.log("⚠️ Ignoring rapid undo command (debounced)");
              break;
            }
            lastUndoTimeRef.current = now;

            if (drawingsRef.current.length > 0) {
              setDrawings((prev) => {
                const newDrawings = prev.slice(0, -1);
                // Update the ref to match the new state
                drawingsRef.current = newDrawings;
                return newDrawings;
              });
              console.log("↩️ Last drawing undone successfully");
            } else {
              console.log("↩️ No drawings to undo");
            }
            break;

          default:
            console.log("❌ Unknown command:", command.action);
            console.log("❌ Full command object:", command);
        }
      });

      socket.on("disconnect", () => {
        console.log("❌ Whiteboard disconnected from Socket.IO server");
        setIsConnected(false);
      });

      socket.on("connect_error", (error) => {
        console.error("❌ Socket.IO error:", error);
        setIsConnected(false);
        setConnectionError(error.message);
      });
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Debug SVG ref availability
  useEffect(() => {
    if (svgRef.current) {
      console.log("🎨 SVG ref is now available");
    } else {
      console.log("⏳ SVG ref not yet available");
    }
  }, []);

  const handleRemoteMouseDown = useCallback(
    (
      x: number,
      y: number,
      tool?: "pen" | "eraser",
      color?: string,
      strokeWidth?: number
    ) => {
      console.log(
        "Remote mouse down:",
        x,
        y,
        "Tool:",
        tool,
        "Color:",
        color,
        "Size:",
        strokeWidth
      );

      // Use remote tool settings if provided, otherwise fall back to local settings
      const remoteTool = tool || selectedTool;
      const remoteColor = color || selectedColor;
      const remoteStrokeWidth =
        strokeWidth || (remoteTool === "eraser" ? 20 : 2);

      const newPath: DrawingPath = {
        id: `remote-${Date.now()}`,
        points: [{ x, y }],
        color: remoteTool === "eraser" ? "#ffffff" : remoteColor,
        strokeWidth: remoteStrokeWidth,
        tool: remoteTool,
      };
      console.log("Created new remote path:", newPath);
      setRemoteCurrentPath(newPath);
      setIsRemoteDrawing(true);
    },
    [selectedColor, selectedTool]
  );

  const handleRemoteMouseMove = useCallback((x: number, y: number) => {
    console.log(
      "Remote mouse move called, isDrawing:",
      isRemoteDrawingRef.current
    );
    if (!isRemoteDrawingRef.current) {
      console.log("Ignoring remote mouse move - not drawing");
      return;
    }
    console.log("Remote mouse move:", x, y);
    setRemoteCurrentPath((prev) => {
      if (!prev) {
        console.log("No previous path available");
        return null;
      }
      const updatedPath = {
        ...prev,
        points: [...prev.points, { x, y }],
      };
      console.log(
        "Updated remote path with",
        updatedPath.points.length,
        "points"
      );
      return updatedPath;
    });
  }, []);

  const handleRemoteMouseUp = useCallback(() => {
    console.log("Remote mouse up");
    const currentPath = remoteCurrentPathRef.current;
    if (currentPath && currentPath.points.length > 1) {
      console.log("Adding remote path to drawings:", currentPath);
      setDrawings((prev) => [...prev, currentPath]);
    } else {
      console.log(
        "Remote path not added - insufficient points:",
        currentPath?.points.length
      );
    }
    setRemoteCurrentPath(null);
    setIsRemoteDrawing(false);
  }, []);

  const handleRemoteCursorEvent = useCallback(
    (event: CursorEvent) => {
      console.log("🔍 Processing remote cursor event:", event.type);
      if (!svgRef.current) {
        console.warn("❌ SVG ref not available");
        return;
      }

      const rect = svgRef.current.getBoundingClientRect();
      console.log("📐 SVG rect:", rect);
      const x = (event.x / 100) * rect.width;
      const y = (event.y / 100) * rect.height;

      console.log("📍 Calculated coordinates:", {
        x,
        y,
        original: { x: event.x, y: event.y },
      });
      setRemoteCursor({ x, y });

      switch (event.type) {
        case "mousedown":
        case "touchstart":
          console.log("🎨 Starting remote drawing...");
          handleRemoteMouseDown(
            x,
            y,
            event.tool,
            event.color,
            event.strokeWidth
          );
          break;
        case "mousemove":
        case "touchmove":
          console.log("✏️ Attempting remote mouse move...");
          handleRemoteMouseMove(x, y);
          break;
        case "mouseup":
        case "touchend":
          console.log("✅ Attempting remote mouse up...");
          handleRemoteMouseUp();
          break;
      }
    },
    [handleRemoteMouseDown, handleRemoteMouseMove, handleRemoteMouseUp]
  );

  const getMousePosition = useCallback(
    (event: React.MouseEvent<SVGSVGElement>): Point => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const rect = svgRef.current.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    },
    []
  );

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      const point = getMousePosition(event);
      const newPath: DrawingPath = {
        id: `local-${Date.now()}`,
        points: [point],
        color: selectedTool === "eraser" ? "#ffffff" : selectedColor,
        strokeWidth: selectedTool === "eraser" ? 20 : strokeWidth,
        tool: selectedTool,
      };
      setLocalCurrentPath(newPath);
      setIsLocalDrawing(true);
    },
    [getMousePosition, selectedColor, selectedTool, strokeWidth]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<SVGSVGElement>) => {
      if (!isLocalDrawing || !localCurrentPath) return;
      const point = getMousePosition(event);
      setLocalCurrentPath((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          points: [...prev.points, point],
        };
      });
    },
    [isLocalDrawing, localCurrentPath, getMousePosition]
  );

  const handleMouseUp = useCallback(() => {
    if (localCurrentPath && localCurrentPath.points.length > 1) {
      setDrawings((prev) => [...prev, localCurrentPath]);
    }
    setLocalCurrentPath(null);
    setIsLocalDrawing(false);
  }, [localCurrentPath]);

  const clearCanvas = () => {
    setDrawings([]);
    setLocalCurrentPath(null);
    setRemoteCurrentPath(null);
  };

  const undoLastDrawing = () => {
    setDrawings((prev) => {
      const newDrawings = prev.slice(0, -1);
      // Update the ref to match the new state
      drawingsRef.current = newDrawings;
      return newDrawings;
    });
  };

  return (
    <div className="p-4">
      <div className="max-w-6xl mx-auto">
        {/* Toolbar - Responsive design */}
        <div className="bg-white rounded-lg shadow-md p-2 sm:p-4 mb-3 sm:mb-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-gray-50">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-sm text-gray-700">
              {isConnected
                ? "Connected to trackpad"
                : "Disconnected from trackpad"}
            </span>
            {connectionError && (
              <span className="text-xs text-red-600 ml-2">
                Error: {connectionError}
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            {/* Tool Selection */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setSelectedTool("pen")}
                className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm ${
                  selectedTool === "pen"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                ✏️ Pen
              </button>
              <button
                onClick={() => setSelectedTool("eraser")}
                className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm ${
                  selectedTool === "eraser"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                🧽 Eraser
              </button>
            </div>

            {/* Color and Size Controls */}
            <div className="flex items-center gap-1 sm:gap-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700">
                Color:
              </label>
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 border-gray-300 cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700">
                Size:
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-16 sm:w-24"
              />
              <span className="text-xs sm:text-sm text-gray-600 w-6 sm:w-8">
                {strokeWidth}
              </span>
            </div>

            {/* Action Buttons - Responsive layout */}
            <div className="flex items-center gap-1 sm:gap-2 ml-auto flex-wrap">
              <button
                onClick={undoLastDrawing}
                disabled={drawings.length === 0}
                className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs sm:text-sm"
              >
                ↩️ Undo
              </button>
              <button
                onClick={clearCanvas}
                className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 font-medium text-xs sm:text-sm"
              >
                🗑️ Clear
              </button>
            </div>
          </div>
        </div>

        {/* Canvas - Responsive height */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-3 sm:mb-4">
          <svg
            ref={svgRef}
            width="100%"
            height={isMobile ? "60vh" : "500"}
            className="cursor-crosshair bg-white relative no-select"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Render completed drawings */}
            {drawings.map((path) => (
              <path
                key={path.id}
                d={`M ${path.points.map((p) => `${p.x} ${p.y}`).join(" L ")}`}
                stroke={path.color}
                strokeWidth={path.strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

            {/* Render local current path */}
            {localCurrentPath && localCurrentPath.points.length > 1 && (
              <path
                d={`M ${localCurrentPath.points
                  .map((p) => `${p.x} ${p.y}`)
                  .join(" L ")}`}
                stroke={localCurrentPath.color}
                strokeWidth={localCurrentPath.strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ pointerEvents: "none" }}
              />
            )}

            {/* Render remote current path */}
            {remoteCurrentPath && remoteCurrentPath.points.length > 1 && (
              <path
                d={`M ${remoteCurrentPath.points
                  .map((p) => `${p.x} ${p.y}`)
                  .join(" L ")}`}
                stroke={remoteCurrentPath.color}
                strokeWidth={remoteCurrentPath.strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ pointerEvents: "none" }}
              />
            )}

            {/* Remote cursor indicator */}
            {remoteCursor && (
              <circle
                cx={remoteCursor.x}
                cy={remoteCursor.y}
                r="6"
                fill="rgba(59, 130, 246, 0.3)"
                stroke="rgb(59, 130, 246)"
                strokeWidth="2"
                className="pointer-events-none"
              />
            )}
          </svg>
        </div>

        <div className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-gray-600">
          <p>
            Click and drag to draw. Use the trackpad on another device for
            remote drawing.
          </p>
          {isMobile && (
            <p className="mt-1 text-blue-600">
              📱 Mobile mode: Touch and drag to draw
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
