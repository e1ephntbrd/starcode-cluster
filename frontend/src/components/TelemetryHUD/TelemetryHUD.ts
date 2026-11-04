/**
 * Heads-Up Display for real-time cluster telemetry, active worker language, and latency.
 */

export class TelemetryHUD {
    private container: HTMLElement;
    private statusEl: HTMLElement;
    private statsEl: HTMLElement;

    constructor(parent: HTMLElement) {
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: absolute;
            top: 25px;
            left: 25px;
            background: rgba(10, 10, 20, 0.85);
            padding: 20px;
            border-radius: 10px;
            border: 1px solid rgba(0, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            font-family: monospace;
            font-size: 13px;
            color: #00ffff;
            z-index: 100;
            min-width: 260px;
        `;

        this.container.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #00ffff33; padding-bottom: 5px; display: flex; justify-content: space-between;">
                <span>STARCODE HUD</span>
                <span id="hud-status" style="color: #00ffaa;">● ONLINE</span>
            </div>
            <div id="hud-stats">
                <div>Active Nodes: 0</div>
                <div>Worker: Standby</div>
                <div>Avg Latency: 0.00 ms</div>
            </div>
        `;

        parent.appendChild(this.container);
        this.statusEl = this.container.querySelector('#hud-status')!;
        this.statsEl = this.container.querySelector('#hud-stats')!;
    }

    public updateStats(nodeCount: number, workerLang: string, latency: number): void {
        this.statsEl.innerHTML = `
            <div>Active Nodes: ${nodeCount}</div>
            <div>Worker: ${workerLang}</div>
            <div>Avg Latency: ${latency.toFixed(2)} ms</div>
        `;
    }
}
