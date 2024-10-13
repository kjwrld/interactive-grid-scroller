// GridBackground.tsx
import React, { useMemo, useRef, useEffect } from "react";
import { extend, useFrame, useThree } from "@react-three/fiber";
import { UnrealBloomPass } from "three-stdlib";
import * as THREE from "three";

// Extend LineSegments and UnrealBloomPass
extend({ UnrealBloomPass, LineSegments: THREE.LineSegments });

const GridBackground: React.FC<{
  cursorPosition: { x: number; y: number };
}> = ({ cursorPosition }) => {
  const { size, camera } = useThree();
  const gridRef = useRef<THREE.LineSegments>(null);
  const raycaster = useRef(new THREE.Raycaster()); // Raycaster for cursor tracking

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
        uTime: { value: 0.0 },
        uGridSpacing: { value: 1.0 },
        uPulseSpeed: { value: 5.0 },
        uBaseColor: { value: new THREE.Color(0x222222) }, // Dark color
        uHighlightColor: { value: new THREE.Color(0xffffff) }, // White highlight
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
        uniform float uGridSpacing;
        uniform float uPulseSpeed;
        uniform vec3 uBaseColor;
        uniform vec3 uHighlightColor;
        varying vec3 vPosition;

        void main() {
          // Calculate distance from the current fragment to the cursor
          float dist = length(uCursor - vPosition.xy);

          // Generate a pulsing wave based on time and distance from the cursor
          float wave = sin((dist - uTime * uPulseSpeed) / uGridSpacing);

          // Normalize wave effect to 0-1 range
          float pulseEffect = 0.5 + 0.5 * wave;

          // Mix colors based on the pulse effect
          vec3 color = mix(uBaseColor, uHighlightColor, pulseEffect);

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      transparent: true,
    });

    return { geometry: gridGeometry, material: gridMaterial };
  }, [size]);

  // Use raycaster to convert cursor position to world space
  useFrame((state) => {
    if (gridRef.current) {
      const { x, y } = cursorPosition;

      // Convert mouse coordinates to NDC
      const ndcX = (x / window.innerWidth) * 2 - 1;
      const ndcY = -(y / window.innerHeight) * 2 + 1;

      // Use raycaster to find the point in world space at z=0
      raycaster.current.setFromCamera({ x: ndcX, y: ndcY }, camera);
      const intersectionPoint = new THREE.Vector3();
      raycaster.current.ray.intersectPlane(
        new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
        intersectionPoint
      );

      material.uniforms.uCursor.value.set(
        intersectionPoint.x,
        intersectionPoint.y
      );
      material.uniforms.uTime.value = state.clock.getElapsedTime();
    }
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
