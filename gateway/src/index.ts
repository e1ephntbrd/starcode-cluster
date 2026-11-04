/**
 * Main entry point for Node.js Orchestrator Gateway.
 * Bridges WebSocket client connections with gRPC microservice streams.
 */

import { WebSocketServer, WebSocket } from 'ws';
import { pythonClient, dotnetClient, goClient } from './grpcClient';

const PORT = Number(process.env.PORT) || 8080;
const wss = new WebSocketServer({ port: PORT });

console.log(`[Gateway] Orchestrator WebSocket server running on port ${PORT}`);

wss.on('connection', (ws: WebSocket) => {
    console.log('[Gateway] Client connected via WebSocket');

    ws.on('message', (message: Buffer) => {
        try {
            const data = JSON.parse(message.toString());
            console.log('[Gateway] Received command:', data);

            if (data.action === 'IGNITE_CORE') {
                triggerSectorDecryption(ws, data.sector || 'SECTOR-ALPHA');
            }
        } catch (error) {
            console.error('[Gateway] Failed to parse incoming WebSocket message:', error);
        }
    });

    ws.on('close', () => {
        console.log('[Gateway] Client disconnected');
    });
});

/**
 * Initiates a gRPC server-side stream request to the worker and pipes pulses to WebSocket.
 *
 * @param {WebSocket} ws - Active WebSocket connection to the frontend client.
 * @param {string} sectorId - Target sector identifier for decryption.
 */
function triggerSectorDecryption(ws: WebSocket, sectorId: string): void {
    console.log(`[Gateway] Triggering gRPC DecodeSector for ${sectorId}...`);

    let activeClient = pythonClient;
    let workerLabel = 'Python (NumPy)';

    if (sectorId === 'SECTOR-ALPHA') {
        activeClient = pythonClient;
        workerLabel = 'Python (NumPy)';
    } else if (sectorId === 'SECTOR-BETA') {
        activeClient = dotnetClient;
        workerLabel = '.NET Enterprise';
    } else if (sectorId === 'SECTOR-GAMMA') {
        activeClient = goClient;
        workerLabel = 'Go Cluster';
    }

    const requestPayload = {
        sector_id: sectorId,
        target_nodes: 12,
        energy_level: 0.95,
    };

    const call = activeClient.DecodeSector(requestPayload);

    call.on('data', (sparkPulse: any) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(
                JSON.stringify({
                    event: 'SPARK_PULSE',
                    payload: sparkPulse,
                    worker: workerLabel,
                })
            );
        }
    });

    call.on('error', (error: Error) => {
        console.error('[Gateway] gRPC stream error:', error.message);
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(
                JSON.stringify({
                    event: 'ERROR',
                    message: error.message,
                })
            );
        }
    });

    call.on('end', () => {
        console.log('[Gateway] gRPC stream finished successfully');
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(
                JSON.stringify({
                    event: 'CONSTELLATION_COMPLETE',
                })
            );
        }
    });
}
