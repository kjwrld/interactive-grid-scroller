// GridBackground.tsx
import React, { useMemo, useRef, useEffect } from "react";
import { useThree, extend } from "@react-three/fiber";
import * as THREE from "three";

// Extend LineSegments so it can be used declaratively in R3F
extend({ LineSegments: THREE.LineSegments });

const GridBackground: React.FC = () => {
  const { size } = useThree(); // Get viewport size
  const gridRef = useRef<THREE.LineSegments>(null);

  // Create grid geometry and material
  const { geometry, material } = useMemo(() => {
    const width = size.width;
    const height = size.height;
    const spacing = 1; // Adjust grid line spacing

    const positions: number[] = []; // Explicitly type positions as number[]

    // Generate vertical lines
    for (let x = -width / 2; x <= width / 2; x += spacing) {
      positions.push(x, -height / 2, 0, x, height / 2, 0);
    }

    // Generate horizontal lines
    for (let y = -height / 2; y <= height / 2; y += spacing) {
      positions.push(-width / 2, y, 0, width / 2, y, 0);
    }

    // Set the positions as buffer attributes
    const gridGeometry = new THREE.BufferGeometry();
    const positionAttribute = new THREE.Float32BufferAttribute(positions, 3);
    gridGeometry.setAttribute("position", positionAttribute);

    const lineMaterial = new THREE.LineBasicMaterial({ color: "#D7D7D7" });

    return { geometry: gridGeometry, material: lineMaterial };
  }, [size]);

  // Clean up the geometry when the component unmounts
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return <lineSegments ref={gridRef} geometry={geometry} material={material} />;
};

export default GridBackground;
