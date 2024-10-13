# Interactive Grid Background

### Inspired by JHey's Signature Corner Grid

The cursor moves as a radial gradiant highlighter lighting up the grid shader background

This project is built with React Three Fiber & Three.js 🔧

## Step 1:

### Algorithmic Grid Lines

<img width="707" alt="Screenshot 2024-10-12 at 4 50 53 AM" src="https://github.com/user-attachments/assets/12f3cb22-f580-4a5c-9eac-2de6a95811e2">

In order to mimic the grid lines for a 3D website background, lets generate a 2D grid by dividing the viewport into evenly spaced horizontal and vertical lines


```js

const { size } = useThree();
const width = size.width;
const height = size.height;

// Generate vertical lines
for (let x = -width / 2; x <= width / 2; x += spacing) {
  positions.push(x, -height / 2, 0, x, height / 2, 0);
}

// Generate horizontal lines
for (let y = -height / 2; y <= height / 2; y += spacing) {
  positions.push(-width / 2, y, 0, width / 2, y, 0);
}
```

We will use [BufferGeometry](https://threejs.org/docs/#api/en/core/BufferGeometry) try it out for yourself [here](https://threejs.org/examples/#webgl_buffergeometry_lines_indexed)

### Radial Gradient Cursor

<img width="692" alt="Screenshot 2024-10-12 at 5 13 59 AM" src="https://github.com/user-attachments/assets/dac2e997-9be6-474a-a318-9138bd1aa111">

Similar to JHey's Hover Spotlight affect, we will use the cursor to spotlight over the grid and later on we will add a shader affect.

```js
const handleMouseMove = (e: MouseEvent) => {
    setCursorPosition({ x: e.clientX, y: e.clientY });
};
```

```css
background: radial-gradient(
    circle,
    rgba(255, 0, 0, 0.5) 0%,
    rgba(255, 0, 0, 0) 80%
  );
  border-radius: 50%;
```

### Demo

Putting that all together this is what we have so far:

https://github.com/user-attachments/assets/c3741914-3adf-4e9e-9f37-8bea5b5b2ce3

## Step 1:

### Raycasting

```
// Update shader uniforms every frame
useFrame((state) => {
    
    const { x, y } = cursorPosition;

    // Convert mouse coordinates to normalized device coordinates (NDC)
    const ndcX = (x / window.innerWidth) * 2 - 1;
    const ndcY = -(y / window.innerHeight) * 2 + 1;

    // Set the raycaster to the point coordinate
    // Use the raycaster to find the point on the plane at z=0
    raycaster.current.setFromCamera({ x: ndcX, y: ndcY }, camera);
    raycaster.current.ray.intersectPlane(
      new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
      intersectionPoint
    );

    // Update the cursor uniform back in the shader
    material.uniforms.uCursor.value.set(
      intersectionPoint.x,
      intersectionPoint.y
    );
    material.uniforms.uTime.value = state.clock.getElapsedTime();
  }
});
```

https://github.com/user-attachments/assets/68ebdbac-2525-461e-bb34-b9c88a580765





