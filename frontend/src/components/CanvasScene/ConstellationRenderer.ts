/**
 * Renders space nodes, laser pulses, and constellation connection geometry (Three.js)
 */

import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { WorkerVisualStyle } from '../../types/cluster';

export class ConstellationRenderer {
    private coreMesh?: THREE.Mesh;
    private group: THREE.Group;
    private nodesMap: Map<string, THREE.Mesh> = new Map();
    private lasersMap: Map<string, Line2[]> = new Map();

    // Line width control
    private radialLaserMaterial: LineMaterial;
    private edgeLaserMaterial: LineMaterial;
    private nodeGeometry: THREE.SphereGeometry;
    private nodeMaterial: THREE.MeshStandardMaterial;

    constructor(sceneManager: { add: (obj: any) => void }) {
        this.group = new THREE.Group();
        sceneManager.add(this.group);

        // 1. core -> node
        this.radialLaserMaterial = new LineMaterial({
            color: 0x00ffff,
            linewidth: 3, // Товщина лінії в пікселях
            transparent: true,
            opacity: 0.85,
            resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
        });

        // 2. node -> closest node (neighbor)
        this.edgeLaserMaterial = new LineMaterial({
            color: 0x9933ff,
            linewidth: 4, // Жирніший контур сузір'я
            transparent: true,
            opacity: 0.9,
            resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
        });

        // 3. node
        this.nodeGeometry = new THREE.SphereGeometry(7, 24, 24);
        this.nodeMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0066,
            emissive: 0xff0088,
            emissiveIntensity: 2.5,
            roughness: 0.2,
            metalness: 0.8,
        });

        window.addEventListener('resize', this.onWindowResize.bind(this));
        this.createCoreCrystal();
    }

    private onWindowResize(): void {
        const resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
        this.radialLaserMaterial.resolution.copy(resolution);
        this.edgeLaserMaterial.resolution.copy(resolution);
    }

    private createCoreCrystal(): void {
        const geometry = new THREE.OctahedronGeometry(25, 0);
        const material = new THREE.MeshStandardMaterial({
            color: 0x00f0ff,
            emissive: 0x0066ff,
            emissiveIntensity: 1.2,
            wireframe: true,
        });

        this.coreMesh = new THREE.Mesh(geometry, material);
        this.coreMesh.name = 'ClusterCore';
        this.group.add(this.coreMesh);
    }

    private getWorkerGeometry(workerLang: string): WorkerVisualStyle {
        const lang = workerLang?.toLowerCase() || '';

        if (lang.includes('python')) {
            return {
                geometry: new THREE.IcosahedronGeometry(22, 0),
                color: 0x3776ab,
            };
        } else if (lang.includes('net') || lang.includes('dotnet')) {
            return {
                geometry: new THREE.BoxGeometry(30, 30, 30),
                color: 0x512bd4,
            };
        } else if (lang.includes('go')) {
            return {
                geometry: new THREE.OctahedronGeometry(25, 0),
                color: 0x00add8,
            };
        }

        return {
            geometry: new THREE.OctahedronGeometry(25, 0),
            color: 0x00f0ff,
        };
    }

    public addSparkPulse(payload: {
        node_id: string;
        worker_language: string;
        origin: { x: number; y: number; z: number };
        target: { x: number; y: number; z: number };
        latency_ms: number;
        constellation_edges: { x: number; y: number; z: number }[];
    }): void {
        const { node_id, target, constellation_edges } = payload;
        const attachedLines: Line2[] = [];

        const nodeMesh = new THREE.Mesh(this.nodeGeometry, this.nodeMaterial);
        nodeMesh.position.set(target.x, target.y, target.z);
        this.group.add(nodeMesh);
        this.nodesMap.set(node_id, nodeMesh);

        const radialGeo = new LineGeometry();
        radialGeo.setPositions([0, 0, 0, target.x, target.y, target.z]);
        const radialLine = new Line2(radialGeo, this.radialLaserMaterial);
        radialLine.computeLineDistances();

        this.group.add(radialLine);
        attachedLines.push(radialLine);

        if (constellation_edges && constellation_edges.length > 0) {
            const edge = constellation_edges[0];
            const edgeGeo = new LineGeometry();
            edgeGeo.setPositions([target.x, target.y, target.z, edge.x, edge.y, edge.z]);

            const edgeLine = new Line2(edgeGeo, this.edgeLaserMaterial);
            edgeLine.computeLineDistances();

            this.group.add(edgeLine);
            attachedLines.push(edgeLine);
        }

        this.lasersMap.set(node_id, attachedLines);
    }

    public updateWorkerShape(workerLanguage: string): void {
        if (!this.coreMesh) return;

        const { geometry, color } = this.getWorkerGeometry(workerLanguage);

        const oldGeometry = this.coreMesh.geometry;
        this.coreMesh.geometry = geometry;
        if (oldGeometry) oldGeometry.dispose();

        if (this.coreMesh.material instanceof THREE.MeshStandardMaterial) {
            this.coreMesh.material.color.setHex(color);
            this.coreMesh.material.emissive.setHex(color);
            this.coreMesh.material.emissiveIntensity = 1.2;
            this.coreMesh.material.wireframe = true;
            this.coreMesh.material.needsUpdate = true;
        }

        this.coreMesh.scale.set(1, 1, 1);
    }

    public clear(): void {
        this.nodesMap.forEach((mesh) => {
            this.group.remove(mesh);
        });
        this.lasersMap.forEach((lines) => {
            lines.forEach((line) => {
                this.group.remove(line);
                line.geometry.dispose();
            });
        });
        this.nodesMap.clear();
        this.lasersMap.clear();
    }

    public update(): void {
        const core = this.group.getObjectByName('ClusterCore');
        if (core) {
            core.rotation.x += 0.005;
            core.rotation.y += 0.008;
        }
    }
}
