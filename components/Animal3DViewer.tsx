'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RotateCcw, Ruler, Sparkles } from 'lucide-react';
import type { Species } from '@/lib/types';

interface Animal3DViewerProps {
  name: string;
  species: Species;
  shoulderHeightCm: number;
  glbUrl?: string | null;
  splatUrl?: string | null;
  captureMethod?: string;
}

function detectSoftwareWebGL(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

/**
 * Builds a grounded, composite 12-part procedural anatomical 1:1 scale mannequin
 * calibrated directly to the animal's real shoulderHeightCm (in meters).
 */
function buildProceduralScaleModel(species: Species, shoulderHeightCm: number): THREE.Group {
  const group = new THREE.Group();
  const h = Math.max(0.18, Math.min(0.95, shoulderHeightCm / 100));
  const isCat = species === 'kedi';

  const coatMat = new THREE.MeshStandardMaterial({
    color: isCat ? 0x3b525c : 0xd5cbbd,
    roughness: 0.78,
    metalness: 0.04,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: isCat ? 0xe9eef0 : 0x5c4a3e,
    roughness: 0.62,
    metalness: 0.06,
  });
  const noseMat = new THREE.MeshStandardMaterial({
    color: 0x1e2529,
    roughness: 0.35,
    metalness: 0.15,
  });
  const collarMat = new THREE.MeshStandardMaterial({
    color: 0xc9223f,
    roughness: 0.42,
    metalness: 0.12,
  });
  const tagMat = new THREE.MeshStandardMaterial({
    color: 0xf2b33d,
    roughness: 0.22,
    metalness: 0.82,
  });

  const legHeight = h * (isCat ? 0.56 : 0.62);
  const legRadius = h * (isCat ? 0.065 : 0.075);
  const bodyLength = h * (isCat ? 1.25 : 1.18);
  const bodyRadius = h * (isCat ? 0.24 : 0.26);
  const bodyY = legHeight + bodyRadius * 0.68;

  // 1. Primary torso silhouette (capsule aligned along Z)
  const torsoGeo = new THREE.CapsuleGeometry(bodyRadius, bodyLength * 0.52, 12, 24);
  torsoGeo.rotateX(Math.PI / 2);
  const torso = new THREE.Mesh(torsoGeo, coatMat);
  torso.position.set(0, bodyY, 0);
  torso.castShadow = true;
  torso.receiveShadow = true;
  group.add(torso);

  // 2. Chest fullness
  const chest = new THREE.Mesh(new THREE.SphereGeometry(bodyRadius * 0.92, 20, 16), accentMat);
  chest.position.set(0, bodyY - bodyRadius * 0.06, bodyLength * 0.26);
  chest.castShadow = true;
  group.add(chest);

  // 3. Neck & Collar + Brass Heart Tag
  const neckGeo = new THREE.CylinderGeometry(bodyRadius * 0.52, bodyRadius * 0.66, h * 0.26, 18);
  const neck = new THREE.Mesh(neckGeo, coatMat);
  neck.position.set(0, bodyY + bodyRadius * 0.72, bodyLength * 0.34);
  neck.rotation.x = 0.36;
  neck.castShadow = true;
  group.add(neck);

  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(bodyRadius * 0.58, h * 0.028, 12, 24),
    collarMat
  );
  collar.position.set(0, bodyY + bodyRadius * 0.62, bodyLength * 0.32);
  collar.rotation.x = Math.PI / 2 + 0.34;
  group.add(collar);

  const tag = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.045, h * 0.045, h * 0.012, 16), tagMat);
  tag.position.set(0, bodyY + bodyRadius * 0.38, bodyLength * 0.45);
  tag.rotation.x = Math.PI / 2;
  group.add(tag);

  // 4. Head + Snout + Nose
  const headRadius = h * (isCat ? 0.24 : 0.22);
  const headY = h * 1.12;
  const headZ = bodyLength * 0.44;
  const head = new THREE.Mesh(new THREE.SphereGeometry(headRadius, 22, 18), coatMat);
  head.position.set(0, headY, headZ);
  head.scale.set(1, 0.94, 1.04);
  head.castShadow = true;
  group.add(head);

  const snout = new THREE.Mesh(
    new THREE.CapsuleGeometry(headRadius * (isCat ? 0.32 : 0.42), headRadius * (isCat ? 0.16 : 0.52), 8, 14),
    accentMat
  );
  snout.rotation.x = Math.PI / 2;
  snout.position.set(0, headY - headRadius * 0.2, headZ + headRadius * (isCat ? 0.78 : 0.95));
  snout.castShadow = true;
  group.add(snout);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(headRadius * 0.16, 12, 10), noseMat);
  nose.position.set(0, headY - headRadius * 0.14, headZ + headRadius * (isCat ? 1.02 : 1.36));
  group.add(nose);

  // Eyes
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(headRadius * 0.11, 10, 10), noseMat);
    eye.position.set(side * headRadius * 0.42, headY + headRadius * 0.12, headZ + headRadius * 0.78);
    group.add(eye);
  }

  // 5. Ears (triangular upright for cat, gently curved for dog)
  for (const side of [-1, 1]) {
    if (isCat) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(headRadius * 0.38, headRadius * 0.72, 4), accentMat);
      ear.position.set(side * headRadius * 0.56, headY + headRadius * 0.88, headZ - headRadius * 0.08);
      ear.rotation.z = -side * 0.22;
      ear.castShadow = true;
      group.add(ear);
    } else {
      const ear = new THREE.Mesh(new THREE.CapsuleGeometry(headRadius * 0.22, headRadius * 0.52, 6, 12), accentMat);
      ear.position.set(side * headRadius * 0.84, headY + headRadius * 0.12, headZ - headRadius * 0.04);
      ear.rotation.z = side * 0.25;
      ear.castShadow = true;
      group.add(ear);
    }
  }

  // 6. Four Legs + Paws strictly grounded at y = 0
  const legOffsets: [number, number][] = [
    [-bodyRadius * 0.58, bodyLength * 0.3],
    [bodyRadius * 0.58, bodyLength * 0.3],
    [-bodyRadius * 0.58, -bodyLength * 0.3],
    [bodyRadius * 0.58, -bodyLength * 0.3],
  ];
  const pawHeight = h * 0.06;
  for (const [lx, lz] of legOffsets) {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(legRadius * 1.08, legRadius * 0.84, legHeight, 14),
      coatMat
    );
    leg.position.set(lx, legHeight / 2 + pawHeight * 0.4, lz);
    leg.castShadow = true;
    group.add(leg);

    const paw = new THREE.Mesh(
      new THREE.SphereGeometry(legRadius * 1.18, 12, 10),
      accentMat
    );
    paw.scale.set(1, 0.52, 1.35);
    paw.position.set(lx, pawHeight * 0.52, lz + legRadius * 0.3);
    paw.castShadow = true;
    group.add(paw);
  }

  // 7. Curved Tail (TubeGeometry)
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, bodyY + bodyRadius * 0.2, -bodyLength * 0.44),
    new THREE.Vector3(0, bodyY + bodyRadius * (isCat ? 0.9 : 0.45), -bodyLength * 0.68),
    new THREE.Vector3(0, bodyY + bodyRadius * (isCat ? 1.45 : 0.88), -bodyLength * (isCat ? 0.58 : 0.82)),
  ]);
  const tail = new THREE.Mesh(
    new THREE.TubeGeometry(tailCurve, 16, h * 0.042, 10, false),
    accentMat
  );
  tail.castShadow = true;
  group.add(tail);

  // Align strictly so lowest point rests flush at y = 0
  const box = new THREE.Box3().setFromObject(group);
  group.position.y -= box.min.y;
  return group;
}

function buildScaleRuler(shoulderHeightCm: number): THREE.Group {
  const ruler = new THREE.Group();
  const h = Math.max(0.18, Math.min(0.95, shoulderHeightCm / 100));
  const xPos = h * 0.72;

  const lineMat = new THREE.MeshBasicMaterial({ color: 0xc9223f });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, h, 8), lineMat);
  pole.position.set(xPos, h / 2, 0);
  ruler.add(pole);

  // Bottom and shoulder tick marks
  for (const ty of [0.004, h]) {
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.006, 0.006), lineMat);
    tick.position.set(xPos, ty, 0);
    ruler.add(tick);
  }

  // Ground footprint ring showing 1m x 1m reference circle
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(h * 0.82, h * 0.84, 48),
    new THREE.MeshBasicMaterial({
      color: 0x2f7d6b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.005;
  ruler.add(ring);

  return ruler;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 120);
  grad.addColorStop(0, 'rgba(15, 46, 58, 0.36)');
  grad.addColorStop(0.6, 'rgba(15, 46, 58, 0.14)');
  grad.addColorStop(1, 'rgba(15, 46, 58, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export default function Animal3DViewer({
  name,
  species,
  shoulderHeightCm,
  glbUrl,
  splatUrl,
  captureMethod,
}: Animal3DViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<THREE.Group | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const requestRenderRef = useRef<(() => void) | null>(null);

  const [showRuler, setShowRuler] = useState(true);
  const [loadInfo, setLoadInfo] = useState<string>(
    glbUrl
      ? 'Taranmış .glb 3D model yükleniyor...'
      : splatUrl
        ? 'Gaussian Splat (.splat) sahnesi hazırlanıyor...'
        : `1:1 ölçekli 3D maket (${shoulderHeightCm} cm omuz yüksekliği)`
  );
  const [webglLost, setWebglLost] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const width = container.clientWidth || 480;
    const height = container.clientHeight || 540;

    const scene = new THREE.Scene();
    const isDark = document.documentElement.classList.contains('dark');
    const bgHex = isDark ? 0x0b1d26 : 0xe4ecef;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.Fog(bgHex, 2.8, 7.5);

    const hMeters = Math.max(0.2, shoulderHeightCm / 100);
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.05, 30);
    camera.position.set(hMeters * 1.9, hMeters * 1.35, hMeters * 2.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglLost(true);
    };
    const handleContextRestored = () => {
      setWebglLost(false);
      requestRender();
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

    // Mandatory studio environment map via RoomEnvironment
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    // Balanced 3-point warm/cool studio rig
    const hemi = new THREE.HemisphereLight(0xdceef5, 0x3b4e57, 0.9);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff4e6, 1.8);
    keyLight.position.set(1.6, 2.6, 1.8);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x8fd3e8, 0.9);
    rimLight.position.set(-1.8, 1.5, -1.6);
    scene.add(rimLight);

    // Contact shadow plane grounded at y = 0.002
    const shadowTex = createContactShadowTexture();
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(hMeters * 2.2, hMeters * 2.2),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.002;
    scene.add(shadowPlane);

    // Subtle studio floor grid
    const grid = new THREE.GridHelper(3, 18, 0x6b8792, 0x9ab0b8);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.22;
    scene.add(grid);

    // 1:1 Scale Ruler
    const ruler = buildScaleRuler(shoulderHeightCm);
    ruler.visible = true;
    rulerRef.current = ruler;
    scene.add(ruler);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, hMeters * 0.62, 0);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.08;
    controls.minDistance = hMeters * 1.1;
    controls.maxDistance = hMeters * 6;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controls.update();
    controlsRef.current = controls;

    // Coalesced on-demand renderer with software WebGL pacing
    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let disposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function requestRender() {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;
        controls.update();
        renderer.render(scene, camera);
        const done = () => {
          renderBusy = false;
          if (renderDirty) requestRender();
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    }
    requestRenderRef.current = requestRender;

    controls.addEventListener('change', requestRender);

    // Subject: load real .glb or parse .splat point cloud or build procedural 1:1 mannequin
    let activeSubject: THREE.Object3D = buildProceduralScaleModel(species, shoulderHeightCm);
    scene.add(activeSubject);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    requestRender();

    if (glbUrl) {
      const loader = new GLTFLoader();
      loader.load(
        glbUrl,
        (gltf) => {
          if (disposed) return;
          const loaded = gltf.scene;
          const box = new THREE.Box3().setFromObject(loaded);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const targetTotalHeight = hMeters * 1.28;
          const scaleFactor = size.y > 0.001 ? targetTotalHeight / size.y : 1;
          loaded.scale.setScalar(scaleFactor);
          loaded.position.set(
            -center.x * scaleFactor,
            -box.min.y * scaleFactor,
            -center.z * scaleFactor
          );
          loaded.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = !isSoftwareGl;
              child.receiveShadow = !isSoftwareGl;
            }
          });
          scene.remove(activeSubject);
          activeSubject = loaded;
          scene.add(loaded);
          setLoadInfo(`Gerçek .glb 3D tarama (${shoulderHeightCm} cm 1:1 ölçek)`);
          requestRender();
        },
        undefined,
        () => {
          setLoadInfo(`1:1 ölçekli 3D maket (${shoulderHeightCm} cm)`);
        }
      );
    } else if (splatUrl) {
      // Lightweight .splat point cloud reader (standard 32-byte splat record: xyz float32 + scale + rgba)
      fetch(splatUrl)
        .then((r) => (r.ok ? r.arrayBuffer() : null))
        .then((buf) => {
          if (disposed || !buf || buf.byteLength < 32) return;
          const count = Math.min(Math.floor(buf.byteLength / 32), 60000);
          const positions = new Float32Array(count * 3);
          const colors = new Float32Array(count * 3);
          const view = new DataView(buf);
          for (let i = 0; i < count; i++) {
            const base = i * 32;
            positions[i * 3] = view.getFloat32(base, true);
            positions[i * 3 + 1] = -view.getFloat32(base + 4, true);
            positions[i * 3 + 2] = view.getFloat32(base + 8, true);
            colors[i * 3] = view.getUint8(base + 24) / 255;
            colors[i * 3 + 1] = view.getUint8(base + 25) / 255;
            colors[i * 3 + 2] = view.getUint8(base + 26) / 255;
          }
          const geo = new THREE.BufferGeometry();
          geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
          geo.computeBoundingBox();
          const b = geo.boundingBox!;
          const size = b.getSize(new THREE.Vector3());
          const center = b.getCenter(new THREE.Vector3());
          const scaleFactor = size.y > 0.001 ? (hMeters * 1.28) / size.y : 1;
          const points = new THREE.Points(
            geo,
            new THREE.PointsMaterial({ size: 0.015, vertexColors: true })
          );
          points.scale.setScalar(scaleFactor);
          points.position.set(
            -center.x * scaleFactor,
            -b.min.y * scaleFactor,
            -center.z * scaleFactor
          );
          scene.remove(activeSubject);
          activeSubject = points;
          scene.add(points);
          setLoadInfo(`Gaussian Splatting sahnesi (${count.toLocaleString('tr-TR')} nokta)`);
          requestRender();
        })
        .catch(() => undefined);
    }

    const onResize = () => {
      if (!container || disposed) return;
      const w = container.clientWidth || 480;
      const h = container.clientHeight || 540;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      controls.removeEventListener('change', requestRender);
      controls.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
      envTex.dispose();
      shadowTex.dispose();
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh || (obj as THREE.Points).isPoints) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
          if (Array.isArray(m.material)) {
            m.material.forEach((mat) => mat.dispose());
          } else {
            m.material?.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, [glbUrl, splatUrl, shoulderHeightCm, species]);

  useEffect(() => {
    if (rulerRef.current) {
      rulerRef.current.visible = showRuler;
      requestRenderRef.current?.();
    }
  }, [showRuler]);

  const resetView = () => {
    const hMeters = Math.max(0.2, shoulderHeightCm / 100);
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(hMeters * 1.9, hMeters * 1.35, hMeters * 2.2);
      controlsRef.current.target.set(0, hMeters * 0.62, 0);
      controlsRef.current.update();
      requestRenderRef.current?.();
    }
  };

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[16px] border border-[var(--border-hairline)] bg-[#E4ECEF] dark:bg-[#0B1D26]">
      {/* Isolated WebGL canvas mount */}
      <div
        ref={mountRef}
        aria-label={`${name} 360 derece 3D inceleme sahnesi`}
        className="h-full w-full cursor-grab active:cursor-grabbing"
      />

      {webglLost && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B1D26]/90 p-6 text-center text-white">
          <p className="font-semibold">3D grafik bağlamı geçici olarak duraklatıldı.</p>
          <p className="mt-1 text-sm text-white/75">
            Fotoğraf sekmesine dönebilir veya sayfayı yenileyebilirsiniz.
          </p>
        </div>
      )}

      {/* Minimal top-left spec badge (solid rgba, NO backdrop-filter over WebGL!) */}
      <div className="pointer-events-none absolute left-3 top-3 rounded-[4px] bg-[#0F2E3A]/85 px-3 py-1.5 text-xs font-medium text-white">
        <span>{loadInfo}</span>
        {captureMethod && (
          <span className="ml-2 opacity-75">
            · {captureMethod === 'gaussian_splat' ? '3D Splat' : captureMethod === 'photogrammetry' ? 'Fotogrametri' : '3D Ölçek'}
          </span>
        )}
      </div>

      {/* Unified compact bottom control dock (solid rgba surface for smooth WebGL) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-[#0F2E3A]/90 px-3 py-1.5 text-xs font-medium text-white shadow-sm">
        <button
          type="button"
          onClick={() => setShowRuler((v) => !v)}
          className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 transition-colors whitespace-nowrap ${
            showRuler ? 'bg-[#F2B33D] text-[#0F2E3A] font-semibold' : 'hover:bg-white/15'
          }`}
        >
          <Ruler className="h-3.5 w-3.5" aria-hidden="true" />
          Cetvel ({shoulderHeightCm} cm)
        </button>

        <button
          type="button"
          onClick={resetView}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 hover:bg-white/15 transition-colors whitespace-nowrap"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Sıfırla
        </button>

        <span className="hidden sm:inline-flex items-center gap-1 pr-2 text-white/75 whitespace-nowrap">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          360° sürükle
        </span>
      </div>
    </div>
  );
}
