// GridBackground.tsx
import React, { useMemo, useRef, useEffect } from "react";
import { extend, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Extend LineSegments so it can be used declaratively in R3F
extend({ LineSegments: THREE.LineSegments });

const GridBackground: React.FC<{
  cursorPosition: { x: number; y: number };
}> = ({ cursorPosition }) => {
  const { size, viewport } = useThree();
  const gridRef = useRef<THREE.LineSegments>(null);

  const { geometry, material } = useMemo(() => {
    const width = size.width;
    const height = size.height;
    const spacing = 1;

    const positions: number[] = [];

    // Create vertical and horizontal lines
    for (let x = -width / 2; x <= width / 2; x += spacing) {
      positions.push(x, -height / 2, 0, x, height / 2, 0);
    }
    for (let y = -height / 2; y <= height / 2; y += spacing) {
      positions.push(-width / 2, y, 0, width / 2, y, 0);
    }

    const gridGeometry = new THREE.BufferGeometry();
    const positionAttribute = new THREE.Float32BufferAttribute(positions, 3);
    gridGeometry.setAttribute("position", positionAttribute);

    const gridMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uCursor: { value: new THREE.Vector2(0, 0) },
        uViewport: {
          value: new THREE.Vector2(viewport.width, viewport.height),
        },
        uColor: { value: new THREE.Color(0xd7d7d7) },
      },
      vertexShader: `
        varying vec3 vPosition;
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec2 uCursor;
        uniform vec2 uViewport;

        void main() {
          // Normalize cursor position to a 0 to 1 range
          vec2 cursor = uCursor / uViewport;

          // Map X and Y coordinates to red and green channels
          vec3 color = vec3(cursor.x, cursor.y, 0.0);

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      transparent: true,
    });

    return { geometry: gridGeometry, material: gridMaterial };
  }, [size, viewport]);

  useFrame(() => {
    if (gridRef.current) {
      material.uniforms.uCursor.value.set(cursorPosition.x, cursorPosition.y);
    }
    // console.log("Cursor Position:", cursorPosition);
  });

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return <lineSegments ref={gridRef} geometry={geometry} material={material} />;
};

export default GridBackground;
