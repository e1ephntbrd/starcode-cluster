/**
 * Manages real-time communication with the Node.js Gateway.
 */

export type MessageHandler = (event: string, payload: any) => void;

export class WebSocketClient {
    private ws: WebSocket | null = null;
    private url: string;
    private handlers: MessageHandler[] = [];

    constructor() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        this.url = `${protocol}//${host}:8080`;
    }

    public connect(): void {
        console.log(`[WebSocket] Connecting to orchestrator at ${this.url}...`);
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log('[WebSocket] Connection established successfully.');
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handlers.forEach(handler => handler(data.event, data.payload || data));
            } catch (err) {
                console.error('[WebSocket] Failed to parse message:', err);
            }
        };

        this.ws.onclose = () => {
            console.warn('[WebSocket] Connection closed. Reconnecting in 3s...');
            setTimeout(() => this.connect(), 3000);
        };

        this.ws.onerror = (error) => {
            console.error('[WebSocket] Error encountered:', error);
        };
    }

    public sendAction(action: string, sector: string): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ action, sector }));
        } else {
            console.warn('[WebSocket] Cannot send action, socket is not open.');
        }
    }

    public onMessage(handler: MessageHandler): void {
        this.handlers.push(handler);
    }
}
