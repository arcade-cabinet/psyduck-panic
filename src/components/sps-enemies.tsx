'use client';

import * as BABYLON from '@babylonjs/core';
import { useEffect, useRef } from 'react';
import { useScene } from 'reactylon';
import { useGameStore } from '@/store/game-store';
import { useLevelStore } from '@/store/level-store';

/**
 * SPS (SolidParticleSystem) atmospheric corruption fragments.
 *
 * Tiny glowing shards drift down from above — visual density that
 * reinforces the corruption aesthetic. Purely decorative, no gameplay impact.
 * Uses small irregular shapes with holographic emissive glow that shifts
 * from cyan to red with rising tension.
 */
export default function SPSEnemies() {
  const scene = useScene();
  const spsRef = useRef<BABYLON.SolidParticleSystem | null>(null);

  useEffect(() => {
    if (!scene) return;

    const SPS = new BABYLON.SolidParticleSystem('corruptionSPS', scene, { updatable: true });

    // Small irregular shards — mix of tiny boxes and tetrahedra for visual variety
    const shard = BABYLON.MeshBuilder.CreateBox('shardModel', { width: 0.08, height: 0.15, depth: 0.04 }, scene);
    SPS.addShape(shard, 40);
    shard.dispose();

    const sliver = BABYLON.MeshBuilder.CreateBox('sliverModel', { width: 0.03, height: 0.22, depth: 0.03 }, scene);
    SPS.addShape(sliver, 30);
    sliver.dispose();

    const mesh = SPS.buildMesh();
    const mat = new BABYLON.StandardMaterial('corruptionMat', scene);
    mat.emissiveColor = new BABYLON.Color3(0.1, 0.6, 0.9);
    mat.alpha = 0.25;
    mat.disableLighting = true;
    mat.backFaceCulling = false;
    mesh.material = mat;

    spsRef.current = SPS;

    SPS.initParticles = () => {
      for (let i = 0; i < SPS.nbParticles; i++) {
        const p = SPS.particles[i];
        p.alive = false;
        p.position.set(0, -100, 0);
        // Random initial rotation for variety
        p.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      }
    };
    SPS.initParticles();

    SPS.updateParticle = (particle) => {
      if (!particle.alive) return particle;

      const curTension = useLevelStore.getState().tension;
      const dt = scene.getEngine().getDeltaTime() / 1000;

      // Slow, drifting descent with gentle sway
      particle.position.y -= (0.8 + curTension * 1.5) * dt;
      particle.position.x += Math.sin(particle.position.y * 2 + particle.idx) * 0.3 * dt;
      particle.rotation.x += (0.5 + curTension) * dt;
      particle.rotation.z += (0.3 + curTension * 0.5) * dt;

      // Fade out as they approach the platter
      if (particle.position.y < 1.0) {
        particle.alive = false;
        particle.position.y = -100;
      }

      return particle;
    };

    const observer = scene.onBeforeRenderObservable.add(() => {
      const phase = useGameStore.getState().phase;
      if (phase !== 'playing') return;

      SPS.setParticles();

      const curTension = useLevelStore.getState().tension;

      // Shift color from cyan to red with tension
      mat.emissiveColor = new BABYLON.Color3(
        0.1 + curTension * 0.8,
        0.6 - curTension * 0.4,
        0.9 - curTension * 0.7,
      );
      mat.alpha = 0.15 + curTension * 0.2;

      // Spawn rate proportional to tension — barely visible at low, dense at high
      if (Math.random() < curTension * 0.15) {
        for (let i = 0; i < SPS.nbParticles; i++) {
          const p = SPS.particles[i];
          if (!p.alive) {
            p.alive = true;
            p.position.set(
              (Math.random() - 0.5) * 6,
              6 + Math.random() * 3,
              (Math.random() - 0.5) * 3,
            );
            break;
          }
        }
      }
    });

    return () => {
      scene.onBeforeRenderObservable.remove(observer);
      mat.dispose();
      SPS.dispose();
    };
  }, [scene]);

  return null;
}
