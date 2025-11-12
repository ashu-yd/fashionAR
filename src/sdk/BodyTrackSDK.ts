// src/sdk/BodyTrackSDK.ts
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// ⚠️ Set THREE globally BEFORE Mediapipe loads
if (!(window as any).THREE) {
  (window as any).THREE = THREE;
}

// Import Mediapipe *after* setting global THREE
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

// ✅ Re-assign again to make sure everything uses the same instance
(window as any).THREE = THREE;

interface BodyTrackConfig {
  videoElement: HTMLVideoElement;
  canvasElement: HTMLCanvasElement;
  showSkeleton?: boolean;
  modelUrl?: string | null;
  onLandmarksDetected?: (landmarks: any[], fps: number) => void;
}


interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export class BodyTrackSDK {
  private videoElement: HTMLVideoElement;
  private canvasElement: HTMLCanvasElement;
  private showSkeleton: boolean;
  private modelUrl: string | null;
  private onLandmarksDetected?: (landmarks: any[], fps: number) => void;

  private pose: any = null;
  private scene: any = null;
  private threeCamera: any = null;
  private renderer: any = null;
  private animationId: number | null = null;
  private isRunning = false;

  // Smoothing buffer
  private landmarkHistory: Landmark[][] = [];
  private historySize = 3;

  // Three.js objects
  private skeletonLines: any[] = [];
  private garmentMesh: any = null;
  private gltfLoader: any = null;

  // Performance
  private frameCount = 0;
  private lastTime = Date.now();
  private fps = 0;

  constructor(config: BodyTrackConfig) {
  this.videoElement = config.videoElement;
  this.canvasElement = config.canvasElement;
  this.showSkeleton = config.showSkeleton ?? false;
  this.modelUrl = config.modelUrl ?? null;
  this.onLandmarksDetected = config.onLandmarksDetected;

  // ✅ Always use directly imported GLTFLoader
  this.gltfLoader = new GLTFLoader();

  // Optional: enable DRACO for compressed models
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
  this.gltfLoader.setDRACOLoader(dracoLoader);
}


  async init(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.initCamera();
      await this.initPose();
      this.initThreeJS();
      
      if (this.modelUrl) {
        await this.load3DModel(this.modelUrl);
      } else {
        this.createSimpleGarment();
      }

      this.isRunning = true;
      this.animate();
      return { success: true };
    } catch (error: any) {
      console.error('SDK Init Error:', error);
      return { success: false, error: error.message };
    }
  }

  private async initCamera(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      },
      audio: false
    });

    this.videoElement.srcObject = stream;

    return new Promise((resolve) => {
      this.videoElement.onloadedmetadata = () => {
        this.videoElement.play();
        resolve();
      };
    });
  }

  private async initPose(): Promise<void> {
    // Using npm package - no CDN needed!
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm'
    );

    this.pose = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
        delegate: 'GPU'
      },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
  }

  private initThreeJS(): void {
    const width = this.canvasElement.width;
    const height = this.canvasElement.height;

    this.scene = new THREE.Scene();

    this.threeCamera = new THREE.OrthographicCamera(
      0, width, 0, height, 0.1, 1000
    );
    this.threeCamera.position.z = 500;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvasElement,
      alpha: true,
      antialias: true
    });
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x000000, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 1, 1);
    this.scene.add(directionalLight);


    const frontLight = new THREE.DirectionalLight(0xffffff, 0.4);
    frontLight.position.set(0, 0, 1);
    this.scene.add(frontLight);

    this.createSkeletonLines();
  }

  private createSkeletonLines(): void {
    const connections = [
      [11, 12], [11, 23], [12, 24], [23, 24],
      [11, 13], [13, 15], [12, 14], [14, 16],
      [23, 25], [25, 27], [24, 26], [26, 28]
    ];

    connections.forEach(() => {
      const geometry = new THREE.BufferGeometry();
      const material = new THREE.LineBasicMaterial({
        color: 0x00ff00,
        linewidth: 3
      });
      const line = new THREE.Line(geometry, material);
      line.visible = this.showSkeleton;
      this.skeletonLines.push(line);
      this.scene.add(line);
    });
  }

  private async load3DModel(url: string): Promise<void> {
    return new Promise((resolve) => {
      if (!this.gltfLoader) {
        console.warn('GLTFLoader not available, using simple garment');
        this.createSimpleGarment();
        resolve();
        return;
      }

      console.log('Attempting to load model from:', url);

      this.gltfLoader.load(
        url,
        (gltf: any) => {
          this.garmentMesh = gltf.scene;

          // ✅ Compute bounding box to normalize and center model
          const box = new THREE.Box3().setFromObject(this.garmentMesh);
          const size = new THREE.Vector3();
          const center = new THREE.Vector3();
          box.getSize(size);
          box.getCenter(center);

          // ✅ Center the model at origin
          this.garmentMesh.position.sub(center);

          // ✅ Normalize height to around 150 world units (fits in camera)
          // ✅ Scale up model so it's actually visible in camera frame
          if (size.y > 0) {
            const targetHeight = 600;
            const scaleFactor = (targetHeight / size.y) * 10;
            this.garmentMesh.scale.setScalar(scaleFactor);
            console.log('Applied scaleFactor:', scaleFactor);
          }

          


          this.garmentMesh.position.z = 100;

          // ✅ Adjust orientation and z-position to face camera
          this.garmentMesh.rotation.x = Math.PI;
          this.garmentMesh.rotation.z = 0;
          this.scene.add(this.garmentMesh);
          // Move the model upward to align with torso area
          // Raise higher and bring forward
          this.garmentMesh.position.y += 400;
          this.garmentMesh.position.z = 200;


          // ✅ Visibility
          this.garmentMesh.visible = !this.showSkeleton;
          this.scene.add(this.garmentMesh);

          // ✅ Debug logs
          console.log('3D model loaded and positioned:', {
            size,
            center,
            scale: this.garmentMesh.scale,
            position: this.garmentMesh.position,
          });
          console.log('Camera position:', this.threeCamera.position);

          resolve();
        },
        undefined,
        (error: any) => {
          console.error('Model load error:', error);
          this.createSimpleGarment();
          resolve();
        }
      );
    });
  }


  private createSimpleGarment(): void {
    const garmentGroup = new THREE.Group();

    const torsoGeometry = new THREE.BoxGeometry(80, 120, 20);
    const torsoMaterial = new THREE.MeshPhongMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
    garmentGroup.add(torso);

    const sleeveGeometry = new THREE.CylinderGeometry(15, 12, 60, 8);
    const sleeveMaterial = new THREE.MeshPhongMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.85
    });

    const leftSleeve = new THREE.Mesh(sleeveGeometry, sleeveMaterial);
    leftSleeve.position.set(-50, 30, 0);
    leftSleeve.rotation.z = Math.PI / 4;
    garmentGroup.add(leftSleeve);

    const rightSleeve = new THREE.Mesh(sleeveGeometry, sleeveMaterial);
    rightSleeve.position.set(50, 30, 0);
    rightSleeve.rotation.z = -Math.PI / 4;
    garmentGroup.add(rightSleeve);

    this.garmentMesh = garmentGroup;
    this.garmentMesh.visible = !this.showSkeleton;
    this.scene.add(this.garmentMesh);
  }

  private smoothLandmarks(landmarks: Landmark[]): Landmark[] {
    this.landmarkHistory.push(landmarks);
    if (this.landmarkHistory.length > this.historySize) {
      this.landmarkHistory.shift();
    }
    if (this.landmarkHistory.length === 1) return landmarks;

    return landmarks.map((landmark, i) => {
      let sumX = 0, sumY = 0, sumZ = 0;
      this.landmarkHistory.forEach((frame) => {
        sumX += frame[i].x;
        sumY += frame[i].y;
        sumZ += frame[i].z;
      });
      const count = this.landmarkHistory.length;
      return {
        x: sumX / count,
        y: sumY / count,
        z: sumZ / count,
        visibility: landmark.visibility
      };
    });
  }

  private async detectPose(): Promise<Landmark[] | null> {
    if (!this.pose || this.videoElement.readyState !== 4) return null;

    const startTimeMs = performance.now();
    const results = this.pose.detectForVideo(this.videoElement, startTimeMs);

    if (results.landmarks && results.landmarks.length > 0) {
      return this.smoothLandmarks(results.landmarks[0]);
    }
    return null;
  }

  private updateVisualization(landmarks: Landmark[]): void {
    if (!landmarks) return;

    const width = this.canvasElement.width;
    const height = this.canvasElement.height;

    const toCanvasCoords = (landmark: Landmark) => ({
      x: landmark.x * width,
      y: height - landmark.y * height,
      z: landmark.z * width
    });

    if (this.showSkeleton) {
      const connections = [
        [11, 12], [11, 23], [12, 24], [23, 24],
        [11, 13], [13, 15], [12, 14], [14, 16],
        [23, 25], [25, 27], [24, 26], [26, 28]
      ];

      connections.forEach((conn, idx) => {
        const start = toCanvasCoords(landmarks[conn[0]]);
        const end = toCanvasCoords(landmarks[conn[1]]);
        const positions = new Float32Array([start.x, start.y, 0, end.x, end.y, 0]);
        this.skeletonLines[idx].geometry.setAttribute(
          'position',
          new THREE.BufferAttribute(positions, 3)
        );
      });
    } else if (this.garmentMesh) {
      const leftShoulder = toCanvasCoords(landmarks[11]);
      const rightShoulder = toCanvasCoords(landmarks[12]);
      const leftHip = toCanvasCoords(landmarks[23]);
      const rightHip = toCanvasCoords(landmarks[24]);

      const centerX = (leftShoulder.x + rightShoulder.x) / 2;
      const centerY = (leftShoulder.y + leftHip.y) / 2;

      const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
      const torsoHeight = Math.abs(leftShoulder.y - leftHip.y);
      
      const scaleX = shoulderWidth / 80;
      const scaleY = torsoHeight / 120;
      const avgScale = (scaleX + scaleY) / 2;

      this.garmentMesh.position.set(centerX, centerY, 0);
      this.garmentMesh.scale.set(avgScale, avgScale, avgScale);

      const angle = Math.atan2(
        rightShoulder.y - leftShoulder.y,
        rightShoulder.x - leftShoulder.x
      );
      this.garmentMesh.rotation.z = angle;

      const avgZ = (leftShoulder.z + rightShoulder.z) / 2;
      this.garmentMesh.rotation.y = avgZ * 0.3;
    }
  }

  private animate = (): void => {
    if (!this.isRunning) return;

    this.animationId = requestAnimationFrame(this.animate);

    this.frameCount++;
    const currentTime = Date.now();
    if (currentTime - this.lastTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = currentTime;
    }

    this.detectPose().then((landmarks) => {
      if (landmarks) {
        this.updateVisualization(landmarks);
        if (this.onLandmarksDetected) {
          this.onLandmarksDetected(landmarks, this.fps);
        }
      }
      this.renderer.render(this.scene, this.threeCamera);
    });
  };

  toggleVisualization(showSkeleton: boolean): void {
    this.showSkeleton = showSkeleton;
    this.skeletonLines.forEach((line) => {
      line.visible = showSkeleton;
    });
    if (this.garmentMesh) {
      this.garmentMesh.visible = !showSkeleton;
    }
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.videoElement.srcObject) {
      (this.videoElement.srcObject as MediaStream)
        .getTracks()
        .forEach((track) => track.stop());
    }
    if (this.pose) {
      this.pose.close();
    }
  }

  getCurrentLandmarks(): Landmark[] | null {
    return this.landmarkHistory[this.landmarkHistory.length - 1] || null;
  }

  getFPS(): number {
    return this.fps;
  }
}