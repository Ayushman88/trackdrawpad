"use client";
import { useState, useRef, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import CircularToolbox from "./CircularToolbox";

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

export default function Trackpad() {
  const [isConnected, setIsConnected] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait"
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<"pen" | "eraser">("pen");
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);

  const trackpadRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Detect mobile device and orientation
    const checkDevice = () => {
      const mobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      setIsMobile(mobile);

      if (mobile) {
        const isLandscape = window.innerWidth > window.innerHeight;
        setOrientation(isLandscape ? "landscape" : "portrait");
      }
    };

    const handleOrientationChange = () => {
      if (isMobile) {
        const isLandscape = window.innerWidth > window.innerHeight;
        setOrientation(isLandscape ? "landscape" : "portrait");
      }
    };

    const handleResize = () => {
      if (isMobile) {
        const isLandscape = window.innerWidth > window.innerHeight;
        setOrientation(isLandscape ? "landscape" : "portrait");
      }
    };

    checkDevice();
    window.addEventListener("orientationchange", handleOrientationChange);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.removeEventListener("resize", handleResize);
    };
  }, [isMobile]);

  useEffect(() => {
    const connectSocket = () => {
      console.log("🔌 Trackpad attempting to connect to Socket.IO server...");
      const socket = io("http://localhost:3000");
      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("✅ Trackpad connected to Socket.IO server");
        setIsConnected(true);
      });

      socket.on("disconnect", () => {
        console.log("❌ Trackpad disconnected from Socket.IO server");
        setIsConnected(false);
      });

      socket.on("connect_error", (error) => {
        console.error("❌ Trackpad Socket.IO connection error:", error);
        setIsConnected(false);
      });
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        console.log("🧹 Trackpad cleaning up socket connection");
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z") {
          e.preventDefault();
          undoLastDrawing();
        } else if (e.key === "k") {
          e.preventDefault();
          clearCanvas();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreenNow = !!document.fullscreenElement;
      console.log("Fullscreen change detected:", isFullscreenNow);
      setIsFullscreen(isFullscreenNow);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const sendCursorEvent = (event: CursorEvent) => {
    if (socketRef.current && socketRef.current.connected) {
      console.log("Trackpad sending cursor event:", event);
      socketRef.current.emit("cursor-event", event);
    } else {
      console.warn(
        "Trackpad socket not connected, cannot send event. Connected:",
        socketRef.current?.connected
      );
    }
  };

  const getRelativePosition = (clientX: number, clientY: number) => {
    if (!trackpadRef.current) return { x: 0, y: 0 };
    const rect = trackpadRef.current.getBoundingClientRect();
    const x = Math.max(
      0,
      Math.min(100, ((clientX - rect.left) / rect.width) * 100)
    );
    const y = Math.max(
      0,
      Math.min(100, ((clientY - rect.top) / rect.height) * 100)
    );
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = getRelativePosition(e.clientX, e.clientY);
    console.log("Trackpad mouse down:", pos);
    setCursorPosition(pos);
    setIsDrawing(true);

    sendCursorEvent({
      type: "mousedown",
      x: pos.x,
      y: pos.y,
      timestamp: Date.now(),
      tool: selectedTool,
      color: selectedColor,
      strokeWidth: strokeWidth,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = getRelativePosition(e.clientX, e.clientY);
    setCursorPosition(pos);

    if (isDrawing) {
      console.log("Trackpad mouse move:", pos);
      sendCursorEvent({
        type: "mousemove",
        x: pos.x,
        y: pos.y,
        timestamp: Date.now(),
        tool: selectedTool,
        color: selectedColor,
        strokeWidth: strokeWidth,
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDrawing) {
      console.log("Trackpad mouse up:", cursorPosition);
      setIsDrawing(false);

      sendCursorEvent({
        type: "mouseup",
        x: cursorPosition.x,
        y: cursorPosition.y,
        timestamp: Date.now(),
        tool: selectedTool,
        color: selectedColor,
        strokeWidth: strokeWidth,
      });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    const pos = getRelativePosition(touch.clientX, touch.clientY);
    console.log("Trackpad touch start:", pos);
    setCursorPosition(pos);
    setIsDrawing(true);

    sendCursorEvent({
      type: "touchstart",
      x: pos.x,
      y: pos.y,
      pressure: (touch as Touch & { force?: number }).force || 0.5,
      timestamp: Date.now(),
      tool: selectedTool,
      color: selectedColor,
      strokeWidth: strokeWidth,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    const pos = getRelativePosition(touch.clientX, touch.clientY);
    setCursorPosition(pos);

    if (isDrawing) {
      console.log("Trackpad touch move:", pos);
      sendCursorEvent({
        type: "touchmove",
        x: pos.x,
        y: pos.y,
        pressure: (touch as Touch & { force?: number }).force || 0.5,
        timestamp: Date.now(),
        tool: selectedTool,
        color: selectedColor,
        strokeWidth: strokeWidth,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDrawing) {
      console.log("Trackpad touch end:", cursorPosition);
      setIsDrawing(false);

      sendCursorEvent({
        type: "touchend",
        x: cursorPosition.x,
        y: cursorPosition.y,
        timestamp: Date.now(),
        tool: selectedTool,
        color: selectedColor,
        strokeWidth: strokeWidth,
      });
    }
  };

  const clearCanvas = () => {
    // Send clear command to remote whiteboard
    if (socketRef.current && socketRef.current.connected) {
      console.log("🗑️ Sending clear command to remote whiteboard");
      console.log("Socket connected:", socketRef.current.connected);
      console.log("Socket ID:", socketRef.current.id);
      console.log("Emitting whiteboard-command with action: clear");

      // Add a small delay to ensure whiteboard is ready
      setTimeout(() => {
        socketRef.current?.emit("whiteboard-command", { action: "clear" });
        console.log("✅ Clear command sent successfully");
      }, 50);
    } else {
      console.warn("Socket not connected, cannot send clear command");
      console.log("Socket ref:", socketRef.current);
      console.log("Socket connected:", socketRef.current?.connected);
    }
  };

  const undoLastDrawing = () => {
    // Send undo command to remote whiteboard
    if (socketRef.current && socketRef.current.connected) {
      console.log("↩️ Sending undo command to remote whiteboard");
      console.log("Socket connected:", socketRef.current.connected);
      console.log("Socket ID:", socketRef.current.id);
      console.log("Emitting whiteboard-command with action: undo");

      // Add a small delay to ensure whiteboard is ready
      setTimeout(() => {
        socketRef.current?.emit("whiteboard-command", { action: "undo" });
        console.log("✅ Undo command sent successfully");
      }, 50);
    } else {
      console.warn("Socket not connected, cannot send undo command");
      console.log("Socket ref:", socketRef.current);
      console.log("Socket connected:", socketRef.current?.connected);
    }
  };

  const toggleFullscreen = () => {
    console.log("Toggle fullscreen called, current state:", isFullscreen);
    if (!document.fullscreenElement) {
      console.log("Requesting fullscreen...");
      // Try to request fullscreen on the document body for better compatibility
      document.documentElement
        .requestFullscreen()
        .then(() => {
          console.log("Fullscreen granted");
          setIsFullscreen(true);
        })
        .catch((err) => {
          console.error("Fullscreen error:", err);
          // Fallback to trackpad element
          trackpadRef.current
            ?.requestFullscreen()
            .then(() => {
              console.log("Fullscreen granted on trackpad element");
              setIsFullscreen(true);
            })
            .catch((err2) => {
              console.error("Trackpad fullscreen error:", err2);
            });
        });
    } else {
      console.log("Exiting fullscreen...");
      document
        .exitFullscreen()
        .then(() => {
          console.log("Fullscreen exited");
          setIsFullscreen(false);
        })
        .catch((err) => {
          console.error("Exit fullscreen error:", err);
        });
    }
  };

  const testConnection = () => {
    console.log("Testing trackpad connection...");
    const testEvent: CursorEvent = {
      type: "mousedown",
      x: 25,
      y: 25,
      timestamp: Date.now(),
    };
    sendCursorEvent(testEvent);

    setTimeout(() => {
      const moveEvent: CursorEvent = {
        type: "mousemove",
        x: 50,
        y: 50,
        timestamp: Date.now(),
      };
      sendCursorEvent(moveEvent);
    }, 100);

    setTimeout(() => {
      const upEvent: CursorEvent = {
        type: "mouseup",
        x: 75,
        y: 75,
        timestamp: Date.now(),
      };
      sendCursorEvent(upEvent);
    }, 200);
  };

  // Mobile-specific trackpad dimensions
  const getTrackpadDimensions = () => {
    if (isFullscreen) {
      return {
        width: "100vw",
        height: "100vh",
        className: "fullscreen-trackpad",
      };
    } else if (isMobile && orientation === "landscape") {
      return {
        width: "100vw",
        height: "100vh",
        className: "mobile-landscape-trackpad",
      };
    } else if (isMobile) {
      return {
        width: "100%",
        height: "60vh",
        className: "mobile-portrait-trackpad",
      };
    } else {
      return {
        width: "100%",
        height: "12rem",
        className: "desktop-trackpad",
      };
    }
  };

  const trackpadDimensions = getTrackpadDimensions();

  console.log(
    "Trackpad render - isFullscreen:",
    isFullscreen,
    "document.fullscreenElement:",
    !!document.fullscreenElement
  );

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-2 sm:p-4 responsive-transition ${
        isFullscreen ? "fixed inset-0 z-50" : ""
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800">
          Trackpad
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-xs sm:text-sm text-gray-600">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
          {isFullscreen && (
            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
              ⛶ Fullscreen
            </span>
          )}
          {isMobile && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
              {orientation === "landscape" ? "🌊 Landscape" : "📱 Portrait"}
            </span>
          )}
          <button
            onClick={testConnection}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Test
          </button>
        </div>
      </div>

      {/* Toolbar - Hidden in fullscreen mode */}
      {!isFullscreen && (
        <div className="bg-gray-50 rounded-lg p-2 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Tool Selection */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedTool("pen")}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  selectedTool === "pen"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                title="Remote pen tool for whiteboard"
              >
                ✏️ Remote Pen
              </button>
              <button
                onClick={() => setSelectedTool("eraser")}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  selectedTool === "eraser"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                title="Remote eraser tool for whiteboard"
              >
                🧽 Remote Eraser
              </button>
            </div>

            {/* Color and Size Controls */}
            <div className="flex items-center gap-1">
              <label className="text-xs font-medium text-gray-700">
                Remote Color:
              </label>
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-6 h-6 rounded border border-gray-300 cursor-pointer"
                title="Color for remote whiteboard drawing"
              />
            </div>
            <div className="flex items-center gap-1">
              <label className="text-xs font-medium text-gray-700">
                Remote Size:
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-16"
                title="Stroke width for remote whiteboard drawing"
              />
              <span className="text-xs text-gray-600 w-4">{strokeWidth}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={undoLastDrawing}
                className="px-2 py-1 rounded text-xs bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium"
                title="Remote Undo (Ctrl+Z)"
              >
                ↩️ Remote Undo
              </button>
              <button
                onClick={clearCanvas}
                className="px-2 py-1 rounded text-xs bg-red-500 text-white hover:bg-red-600 font-medium"
                title="Remote Clear (Ctrl+K)"
              >
                🗑️ Remote Clear
              </button>

              <button
                onClick={toggleFullscreen}
                className="px-2 py-1 rounded text-xs bg-purple-500 text-white hover:bg-purple-600 font-medium"
                title="Toggle Fullscreen"
              >
                ⛶ Fullscreen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen controls */}
      {isFullscreen && (
        <div className="absolute top-4 right-4 z-[9999] flex gap-2">
          <button
            onClick={() => window.history.back()}
            className="px-3 py-2 rounded text-sm bg-red-600 text-white hover:bg-red-700 font-medium shadow-lg"
            title="Go Back"
          >
            ← Back
          </button>
          <button
            onClick={toggleFullscreen}
            className="px-3 py-2 rounded text-sm bg-purple-600 text-white hover:bg-purple-700 font-medium shadow-lg"
            title="Exit Fullscreen"
          >
            ⛶ Exit
          </button>
        </div>
      )}

      {/* Mobile orientation hint */}
      {isMobile && orientation === "portrait" && !isFullscreen && (
        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800">
            <span className="text-lg">📱</span>
            <div className="text-sm">
              <p className="font-medium">
                Rotate to landscape for better control
              </p>
              <p className="text-xs opacity-80">
                Horizontal orientation provides more control space
              </p>
            </div>
          </div>
        </div>
      )}

      <div
        ref={trackpadRef}
        className={`relative bg-gray-100 rounded-lg border-2 border-gray-300 cursor-crosshair overflow-hidden no-select ${
          isFullscreen ? "fullscreen-trackpad" : trackpadDimensions.className
        }`}
        style={{
          width: trackpadDimensions.width,
          height: trackpadDimensions.height,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Cursor indicator */}
        <div
          className="absolute w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75"
          style={{
            left: `${cursorPosition.x}%`,
            top: `${cursorPosition.y}%`,
            opacity: isDrawing ? 0.8 : 0.6,
          }}
        />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
              `,
              backgroundSize: isMobile ? "15px 15px" : "20px 20px",
            }}
          />
        </div>

        {/* Status indicator */}
        <div className="absolute bottom-2 left-2 right-2 text-center pointer-events-none">
          <p
            className={`text-xs px-2 py-1 rounded ${
              isDrawing ? "text-white bg-red-500" : "text-gray-500 bg-white/80"
            }`}
          >
            {isDrawing
              ? "Controlling remote whiteboard..."
              : isMobile
              ? "Touch and drag to control remote whiteboard"
              : "Click and drag to control remote whiteboard"}
          </p>
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-500 text-center">
        Position: {cursorPosition.x.toFixed(1)}%, {cursorPosition.y.toFixed(1)}%
        {!isFullscreen && (
          <span className="ml-2">
            • Remote shortcuts: Ctrl+Z (Undo), Ctrl+K (Clear)
          </span>
        )}
      </div>

      {/* Mobile-specific instructions */}
      {isMobile && !isFullscreen && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Mobile Remote Control Tips:
          </h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Use landscape mode for better precision</li>
            <li>• Touch and drag to control remote whiteboard</li>
            <li>• Keep your finger on screen while drawing</li>
            <li>• Works best with stylus or finger</li>
            <li>• Use fullscreen mode for maximum control space</li>
            <li>• Tools and colors affect remote whiteboard drawing</li>
          </ul>
        </div>
      )}

      {/* Circular Toolbox for Fullscreen Mode */}
      <CircularToolbox
        selectedTool={selectedTool}
        selectedColor={selectedColor}
        strokeWidth={strokeWidth}
        onToolChange={setSelectedTool}
        onColorChange={setSelectedColor}
        onStrokeWidthChange={setStrokeWidth}
        onUndo={undoLastDrawing}
        onClear={clearCanvas}
        onMinimize={toggleFullscreen}
        isVisible={isFullscreen}
      />
    </div>
  );
}
