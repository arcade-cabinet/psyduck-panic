import type { Engine } from '@babylonjs/core/Engines/engine';
import type { WebGPUEngine } from '@babylonjs/core/Engines/webgpuEngine';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import { Scene } from '@babylonjs/core/scene';
import type React from 'react';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import type { DeviceQuality } from '../utils/DeviceQuality';

interface SceneContextValue {
  scene: Scene | null;
  engine: Engine | WebGPUEngine | null;
}

const SceneContext = createContext<SceneContextValue>({ scene: null, engine: null });

export const useScene = () => {
  const context = useContext(SceneContext);
  if (!context.scene || !context.engine) {
    throw new Error('useScene must be used within a SceneManager');
  }
  return context;
};

interface SceneManagerProps {
  engine: Engine | WebGPUEngine;
  deviceQuality?: DeviceQuality;
  children: ReactNode;
}

export const SceneManager: React.FC<SceneManagerProps> = ({ engine, deviceQuality, children }) => {
  const [scene, setScene] = useState<Scene | null>(null);

  useEffect(() => {
    if (!engine) return;

    // Create scene with black clear color and right-handed coordinate system
    const newScene = new Scene(engine);
    newScene.clearColor = new Color4(0, 0, 0, 1);
    newScene.useRightHandedSystem = true;

    // Apply device quality config to scene
    if (deviceQuality) {
      deviceQuality.applyToScene(newScene);
      console.log(`[SceneManager] Scene created with ${deviceQuality.getTier()} quality tier`);
    } else {
      console.log('[SceneManager] Scene created with right-handed coordinates');
    }

    setScene(newScene);

    return () => {
      newScene.dispose();
      setScene(null);
    };
  }, [engine, deviceQuality]);

  if (!scene) {
    return null;
  }

  return <SceneContext.Provider value={{ scene, engine }}>{children}</SceneContext.Provider>;
};
