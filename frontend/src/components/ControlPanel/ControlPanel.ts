/**
 * DOM interface for launching decryption sequences across sectors.
 */

export class ControlPanel {
    private container: HTMLElement;
    private onIgniteCallback: (sector: string) => void;

    constructor(parent: HTMLElement, onIgnite: (sector: string) => void) {
        this.container = document.createElement('div');
        this.onIgniteCallback = onIgnite;

        this.container.style.cssText = `
            position: absolute;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 15px;
            background: rgba(10, 10, 20, 0.85);
            padding: 15px 25px;
            border-radius: 12px;
            border: 1px solid rgba(0, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            z-index: 100;
        `;

        this.render();
        parent.appendChild(this.container);
    }

    private render(): void {
        const sectors = ['SECTOR-ALPHA', 'SECTOR-BETA', 'SECTOR-GAMMA'];

        sectors.forEach((sector) => {
            const btn = document.createElement('button');
            btn.textContent = `Ignite ${sector}`;
            btn.style.cssText = `
                background: linear-gradient(135deg, #00ffff22, #0066ff33);
                color: #00ffff;
                border: 1px solid #00ffff66;
                padding: 10px 18px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                font-size: 13px;
                letter-spacing: 0.5px;
                transition: all 0.2s ease;
            `;

            btn.onmouseover = () => {
                btn.style.background = 'linear-gradient(135deg, #00ffff44, #0066ff66);';
                btn.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.4)';
            };

            btn.onmouseout = () => {
                btn.style.background = 'linear-gradient(135deg, #00ffff22, #0066ff33);';
                btn.style.boxShadow = 'none';
            };

            btn.onclick = () => {
                this.onIgniteCallback(sector);
            };

            this.container.appendChild(btn);
        });
    }
}
