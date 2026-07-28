"use client";

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './css/grid-distortion.css';

export interface GridDistortionProps {
  grid?: number;
  mouse?: number;
  strength?: number;
  relaxation?: number;
  imageSrc: string;
  className?: string;
}

const vertexShader = `
uniform float time;
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform sampler2D uDataTexture;
uniform sampler2D uTexture;
uniform vec4 resolution;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec2 offset = texture2D(uDataTexture, vUv).rg * 2.0 - 1.0;
  gl_FragColor = texture2D(uTexture, uv - 0.02 * offset);
}
`;

interface GridSimulation {
  size: number;
  displacement: Float32Array;
  data: Uint8Array;
  dataTexture: THREE.DataTexture;
  geometry: THREE.PlaneGeometry;
}

const createSimulation = (grid: number): GridSimulation => {
  const size = Math.max(2, Math.round(grid));
  const displacement = new Float32Array(2 * size * size);
  const data = new Uint8Array(4 * size * size);

  for (let i = 0; i < size * size; i++) {
    data[i * 4] = 128;
    data[i * 4 + 1] = 128;
    data[i * 4 + 3] = 255;
  }

  const dataTexture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  dataTexture.needsUpdate = true;

  return {
    size,
    displacement,
    data,
    dataTexture,
    geometry: new THREE.PlaneGeometry(1, 1, size - 1, size - 1)
  };
};

const GridDistortion: React.FC<GridDistortionProps> = ({
  grid = 15,
  mouse = 0.1,
  strength = 0.15,
  relaxation = 0.9,
  imageSrc,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const livePropsRef = useRef({ mouse, strength, relaxation });
  const initialGridRef = useRef(grid);
  const runtimeRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    plane: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
    material: THREE.ShaderMaterial;
    uniforms: {
      time: { value: number };
      resolution: { value: THREE.Vector4 };
      uTexture: { value: THREE.Texture | null };
      uDataTexture: { value: THREE.DataTexture };
    };
    simulation: GridSimulation;
  } | null>(null);

  useEffect(() => {
    livePropsRef.current = { mouse, strength, relaxation };
  }, [mouse, strength, relaxation]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const camera = new THREE.OrthographicCamera(0, 0, 0, 0, -1000, 1000);
    camera.position.z = 2;

    const simulation = createSimulation(initialGridRef.current);

    const uniforms = {
      time: { value: 0 },
      resolution: { value: new THREE.Vector4() },
      uTexture: { value: null as THREE.Texture | null },
      uDataTexture: { value: simulation.dataTexture }
    };

    const material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true
    });

    const plane = new THREE.Mesh(simulation.geometry, material);
    scene.add(plane);

    runtimeRef.current = {
      renderer,
      scene,
      camera,
      plane,
      material,
      uniforms,
      simulation
    };

    const handleResize = () => {
      if (!container || !renderer || !camera) return;

      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      if (width === 0 || height === 0) return;

      const containerAspect = width / height;

      renderer.setSize(width, height);

      if (plane) {
        plane.scale.set(containerAspect, 1, 1);
      }

      const frustumHeight = 1;
      const frustumWidth = frustumHeight * containerAspect;
      camera.left = -frustumWidth / 2;
      camera.right = frustumWidth / 2;
      camera.top = frustumHeight / 2;
      camera.bottom = -frustumHeight / 2;
      camera.updateProjectionMatrix();

      uniforms.resolution.value.set(width, height, 1, 1);
    };

    let resizeObserver: ResizeObserver | null = null;
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);
    } else {
      window.addEventListener('resize', handleResize);
    }

    const mouseState = {
      x: 0,
      y: 0,
      prevX: 0,
      prevY: 0,
      vX: 0,
      vY: 0
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1 - (e.clientY - rect.top) / rect.height;
      mouseState.vX = x - mouseState.prevX;
      mouseState.vY = y - mouseState.prevY;
      Object.assign(mouseState, { x, y, prevX: x, prevY: y });
    };

    const handleMouseLeave = () => {
      Object.assign(mouseState, {
        x: 0,
        y: 0,
        prevX: 0,
        prevY: 0,
        vX: 0,
        vY: 0
      });
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    handleResize();

    let animationId = 0;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const runtime = runtimeRef.current;
      if (!runtime) return;

      uniforms.time.value += 0.05;
      const { size, displacement, data, dataTexture } = runtime.simulation;
      const current = livePropsRef.current;

      for (let i = 0; i < size * size; i++) {
        displacement[i * 2] *= current.relaxation;
        displacement[i * 2 + 1] *= current.relaxation;
      }

      const gridMouseX = size * mouseState.x;
      const gridMouseY = size * mouseState.y;
      const maxDist = size * current.mouse;

      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const distSq = Math.pow(gridMouseX - i, 2) + Math.pow(gridMouseY - j, 2);
          if (distSq < maxDist * maxDist) {
            const index = 2 * (i + size * j);
            const power = Math.min(maxDist / Math.sqrt(distSq), 10);
            displacement[index] += current.strength * 100 * mouseState.vX * power;
            displacement[index + 1] -= current.strength * 100 * mouseState.vY * power;
          }
        }
      }

      for (let i = 0; i < size * size; i++) {
        const x = THREE.MathUtils.clamp(displacement[i * 2], -1, 1);
        const y = THREE.MathUtils.clamp(displacement[i * 2 + 1], -1, 1);
        data[i * 4] = Math.round((x * 0.5 + 0.5) * 255);
        data[i * 4 + 1] = Math.round((y * 0.5 + 0.5) * 255);
      }

      dataTexture.needsUpdate = true;
      renderer.render(scene, camera);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);

      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', handleResize);
      }

      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);

      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }

      const currentSimulation = runtimeRef.current?.simulation;
      currentSimulation?.geometry.dispose();
      currentSimulation?.dataTexture.dispose();
      material.dispose();
      if (uniforms.uTexture.value) uniforms.uTexture.value.dispose();
      runtimeRef.current = null;
    };
  }, []);

  useEffect(() => {
    const runtime = runtimeRef.current;
    const nextSize = Math.max(2, Math.round(grid));
    if (!runtime || runtime.simulation.size === nextSize) return;

    const previous = runtime.simulation;
    const next = createSimulation(nextSize);
    runtime.simulation = next;
    runtime.uniforms.uDataTexture.value = next.dataTexture;
    runtime.plane.geometry = next.geometry;
    previous.geometry.dispose();
    previous.dataTexture.dispose();
  }, [grid]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;

    let cancelled = false;
    new THREE.TextureLoader().load(imageSrc, texture => {
      if (cancelled || runtimeRef.current !== runtime) {
        texture.dispose();
        return;
      }

      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      runtime.uniforms.uTexture.value?.dispose();
      runtime.uniforms.uTexture.value = texture;
    });

    return () => {
      cancelled = true;
    };
  }, [imageSrc]);

  return (
    <div
      ref={containerRef}
      className={`distortion-container ${className}`}
      style={{
        width: '100%',
        height: '100%',
        minWidth: '0',
        minHeight: '0'
      }}
    />
  );
};

export default GridDistortion;
