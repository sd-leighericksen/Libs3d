"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Box3, Vector3 } from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

function Mesh({ url }: { url: string }) {
  const geometry = useLoader(STLLoader, url);
  const meshRef = useRef<import("three").Mesh>(null!);
  const { camera } = useThree();

  useEffect(() => {
    if (!geometry) return;
    geometry.computeBoundingBox();
    const box = geometry.boundingBox ?? new Box3();
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);
    geometry.translate(-center.x, -center.y, -center.z);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const dist = maxDim * 2.5;
    camera.position.set(dist, dist * 0.8, dist);
    camera.lookAt(0, 0, 0);
    camera.near = maxDim / 100;
    camera.far = maxDim * 100;
    camera.updateProjectionMatrix();
  }, [geometry, camera]);

  return (
    <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color="#1a1b4b" roughness={0.55} metalness={0.05} />
    </mesh>
  );
}

export function StlViewer({
  url,
  posterUrl,
  className,
}: {
  url: string;
  posterUrl?: string | null;
  className?: string;
}) {
  const [show, setShow] = useState(false);
  const [webglOk, setWebglOk] = useState(true);

  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl") ?? c.getContext("experimental-webgl");
      if (!gl) setWebglOk(false);
    } catch {
      setWebglOk(false);
    }
  }, []);

  if (!webglOk) {
    return (
      <div className={className}>
        {posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={posterUrl} alt="3D preview" className="w-full h-full object-cover rounded-md" />
        ) : (
          <div className="rounded-md bg-surface-soft p-lg text-body-sm">
            Your browser can&rsquo;t show the 3D view. The image gallery should
            still give you a good look.
          </div>
        )}
      </div>
    );
  }

  if (!show) {
    return (
      <div className={`relative ${className ?? ""}`}>
        {posterUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={posterUrl}
            alt=""
            className="w-full h-full object-cover rounded-md"
          />
        )}
        <button
          type="button"
          onClick={() => setShow(true)}
          className="absolute inset-0 flex items-center justify-center"
          aria-label="Load 3D preview"
        >
          <span className="pill-primary">Spin it in 3D</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-surface-soft rounded-md overflow-hidden ${className ?? ""}`}>
      <Canvas camera={{ position: [3, 3, 3], fov: 45 }} shadows>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={0.8} castShadow />
        <Suspense fallback={null}>
          <Mesh url={url} />
        </Suspense>
        <OrbitControls enableDamping autoRotate autoRotateSpeed={1.5} />
      </Canvas>
      <p className="caption px-md py-xs text-ink/60">
        Preview only — the real print file is kept private.
      </p>
    </div>
  );
}
