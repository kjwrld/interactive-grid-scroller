// App.tsx
import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import GridBackground from "./GridBackground.tsx";
import "./App.css";

function App() {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <>
      <Canvas camera={{ position: [0, 0, 10], fov: 75 }}>
        <ambientLight />
        <GridBackground cursorPosition={cursorPosition} />
      </Canvas>
      <div
        className="mouse-overlay"
        style={{
          left: `${cursorPosition.x}px`,
          top: `${cursorPosition.y}px`,
        }}
      />
    </>
  );
}

export default App;
