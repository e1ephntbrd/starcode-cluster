/**
 * Entry point for Starcode Cluster frontend application
 * Initializes Three.js scene, WebSocket client, UI components, and event binding
 */

import { SceneManager } from './components/CanvasScene/SceneManager';
import { ConstellationRenderer } from './components/CanvasScene/ConstellationRenderer';
import { ControlPanel } from './components/ControlPanel/ControlPanel';
import { TelemetryHUD } from './components/TelemetryHUD/TelemetryHUD';
import { WebSocketClient } from './core/WebSocketClient';

const appContainer = document.getElementById('app')!;

const sceneManager = new SceneManager(appContainer);
const constellationRenderer = new ConstellationRenderer(sceneManager);

const hud = new TelemetryHUD(appContainer);
const wsClient = new WebSocketClient();

let nodeCounter = 0;
let totalLatency = 0;

wsClient.onMessage((event, payload) => {
    if (event === 'SPARK_PULSE') {
        nodeCounter++;
        totalLatency += payload.latency_ms;
        const avgLatency = totalLatency / nodeCounter;

        constellationRenderer.addSparkPulse(payload);

        console.log('[Frontend] Received worker language:', payload.worker_language);
        if (payload.worker_language) {
            constellationRenderer.updateWorkerShape(payload.worker_language);
        }

        hud.updateStats(nodeCounter, payload.worker_language, avgLatency);
    } else if (event === 'CONSTELLATION_COMPLETE') {
        console.log('[Frontend] Sector decryption stream completed.');
    }
});

wsClient.connect();

new ControlPanel(appContainer, (sector) => {
    console.log(`[Frontend] Ignited sector: ${sector}`);
    nodeCounter = 0;
    totalLatency = 0;
    constellationRenderer.clear();
    wsClient.sendAction('IGNITE_CORE', sector);
});
