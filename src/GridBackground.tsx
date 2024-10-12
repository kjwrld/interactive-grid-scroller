// GridBackground.tsx
import React, { useMemo, useRef, useEffect } from "react";
import { extend, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Extend UnrealBloomPass and LineSegments
extend({ LineSegments: THREE.LineSegments });

const GridBackground: React.FC<{
  cursorPosition: { x: number; y: number };
}> = ({ cursorPosition }) => {
  const { size, viewport, camera } = useThree();
  const gridRef = useRef<THREE.LineSegments>(null);
  const raycaster = useRef(new THREE.Raycaster()); // Create a Raycaster

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
        uBaseColor: { value: new THREE.Color(0xd7d7d7) },
        uHighlightColor: { value: new THREE.Color(0xf7f7f7) },
        uRadius: { value: 2.0 },
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
        uniform float uRadius;
        uniform vec3 uBaseColor;
        uniform vec3 uHighlightColor;
        varying vec3 vPosition;

        void main() {
          float dist = length(uCursor - vPosition.xy);
          float visibility = 1.0 - smoothstep(uRadius - 0.1, uRadius, dist);
          vec3 color = mix(uBaseColor, uHighlightColor, visibility);
          gl_FragColor = vec4(color, visibility);
        }
      `,
      transparent: true,
    });

    return { geometry: gridGeometry, material: gridMaterial };
  }, [size]);

  // Update shader uniforms every frame
  useFrame((state) => {
    if (gridRef.current) {
      const { x, y } = cursorPosition;

      // Convert mouse coordinates to normalized device coordinates (NDC)
      const ndcX = (x / window.innerWidth) * 2 - 1;
      const ndcY = -(y / window.innerHeight) * 2 + 1;

      // Use the raycaster to find the point on the plane at z=0
      raycaster.current.setFromCamera({ x: ndcX, y: ndcY }, camera);
      const intersectionPoint = new THREE.Vector3();
      raycaster.current.ray.intersectPlane(
        new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
        intersectionPoint
      );

      // Update the cursor uniform with the intersection point
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
