/**
 * Manages the Three.js 3D rendering context, camera, lighting, Bloom post-processing, and animation loop.
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export class SceneManager {
    private container: HTMLElement;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private composer: EffectComposer;
    private bloomPass: UnrealBloomPass;
    private animationFrameId: number | null = null;
    private renderables: { update: () => void }[] = [];

    constructor(container: HTMLElement) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x05050a, 0.0015);

        this.camera = new THREE.PerspectiveCamera(
            60,
            container.clientWidth / container.clientHeight,
            0.1,
            2000
        );
        this.camera.position.set(0, 100, 400);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.renderer.toneMappingExposure = 1.3;

        container.appendChild(this.renderer.domElement);

        // --- Post-processing Bloom ---
        const renderPass = new RenderPass(this.scene, this.camera);
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(container.clientWidth, container.clientHeight),
            1.4,  // strength: 1.5 - 2.2 thick neon
            0.6,  // radius
            0.1   // threshold
        );

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderPass);
        this.composer.addPass(this.bloomPass);

        this.setupLights();
        this.setupEventListeners();
        this.startLoop();
    }

    private setupLights(): void {
        const ambientLight = new THREE.AmbientLight(0x222244, 2);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0x00ffff, 3, 500);
        pointLight.position.set(0, 200, 100);
        this.scene.add(pointLight);
    }

    private setupEventListeners(): void {
        window.addEventListener('resize', this.onWindowResize);
    }

    private onWindowResize = (): void => {
        if (!this.container) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
        this.composer.setSize(width, height);
        this.bloomPass.resolution.set(width, height);
    };

    public add(object: THREE.Object3D | { update: () => void }): void {
        if ('update' in object) {
            this.renderables.push(object as { update: () => void });
        }
        if (object instanceof THREE.Object3D) {
            this.scene.add(object);
        }
    }

    public remove(object: THREE.Object3D): void {
        this.scene.remove(object);
    }

    private startLoop = (): void => {
        const animate = () => {
            this.animationFrameId = requestAnimationFrame(animate);

            this.scene.rotation.y += 0.001;

            for (const item of this.renderables) {
                if (item.update) item.update();
            }

            this.composer.render();
        };
        animate();
    };

    public destroy(): void {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        window.removeEventListener('resize', this.onWindowResize);
        this.renderer.dispose();
    }
}
