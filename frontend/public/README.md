# Static Assets

This folder contains all static assets for the NeuralHire frontend.

## Folder Structure

```
public/
├── models/          # 3D GLB models for ARIA avatar
│   ├── aria.glb    # Base 3D avatar
│   ├── talking.glb # Talking animation
│   ├── wave.glb    # Waving gesture
│   ├── yes.glb     # Yes gesture
│   └── no.glb      # No gesture
├── favicon.ico     # Website favicon
└── og-image.png    # Social media preview image
```

## Models

The `models/` folder contains 3D avatar animations for the ARIA AI agent. These are used by the `AriaAvatar3D` component to display animated gestures during interviews.

### Loading Models

```tsx
import { useGLTF } from '@react-three/drei';

// Preload for instant transitions
useGLTF.preload('/models/aria.glb');
useGLTF.preload('/models/talking.glb');
useGLTF.preload('/models/wave.glb');
```

## Notes

- All models must be in GLB (binary GLTF) format
- Models are served from the `/models/` path
- Preload all models on app initialization for smooth animations
