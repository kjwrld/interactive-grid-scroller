// GridBackground.tsx
import React, { useMemo, useRef, useEffect } from "react";
import { extend, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

extend({ LineSegments: THREE.LineSegments });

const GridBackground: React.FC<{
  cursorPosition: { x: number; y: number };
}> = ({ cursorPosition }) => {
  const { size, camera } = useThree();
  const gridRef = useRef<THREE.LineSegments>(null);
  const raycaster = useRef(new THREE.Raycaster());

  const { geometry, material } = useMemo(() => {
    const width = size.width;
    const height = size.height;
    const spacing = 1;

    const positions: number[] = [];

    // Generate vertical and horizontal grid lines
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
        uTime: { value: 0.0 },
        uRadius: { value: 5.0 }, // Larger effect radius
        uGridSpacing: { value: 1 }, // Lower frequency
        uPulseSpeed: { value: 4.0 }, // Slower wave speed
        uBaseColor: { value: new THREE.Color(0xd7d7d7) }, // Dark grid color
        uHighlightColor: { value: new THREE.Color(0xf7f7f7) }, // White pulse color
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
        uniform float uTime;
        uniform float uRadius;
        uniform float uGridSpacing;
        uniform float uPulseSpeed;
        uniform vec3 uBaseColor;
        uniform vec3 uHighlightColor;
        varying vec3 vPosition;

        void main() {
          // Calculate the distance from the current fragment to the cursor
          float dist = length(uCursor - vPosition.xy);

          // Smoothly fade the effect using a wider range in smoothstep
          float visibility = smoothstep(uRadius, uRadius - 3.0, dist);

          // Generate a slower, lower frequency pulsing wave
          float wave = sin((dist - uTime * uPulseSpeed) / uGridSpacing) * visibility;

          // Normalize the wave effect to the range [0, 1]
          float pulseEffect = 0.5 + 0.5 * wave;

          // Blend the base and highlight colors based on the pulse effect
          vec3 color = mix(uBaseColor, uHighlightColor, pulseEffect * visibility);

          // Output the final color with smooth alpha blending
          gl_FragColor = vec4(color, visibility); 
        }
      `,
      transparent: true,
    });

    return { geometry: gridGeometry, material: gridMaterial };
  }, [size]);

  // Track the cursor position and update the shader
  useFrame((state) => {
    if (gridRef.current) {
      const { x, y } = cursorPosition;

      // Convert cursor position to NDC (Normalized Device Coordinates)
      const ndcX = (x / window.innerWidth) * 2 - 1;
      const ndcY = -(y / window.innerHeight) * 2 + 1;

      // Raycast to find the world position on the grid plane
      raycaster.current.setFromCamera({ x: ndcX, y: ndcY }, camera);
      const intersectionPoint = new THREE.Vector3();
      raycaster.current.ray.intersectPlane(
        new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
        intersectionPoint
      );

      // Update shader uniforms with cursor position and elapsed time
      material.uniforms.uCursor.value.set(
        intersectionPoint.x,
        intersectionPoint.y
      );
      material.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  // Clean up resources on unmount
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return <lineSegments ref={gridRef} geometry={geometry} material={material} />;
};

export default GridBackground;
