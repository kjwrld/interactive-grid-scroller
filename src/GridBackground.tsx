import React, { useMemo, useRef, useEffect } from "react";
import { extend, useFrame, useThree } from "@react-three/fiber";
import { useControls } from "leva";
import * as THREE from "three";

extend({ LineSegments: THREE.LineSegments });

const GridBackground: React.FC<{
  cursorPosition: { x: number; y: number };
}> = ({ cursorPosition }) => {
  const { size, camera } = useThree();
  const gridRef = useRef<THREE.LineSegments>(null);
  const raycaster = useRef(new THREE.Raycaster());

  const { uRadius, uGridSpacing, uPulseSpeed, uDarkColor } = useControls({
    uRadius: { value: 5.0, min: 1.0, max: 10.0, step: 0.1 },
    uGridSpacing: { value: 1.5, min: 0.5, max: 5.0, step: 0.1 },
    uPulseSpeed: { value: 4.0, min: 0.1, max: 10.0, step: 0.1 },
    uDarkColor: { value: "#000000" },
  });

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
        uRadius: { value: uRadius },
        uGridSpacing: { value: uGridSpacing },
        uPulseSpeed: { value: uPulseSpeed },
        uDarkColor: { value: new THREE.Color(uDarkColor) },
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
        uniform vec3 uDarkColor;
        varying vec3 vPosition;

        // Ensure the triangle aligns with the top-left corner of the screen
        bool isTopLeftTriangle(vec3 position) {
          return position.x < 1.0 && position.y > -1.0 && position.y > position.x + 9.0;
        }

        void main() {
          if (isTopLeftTriangle(vPosition)) {
            // Always render the top-left triangle with the fixed color
            gl_FragColor = vec4(uDarkColor, 1.0);
            return;
          }

          // Calculate distance from the cursor
          float dist = length(uCursor - vPosition.xy);

          // Generate pulsing wave effect
          float wave = sin((dist - uTime * uPulseSpeed) / uGridSpacing);

          // Normalize pulse effect
          float pulseEffect = 0.5 + 0.5 * wave;

          // Visibility based on distance from the cursor
          float visibility = smoothstep(uRadius, uRadius - 3.0, dist);

          // Apply the pulse effect to the color
          vec3 finalColor = mix(vec3(1.0), uDarkColor, pulseEffect);

          // Output the final color with visibility
          gl_FragColor = vec4(finalColor, visibility);
        }
      `,
      transparent: true,
    });

    return { geometry: gridGeometry, material: gridMaterial };
  }, [size, uRadius, uGridSpacing, uPulseSpeed, uDarkColor]);

  useFrame((state) => {
    if (gridRef.current) {
      const { x, y } = cursorPosition;

      const ndcX = (x / window.innerWidth) * 2 - 1;
      const ndcY = -(y / window.innerHeight) * 2 + 1;

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
