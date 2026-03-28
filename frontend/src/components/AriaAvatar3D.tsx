import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'motion/react';
import { useInterviewStore } from '../store/useInterviewStore';

function AvatarModel({
  isSpeaking = false,
  isCandidateSpeaking = false
}: {
  isSpeaking?: boolean,
  isCandidateSpeaking?: boolean
}) {
  const group = useRef<THREE.Group>(null);

  // Load character models and animations
  const base = useGLTF('/models/aria.glb');
  const talking = useGLTF('/models/talking.glb');
  const wave = useGLTF('/models/wave.glb');
  const yes = useGLTF('/models/yes.glb');

  // Rename to avoid name collisions (common with Mixamo exports)
  if (base.animations[0]) base.animations[0].name = 'idle';
  if (talking.animations[0]) talking.animations[0].name = 'talking';
  if (wave.animations[0]) wave.animations[0].name = 'wave';
  if (yes.animations[0]) yes.animations[0].name = 'yes';

  // Combine animations
  const { actions } = useAnimations([
    ...base.animations,
    ...talking.animations,
    ...wave.animations,
    ...yes.animations
  ], group);

  const [hasWaved, setHasWaved] = useState(false);

  useEffect(() => {
    if (!actions) return;

    const idleAction = actions['idle'];
    const talkingAction = actions['talking'];
    const waveAction = actions['wave'];
    const yesAction = actions['yes'];

    if (yesAction) {
      yesAction.setLoop(THREE.LoopRepeat, Infinity);
    }

    if (!hasWaved && waveAction) {
      waveAction.reset().fadeIn(0.5).play();
      const timer = setTimeout(() => {
        setHasWaved(true);
        waveAction.fadeOut(0.5);
      }, 3000);
      return () => clearTimeout(timer);
    }

    if (isCandidateSpeaking && yesAction) {
      if (idleAction) idleAction.fadeOut(0.5);
      if (talkingAction) talkingAction.fadeOut(0.5);
      yesAction.reset().fadeIn(0.5).play();
    } else if (isSpeaking && talkingAction) {
      if (idleAction) idleAction.fadeOut(0.5);
      if (yesAction) yesAction.fadeOut(0.5);
      talkingAction.reset().fadeIn(0.5).play();
    } else {
      if (talkingAction) talkingAction.fadeOut(0.5);
      if (yesAction) yesAction.fadeOut(0.5);
      if (idleAction) idleAction.reset().fadeIn(0.5).play();
      else if (base.animations[0]) {
        actions[base.animations[0].name].play();
      }
    }

    return () => {
      if (idleAction) idleAction.fadeOut(0.5);
      if (talkingAction) talkingAction.fadeOut(0.5);
      if (waveAction) waveAction.fadeOut(0.5);
      if (yesAction) yesAction.fadeOut(0.5);
    };
  }, [isSpeaking, isCandidateSpeaking, actions, base.animations, talking.animations, wave.animations, yes.animations, hasWaved]);

  return (
    <group ref={group} dispose={null}>
      <primitive object={base.scene} scale={1.5} position={[0, -1.2, 0]} />
    </group>
  );
}

function CameraController() {
  const { camera } = useThree();

  useFrame(() => {
    camera.position.set(0, 1.4, 2.5);
    camera.lookAt(0, 1.1, 0);
  });

  return null;
}

export default function AriaAvatar3D() {
  const { isSpeaking, isCandidateSpeaking } = useInterviewStore();

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden bg-gradient-to-b from-surface to-background">
      <Canvas
        camera={{ fov: 45, position: [0, 1.5, 3] }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <CameraController />
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 3, 5]} intensity={1} castShadow />
        <pointLight position={[-2, 2, 2]} intensity={0.5} color="#7c6af7" />

        <Suspense fallback={null}>
          <AvatarModel isSpeaking={isSpeaking} isCandidateSpeaking={isCandidateSpeaking} />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableRotate={true}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>

      {isSpeaking && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 items-end">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ height: [8, 24, 8] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
              className="w-1 bg-primary rounded-full"
            />
          ))}
        </div>
      )}
    </div>
  );
}

useGLTF.preload('/models/aria.glb');
useGLTF.preload('/models/talking.glb');
useGLTF.preload('/models/wave.glb');
useGLTF.preload('/models/yes.glb');
