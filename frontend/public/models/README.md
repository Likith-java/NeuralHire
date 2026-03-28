# 3D Avatar Models

This folder contains the GLB 3D models for the ARIA avatar animations.

## Files

| File | Description |
|------|-------------|
| `aria.glb` | Base ARIA 3D avatar model |
| `talking.glb` | Talking animation for ARIA |
| `wave.glb` | Waving hello animation |
| `yes.glb` | Yes/agreement gesture animation |
| `no.glb` | No/disagree gesture animation |

## Usage

These models are loaded by the `AriaAvatar3D` component using `@react-three/drei`:

```tsx
import { useGLTF } from '@react-three/drei';

const { scene } = useGLTF('/models/aria.glb');
const wave = useGLTF('/models/wave.glb');
```

## Notes

- Models are in GLB (GLTF binary) format
- Animations are extracted from Mixamo
- The avatar uses React Three Fiber for 3D rendering
- All models are preloaded for smooth transitions
