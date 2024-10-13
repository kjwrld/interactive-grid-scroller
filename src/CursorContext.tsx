import React, { createContext, useContext, useState, useEffect } from "react";

// Create a context to store the cursor position
const CursorContext = createContext<{ x: number; y: number }>({ x: 0, y: 0 });

// Custom hook to use the cursor position context
export const useCursor = () => useContext(CursorContext);

export const CursorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <CursorContext.Provider value={cursorPosition}>
      {children}
    </CursorContext.Provider>
  );
};
