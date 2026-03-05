class IOSColorPicker {
    constructor() {
        // Core Mathematical State
        this.stateH = 0;
        this.stateS = 0.77;
        this.stateV = 1;

        // Kinematic State
        this.isDraggingHeader = false;
        this.isDraggingField = false;
        this.isDraggingWheel = false;

        // Initialize Architecture
        this.injectArchitecture();
        this.cacheDOM();
        this.bindEvents();
        this.renderFromState();
    }

    injectArchitecture() {
        // Prevent duplicate injections if multiple instances are created
        if (document.getElementById('ios-picker-styles')) return;

        // 1. Inject CSS
        const style = document.createElement('style');
        style.id = 'ios-picker-styles';
        style.innerHTML = `
            :root {
                --picker-bg: #ffffff;
                --picker-btn-bg: #f2f2f7;
                --picker-btn-active: #e5e5ea;
                --picker-grabber: #d1d1d6;
                --picker-backdrop: rgba(0, 0, 0, 0.4);
                --seg-track-bg: #eeeeef; 
                --seg-indicator-bg: #ffffff; 
                --seg-indicator-shadow: 0 3px 8px rgba(0, 0, 0, 0.12), 0 3px 1px rgba(0,0,0,0.04);
                --seg-text-active: #000000;
                --seg-text-inactive: #8e8e93;
                --slider-track: #e5e5ea;
                --mixed-color: rgb(255, 59, 48); 
                --pure-hue: rgb(255, 0, 0);
                --text-primary: #000000;
                --text-secondary: #8e8e93;
                --tint-color: #007AFF;
                --border-color: rgba(0, 0, 0, 0.1);
            }

            @media (prefers-color-scheme: dark) {
                :root {
                    --picker-bg: #1c1c1e;
                    --picker-btn-bg: #2c2c2e;
                    --picker-btn-active: #3a3a3c;
                    --picker-grabber: #48484a;
                    --picker-backdrop: rgba(0, 0, 0, 0.6);
                    --seg-track-bg: #2c2c2e; 
                    --seg-indicator-bg: #636366; 
                    --seg-indicator-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
                    --seg-text-active: #ffffff;
                    --seg-text-inactive: #8e8e93;
                    --slider-track: #3a3a3c;
                    --text-primary: #ffffff;
                    --text-secondary: #8e8e93;
                    --tint-color: #0A84FF;
                    --border-color: rgba(255, 255, 255, 0.15);
                }
            }

            .picker-modal-backdrop {
                position: fixed; inset: 0; background-color: var(--picker-backdrop); opacity: 0; pointer-events: none; z-index: 1000; transition: opacity 0.4s cubic-bezier(0.32, 0.72, 0, 1); will-change: opacity;
            }
            .picker-ios-sheet {
                font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                position: fixed; bottom: 0; left: 0; width: 100%; height: 90dvh; background-color: var(--picker-bg); border-radius: 38px 38px 0 0; box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.15); z-index: 1001; display: flex; flex-direction: column; transform: translateY(100%); pointer-events: none; transition: transform 0.5s cubic-bezier(0.32, 0.72, 0, 1); will-change: transform;
            }
            .picker-modal-active .picker-modal-backdrop { opacity: 1; pointer-events: auto; }
            .picker-modal-active .picker-ios-sheet { transform: translateY(0); pointer-events: auto; }

            .picker-sheet-header { position: relative; width: 100%; height: 54px; display: flex; justify-content: center; flex-shrink: 0; touch-action: none; }
            .picker-sheet-grabber { width: 36px; height: 5px; background-color: var(--picker-grabber); border-radius: 3px; margin-top: 8px; }
            .picker-close-btn {
                position: absolute; top: 12px; right: 16px; width: 30px; height: 30px; border-radius: 15px; background-color: var(--picker-btn-bg); border: none; display: flex; justify-content: center; align-items: center; cursor: pointer; color: var(--text-secondary); transition: background-color 0.15s ease, transform 0.1s;
            }
            .picker-close-btn:active { background-color: var(--picker-btn-active); transform: scale(0.92); }
            .picker-close-btn svg { width: 14px; height: 14px; fill: currentColor; }

            .picker-segmented-container { padding: 0 16px; margin-top: 8px; width: 100%; box-sizing: border-box; flex-shrink: 0; }
            .picker-segmented-control { background-color: var(--seg-track-bg); display: flex; position: relative; height: 36px; border-radius: 18px; padding: 2px; overflow: hidden; }
            .picker-segmented-indicator {
                position: absolute; top: 2px; bottom: 2px; width: calc(16.666% - 0.66px); 
                background-color: var(--seg-indicator-bg); box-shadow: var(--seg-indicator-shadow);
                border-radius: 16px; transform: translateX(200%); 
                transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1); will-change: transform; pointer-events: none; 
            }
            .picker-segment-btn {
                flex: 1; background: transparent; border: none; color: var(--seg-text-inactive);
                font-size: 12px; font-weight: 500; cursor: pointer; z-index: 1; padding: 0; transition: color 0.28s ease, font-weight 0s;
            }
            .picker-segment-btn.active { color: var(--seg-text-active); font-weight: 600; }

            .picker-tab-wrapper { flex: 1; width: 100%; overflow-y: auto; padding: 24px 20px; box-sizing: border-box; }
            .picker-tab-pane { display: none; flex-direction: column; gap: 12px; animation: pickerFadeIn 0.2s ease-out; }
            .picker-tab-pane.active { display: flex; }
            @keyframes pickerFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

            .picker-row-header { display: flex; justify-content: space-between; align-items: center; width: 100%; }
            .picker-color-label { font-size: 13px; font-weight: 600; color: var(--text-primary); letter-spacing: 0.3px; }
            .picker-color-controls { display: flex; align-items: center; }
            .picker-color-input {
                width: 42px; height: 20px; background-color: transparent; border: none; color: var(--text-primary); font-size: 14px; font-weight: 500; text-align: right; 
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace; -webkit-appearance: none; padding: 0; margin-right: 12px; transition: color 0.15s ease;
            }
            .picker-color-input:focus { outline: none; color: var(--tint-color); }
            .picker-nudge-btn {
                background: transparent; border: none; padding: 0; width: 22px; height: 22px; cursor: pointer; display: flex; justify-content: center; align-items: center; transition: transform 0.1s cubic-bezier(0.2, 0, 0, 1), opacity 0.1s ease;
            }
            .picker-nudge-btn + .picker-nudge-btn { margin-left: 5px; }
            .picker-nudge-btn svg { width: 100%; height: 100%; }
            .picker-nudge-btn:active { transform: scale(0.9); opacity: 0.6; }

            .picker-slider { -webkit-appearance: none; width: 100%; height: 32px; background: transparent; margin: 0; outline: none; }
            .picker-slider::-webkit-slider-runnable-track { width: 100%; height: 10px; border-radius: 5px; background: linear-gradient(to right, var(--track-start, #000), var(--track-end, #fff)); }
            .picker-slider-hue::-webkit-slider-runnable-track { background: linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%); }
            .picker-slider-sat::-webkit-slider-runnable-track { background: linear-gradient(to right, var(--sat-start, #808080), var(--sat-end, #ff0000)); }
            .picker-slider-bri::-webkit-slider-runnable-track { background: linear-gradient(to right, #000000, var(--bri-end, #ff0000)); }
            .picker-slider-hsl-sat::-webkit-slider-runnable-track { background: linear-gradient(to right, var(--hsl-sat-start, #808080), var(--hsl-sat-end, #ff0000)); }
            .picker-slider-3pt::-webkit-slider-runnable-track { background: linear-gradient(to right, var(--track-start, #000000), var(--track-mid, #ff0000), var(--track-end, #ffffff)); }

            .picker-slider::-webkit-slider-thumb {
                -webkit-appearance: none; height: 24px; width: 24px; border-radius: 50%; background: radial-gradient(circle, var(--mixed-color) 38%, #ffffff 42%);
                box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15), 0 1px 1px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.04); margin-top: -7px; cursor: pointer; transition: transform 0.1s;
            }
            .picker-slider::-webkit-slider-thumb:active { transform: scale(1.1); }

            .picker-spectrum-container { display: flex; flex-direction: column; gap: 24px; }
            .picker-color-field {
                position: relative; width: 100%; aspect-ratio: 1 / 1; border-radius: 12px; overflow: hidden; touch-action: none; 
                background: linear-gradient(to bottom, transparent, #000000), linear-gradient(to right, #ffffff, var(--pure-hue)); box-shadow: inset 0 0 0 1px rgba(0,0,0,0.06);
            }
            .picker-color-wheel {
                position: relative; width: 100%; aspect-ratio: 1 / 1; border-radius: 50%; overflow: hidden; touch-action: none;
                background: radial-gradient(circle closest-side, #ffffff 0%, transparent 100%), conic-gradient(from 90deg, red 0deg, yellow 60deg, lime 120deg, cyan 180deg, blue 240deg, magenta 300deg, red 360deg);
                box-shadow: inset 0 0 0 1px rgba(0,0,0,0.06);
            }
            .picker-wheel-overlay { position: absolute; inset: 0; border-radius: 50%; background-color: #000000; pointer-events: none; will-change: opacity; }
            .picker-field-reticle {
                position: absolute; width: 26px; height: 26px; border-radius: 50%; border: 2px solid #ffffff;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(0,0,0,0.15); transform: translate(-50%, -50%); pointer-events: none; will-change: transform;
            }

            .picker-global-footer {
                display: flex; justify-content: space-between; align-items: center; padding: 16px 20px calc(16px + env(safe-area-inset-bottom)) 20px;
                background-color: var(--picker-bg); border-top: 1px solid var(--border-color); flex-shrink: 0; 
            }
            .picker-footer-left { display: flex; align-items: center; gap: 14px; }
            .picker-global-swatch { width: 38px; height: 38px; border-radius: 8px; background-color: var(--mixed-color); box-shadow: inset 0 0 0 1px rgba(128,128,128,0.25); }
            .picker-global-color-label { font-size: 15px; font-weight: 600; color: var(--text-primary); }
            .picker-hex-control { display: flex; align-items: center; background-color: var(--picker-btn-bg); border-radius: 8px; padding: 0 12px; height: 36px; }
            .picker-hex-prefix { color: var(--text-secondary); font-size: 15px; font-weight: 500; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace; margin-right: 2px; }
            .picker-hex-input {
                width: 64px; background: transparent; border: none; color: var(--text-primary);
                font-size: 15px; font-weight: 500; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
                text-transform: uppercase; outline: none; padding: 0; transition: color 0.15s ease;
            }
            .picker-hex-input:focus { color: var(--tint-color); }
        `;
        document.head.appendChild(style);

        // 2. Inject HTML Matrix
        const matrix = document.createElement('div');
        matrix.innerHTML = `
            <svg style="display: none;">
                <defs>
                    <symbol id="icon-minus" viewBox="-1 -1 22.35 22.35"><g><path d="M10.1719 20.3516C15.7891 20.3516 20.3516 15.7969 20.3516 10.1797C20.3516 4.5625 15.7891 0 10.1719 0C4.55469 0 0 4.5625 0 10.1797C0 15.7969 4.55469 20.3516 10.1719 20.3516ZM10.1719 18.8984C5.35156 18.8984 1.45312 15 1.45312 10.1797C1.45312 5.35938 5.35156 1.46094 10.1719 1.46094C14.9922 1.46094 18.8906 5.35938 18.8906 10.1797C18.8906 15 14.9922 18.8984 10.1719 18.8984Z" fill="#d6d6d6"/><path d="M6.03906 10.9141L14.2969 10.9141C14.7734 10.9141 15.1094 10.6484 15.1094 10.2031C15.1094 9.74219 14.7969 9.46875 14.2969 9.46875L6.03906 9.46875C5.54688 9.46875 5.22656 9.74219 5.22656 10.2031C5.22656 10.6484 5.5625 10.9141 6.03906 10.9141Z" fill="#474747"/></g></symbol>
                    <symbol id="icon-plus" viewBox="-1 -1 22.35 22.35"><g><path d="M10.1719 20.3516C15.7891 20.3516 20.3516 15.7969 20.3516 10.1797C20.3516 4.5625 15.7891 0 10.1719 0C4.55469 0 0 4.5625 0 10.1797C0 15.7969 4.55469 20.3516 10.1719 20.3516ZM10.1719 18.8984C5.35156 18.8984 1.45312 15 1.45312 10.1797C1.45312 5.35938 5.35156 1.46094 10.1719 1.46094C14.9922 1.46094 18.8906 5.35938 18.8906 10.1797C18.8906 15 14.9922 18.8984 10.1719 18.8984Z" fill="#d6d6d6"/><path d="M10.8828 14.0469L10.8828 6.28906C10.8828 5.85156 10.5859 5.54688 10.1562 5.54688C9.74219 5.54688 9.44531 5.85156 9.44531 6.28906L9.44531 14.0469C9.44531 14.4766 9.74219 14.7812 10.1562 14.7812C10.5859 14.7812 10.8828 14.4844 10.8828 14.0469ZM6.28906 10.8828L14.0469 10.8828C14.4766 10.8828 14.7812 10.5938 14.7812 10.1797C14.7812 9.74219 14.4844 9.44531 14.0469 9.44531L6.28906 9.44531C5.85156 9.44531 5.55469 9.74219 5.55469 10.1797C5.55469 10.5938 5.85156 10.8828 6.28906 10.8828Z" fill="#474747"/></g></symbol>
                </defs>
            </svg>
            <div id="pickerBackdrop" class="picker-modal-backdrop"></div>
            <div id="pickerSheet" class="picker-ios-sheet">
                <div class="picker-sheet-header" id="pickerHeader">
                    <div class="picker-sheet-grabber"></div>
                    <button class="picker-close-btn" id="pickerCloseBtn">
                        <svg viewBox="0 0 24 24"><path d="M19.3 4.71a.996.996 0 0 0-1.41 0L12 10.59 6.11 4.7a.996.996 0 1 0-1.41 1.41L10.59 12l-5.89 5.89a.996.996 0 1 0 1.41 1.41L12 13.41l5.89 5.89a.996.996 0 1 0 1.41-1.41L13.41 12l5.89-5.89c.38-.38.38-1.02 0-1.4z"/></svg>
                    </button>
                </div>
                <div class="picker-segmented-container">
                    <div class="picker-segmented-control">
                        <div class="picker-segmented-indicator" id="pickerSegIndicator"></div>
                        <button class="picker-segment-btn" data-index="0" data-target="p-tab-1">Wheel</button>
                        <button class="picker-segment-btn" data-index="1" data-target="p-tab-2">Spectrum</button>
                        <button class="picker-segment-btn active" data-index="2" data-target="p-tab-3">RGB</button>
                        <button class="picker-segment-btn" data-index="3" data-target="p-tab-4">HSB</button>
                        <button class="picker-segment-btn" data-index="4" data-target="p-tab-5">HSL</button>
                        <button class="picker-segment-btn" data-index="5" data-target="p-tab-6">LAB</button>
                    </div>
                </div>
                <div class="picker-tab-wrapper">
                    <div class="picker-tab-pane" id="p-tab-1">
                        <div class="picker-spectrum-container">
                            <div class="picker-color-wheel" id="pColorWheel"><div class="picker-wheel-overlay" id="pWheelDarken"></div><div class="picker-field-reticle" id="pWheelReticle"></div></div>
                            <input type="range" class="picker-slider picker-slider-bri" id="pWheelBriSlider" min="0" max="100" value="100">
                        </div>
                    </div>
                    <div class="picker-tab-pane" id="p-tab-2">
                        <div class="picker-spectrum-container">
                            <div class="picker-color-field" id="pColorField"><div class="picker-field-reticle" id="pFieldReticle"></div></div>
                            <input type="range" class="picker-slider picker-slider-hue" id="pSpectrumHue" min="0" max="360" value="0">
                        </div>
                    </div>
                    <div class="picker-tab-pane active" id="p-tab-3">
                        ${this.generateRow('Red', 'pInRed', 'pSldRed', 255, 'slider-red')}
                        ${this.generateRow('Green', 'pInGreen', 'pSldGreen', 255, 'slider-green')}
                        ${this.generateRow('Blue', 'pInBlue', 'pSldBlue', 255, 'slider-blue')}
                    </div>
                    <div class="picker-tab-pane" id="p-tab-4">
                        ${this.generateRow('Hue', 'pInHsbH', 'pSldHsbH', 360, 'slider-hue')}
                        ${this.generateRow('Saturation', 'pInHsbS', 'pSldHsbS', 100, 'slider-sat')}
                        ${this.generateRow('Brightness', 'pInHsbB', 'pSldHsbB', 100, 'slider-bri')}
                    </div>
                    <div class="picker-tab-pane" id="p-tab-5">
                        ${this.generateRow('Hue', 'pInHslH', 'pSldHslH', 360, 'slider-hue')}
                        ${this.generateRow('Saturation', 'pInHslS', 'pSldHslS', 100, 'slider-hsl-sat')}
                        ${this.generateRow('Lightness', 'pInHslL', 'pSldHslL', 100, 'slider-3pt slider-hsl-lum')}
                    </div>
                    <div class="picker-tab-pane" id="p-tab-6">
                        ${this.generateRow('Luminance', 'pInLabL', 'pSldLabL', 100, 'slider-3pt', 0)}
                        ${this.generateRow('A (Red-Green)', 'pInLabA', 'pSldLabA', 127, 'slider-3pt', -128)}
                        ${this.generateRow('B (Blue-Yellow)', 'pInLabB', 'pSldLabB', 127, 'slider-3pt', -128)}
                    </div>
                </div>
                <div class="picker-global-footer">
                    <div class="picker-footer-left">
                        <div class="picker-global-swatch"></div>
                        <span class="picker-global-color-label">Selected Color</span>
                    </div>
                    <div class="picker-hex-control">
                        <span class="picker-hex-prefix">#</span>
                        <input type="text" id="pHexInput" class="picker-hex-input" value="FF3B30" maxlength="6" autocomplete="off" spellcheck="false">
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(matrix);
    }

    generateRow(label, inputId, sliderId, max, sliderClass, min = 0) {
        return `
        <div class="picker-row-header">
            <span class="picker-color-label">${label}</span>
            <div class="picker-color-controls">
                <input type="number" class="picker-color-input" id="${inputId}" value="${max}" min="${min}" max="${max}">
                <button class="picker-nudge-btn" data-target="${inputId}" data-step="-1"><svg><use href="#icon-minus"></use></svg></button>
                <button class="picker-nudge-btn" data-target="${inputId}" data-step="1"><svg><use href="#icon-plus"></use></svg></button>
            </div>
        </div>
        <input type="range" class="picker-slider picker-${sliderClass}" id="${sliderId}" min="${min}" max="${max}" value="${max}">`;
    }

    cacheDOM() {
        this.backdrop = document.getElementById('pickerBackdrop');
        this.sheet = document.getElementById('pickerSheet');
        this.header = document.getElementById('pickerHeader');
        this.closeBtn = document.getElementById('pickerCloseBtn');
        
        this.segIndicator = document.getElementById('pickerSegIndicator');
        this.segButtons = document.querySelectorAll('.picker-segment-btn');
        this.tabPanes = document.querySelectorAll('.picker-tab-pane');

        this.colorField = document.getElementById('pColorField');
        this.fieldReticle = document.getElementById('pFieldReticle');
        this.spectrumHue = document.getElementById('pSpectrumHue');
        
        this.colorWheel = document.getElementById('pColorWheel');
        this.wheelReticle = document.getElementById('pWheelReticle');
        this.wheelDarken = document.getElementById('pWheelDarken');
        this.wheelBriSlider = document.getElementById('pWheelBriSlider');
        
        this.hexInput = document.getElementById('pHexInput');

        this.inputs = {
            red: document.getElementById('pInRed'), green: document.getElementById('pInGreen'), blue: document.getElementById('pInBlue'),
            hsbH: document.getElementById('pInHsbH'), hsbS: document.getElementById('pInHsbS'), hsbB: document.getElementById('pInHsbB'),
            hslH: document.getElementById('pInHslH'), hslS: document.getElementById('pInHslS'), hslL: document.getElementById('pInHslL'),
            labL: document.getElementById('pInLabL'), labA: document.getElementById('pInLabA'), labB: document.getElementById('pInLabB')
        };
        this.sliders = {
            red: document.getElementById('pSldRed'), green: document.getElementById('pSldGreen'), blue: document.getElementById('pSldBlue'),
            hsbH: document.getElementById('pSldHsbH'), hsbS: document.getElementById('pSldHsbS'), hsbB: document.getElementById('pSldHsbB'),
            hslH: document.getElementById('pSldHslH'), hslS: document.getElementById('pSldHslS'), hslL: document.getElementById('pSldHslL'),
            labL: document.getElementById('pSldLabL'), labA: document.getElementById('pSldLabA'), labB: document.getElementById('pSldLabB')
        };
    }

    // --- Mathematical Pipelines ---
    hsvToRgb(h, s, v) {
        let r, g, b; let i = Math.floor((h / 360) * 6); let f = (h / 360) * 6 - i; let p = v * (1 - s); let q = v * (1 - f * s); let t = v * (1 - (1 - f) * s);
        switch (i % 6) { case 0: r = v; g = t; b = p; break; case 1: r = q; g = v; b = p; break; case 2: r = p; g = v; b = t; break; case 3: r = p; g = q; b = v; break; case 4: r = t; g = p; b = v; break; case 5: r = v; g = p; b = q; break; }
        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    }
    rgbToHsv(r, g, b) {
        r /= 255; g /= 255; b /= 255; let max = Math.max(r, g, b), min = Math.min(r, g, b); let h, s, v = max; let d = max - min; s = max === 0 ? 0 : d / max;
        if (max === min) h = 0; else { switch (max) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; case b: h = (r - g) / d + 4; break; } h /= 6; }
        return { h: h * 360, s: s, v: v };
    }
    hsvToHsl(h, s, v) { let l = v * (1 - s / 2); let sl = (l === 0 || l === 1) ? 0 : (v - l) / Math.min(l, 1 - l); return { h: h, s: sl, l: l }; }
    hslToHsv(h, sl, l) { let v = l + sl * Math.min(l, 1 - l); let s = (v === 0) ? 0 : 2 * (1 - l / v); return { h: h, s: s, v: v }; }
    hslToRgb(h, s, l) {
        let r, g, b; if (s === 0) { r = g = b = l; } else {
            const hue2rgb = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1/6) return p + (q - p) * 6 * t; if (t < 1/2) return q; if (t < 2/3) return p + (q - p) * (2/3 - t) * 6; return p; };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s; const p = 2 * l - q; r = hue2rgb(p, q, h / 360 + 1/3); g = hue2rgb(p, q, h / 360); b = hue2rgb(p, q, h / 360 - 1/3);
        }
        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    }
    rgbToXyz(r, g, b) {
        r /= 255; g /= 255; b /= 255; r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92; g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92; b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
        return { x: (r * 0.4124 + g * 0.3576 + b * 0.1805) * 100, y: (r * 0.2126 + g * 0.7152 + b * 0.0722) * 100, z: (r * 0.0193 + g * 0.1192 + b * 0.9505) * 100 };
    }
    xyzToLab(x, y, z) { x /= 95.047; y /= 100.000; z /= 108.883; const f = t => t > 0.008856 ? Math.pow(t, 1/3) : (7.787 * t) + (16 / 116); return { l: (116 * f(y)) - 16, a: 500 * (f(x) - f(y)), b: 200 * (f(y) - f(z)) }; }
    rgbToLab(r, g, b) { const xyz = this.rgbToXyz(r, g, b); return this.xyzToLab(xyz.x, xyz.y, xyz.z); }
    labToXyz(l, a, b) { let y = (l + 16) / 116; let x = a / 500 + y; let z = y - b / 200; const fInv = t => Math.pow(t, 3) > 0.008856 ? Math.pow(t, 3) : (t - 16 / 116) / 7.787; return { x: fInv(x) * 95.047, y: fInv(y) * 100.000, z: fInv(z) * 108.883 }; }
    xyzToRgb(x, y, z) {
        x /= 100; y /= 100; z /= 100; let r = x * 3.2406 + y * -1.5372 + z * -0.4986; let g = x * -0.9689 + y * 1.8758 + z * 0.0415; let b = x * 0.0557 + y * -0.2040 + z * 1.0570;
        const f = t => t > 0.0031308 ? 1.055 * Math.pow(t, 1/2.4) - 0.055 : 12.92 * t; r = Math.max(0, Math.min(1, f(r))); g = Math.max(0, Math.min(1, f(g))); b = Math.max(0, Math.min(1, f(b)));
        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    }
    labToRgb(l, a, b) { const xyz = this.labToXyz(l, a, b); return this.xyzToRgb(xyz.x, xyz.y, xyz.z); }
    rgbToHex(r, g, b) { return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase(); }
    hexToRgb(hex) { let result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null; }

    renderFromState() {
        const rgb = this.hsvToRgb(this.stateH, this.stateS, this.stateV);
        const pureRgb = this.hsvToRgb(this.stateH, 1, 1);
        const hsl = this.hsvToHsl(this.stateH, this.stateS, this.stateV);
        const lab = this.rgbToLab(rgb.r, rgb.g, rgb.b);
        
        document.documentElement.style.setProperty('--pure-hue', `rgb(${pureRgb.r}, ${pureRgb.g}, ${pureRgb.b})`);
        document.documentElement.style.setProperty('--mixed-color', `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);

        if(document.activeElement !== this.hexInput) this.hexInput.value = this.rgbToHex(rgb.r, rgb.g, rgb.b);

        this.wheelBriSlider.value = Math.round(this.stateV * 100);
        this.wheelBriSlider.style.setProperty('--bri-end', `rgb(${this.hsvToRgb(this.stateH, this.stateS, 1).r}, ${this.hsvToRgb(this.stateH, this.stateS, 1).g}, ${this.hsvToRgb(this.stateH, this.stateS, 1).b})`);
        this.wheelDarken.style.opacity = 1 - this.stateV;
        const angleRad = this.stateH * Math.PI / 180;
        this.wheelReticle.style.left = `${50 + (this.stateS * 50 * Math.cos(angleRad))}%`; this.wheelReticle.style.top = `${50 + (this.stateS * 50 * Math.sin(angleRad))}%`;

        this.spectrumHue.value = this.stateH; this.fieldReticle.style.left = `${this.stateS * 100}%`; this.fieldReticle.style.top = `${(1 - this.stateV) * 100}%`;

        this.inputs.red.value = rgb.r; this.sliders.red.value = rgb.r; this.inputs.green.value = rgb.g; this.sliders.green.value = rgb.g; this.inputs.blue.value = rgb.b; this.sliders.blue.value = rgb.b;
        this.sliders.red.style.setProperty('--track-start', `rgb(0, ${rgb.g}, ${rgb.b})`); this.sliders.red.style.setProperty('--track-end', `rgb(255, ${rgb.g}, ${rgb.b})`);
        this.sliders.green.style.setProperty('--track-start', `rgb(${rgb.r}, 0, ${rgb.b})`); this.sliders.green.style.setProperty('--track-end', `rgb(${rgb.r}, 255, ${rgb.b})`);
        this.sliders.blue.style.setProperty('--track-start', `rgb(${rgb.r}, ${rgb.g}, 0)`); this.sliders.blue.style.setProperty('--track-end', `rgb(${rgb.r}, ${rgb.g}, 255)`);

        this.inputs.hsbH.value = Math.round(this.stateH); this.sliders.hsbH.value = Math.round(this.stateH);
        this.inputs.hsbS.value = Math.round(this.stateS * 100); this.sliders.hsbS.value = Math.round(this.stateS * 100);
        this.inputs.hsbB.value = Math.round(this.stateV * 100); this.sliders.hsbB.value = Math.round(this.stateV * 100);
        this.sliders.hsbS.style.setProperty('--sat-start', `rgb(${this.hsvToRgb(this.stateH, 0, this.stateV).r}, ${this.hsvToRgb(this.stateH, 0, this.stateV).g}, ${this.hsvToRgb(this.stateH, 0, this.stateV).b})`); this.sliders.hsbS.style.setProperty('--sat-end', `rgb(${this.hsvToRgb(this.stateH, 1, this.stateV).r}, ${this.hsvToRgb(this.stateH, 1, this.stateV).g}, ${this.hsvToRgb(this.stateH, 1, this.stateV).b})`);
        this.sliders.hsbB.style.setProperty('--bri-end', `rgb(${this.hsvToRgb(this.stateH, this.stateS, 1).r}, ${this.hsvToRgb(this.stateH, this.stateS, 1).g}, ${this.hsvToRgb(this.stateH, this.stateS, 1).b})`);

        this.inputs.hslH.value = Math.round(this.stateH); this.sliders.hslH.value = Math.round(this.stateH);
        this.inputs.hslS.value = Math.round(hsl.s * 100); this.sliders.hslS.value = Math.round(hsl.s * 100);
        this.inputs.hslL.value = Math.round(hsl.l * 100); this.sliders.hslL.value = Math.round(hsl.l * 100);
        this.sliders.hslS.style.setProperty('--hsl-sat-start', `rgb(${this.hslToRgb(hsl.h, 0, hsl.l).r}, ${this.hslToRgb(hsl.h, 0, hsl.l).g}, ${this.hslToRgb(hsl.h, 0, hsl.l).b})`); this.sliders.hslS.style.setProperty('--hsl-sat-end', `rgb(${this.hslToRgb(hsl.h, 1, hsl.l).r}, ${this.hslToRgb(hsl.h, 1, hsl.l).g}, ${this.hslToRgb(hsl.h, 1, hsl.l).b})`);
        this.sliders.hslL.style.setProperty('--track-start', '#000000'); this.sliders.hslL.style.setProperty('--track-mid', `rgb(${this.hslToRgb(hsl.h, hsl.s, 0.5).r}, ${this.hslToRgb(hsl.h, hsl.s, 0.5).g}, ${this.hslToRgb(hsl.h, hsl.s, 0.5).b})`); this.sliders.hslL.style.setProperty('--track-end', '#ffffff');

        this.inputs.labL.value = Math.round(lab.l); this.sliders.labL.value = Math.round(lab.l);
        this.inputs.labA.value = Math.round(lab.a); this.sliders.labA.value = Math.round(lab.a);
        this.inputs.labB.value = Math.round(lab.b); this.sliders.labB.value = Math.round(lab.b);
        this.sliders.labL.style.setProperty('--track-start', `rgb(${this.labToRgb(0, lab.a, lab.b).r},${this.labToRgb(0, lab.a, lab.b).g},${this.labToRgb(0, lab.a, lab.b).b})`); this.sliders.labL.style.setProperty('--track-mid', `rgb(${this.labToRgb(50, lab.a, lab.b).r},${this.labToRgb(50, lab.a, lab.b).g},${this.labToRgb(50, lab.a, lab.b).b})`); this.sliders.labL.style.setProperty('--track-end', `rgb(${this.labToRgb(100, lab.a, lab.b).r},${this.labToRgb(100, lab.a, lab.b).g},${this.labToRgb(100, lab.a, lab.b).b})`);
        this.sliders.labA.style.setProperty('--track-start', `rgb(${this.labToRgb(lab.l, -128, lab.b).r},${this.labToRgb(lab.l, -128, lab.b).g},${this.labToRgb(lab.l, -128, lab.b).b})`); this.sliders.labA.style.setProperty('--track-mid', `rgb(${this.labToRgb(lab.l, 0, lab.b).r},${this.labToRgb(lab.l, 0, lab.b).g},${this.labToRgb(lab.l, 0, lab.b).b})`); this.sliders.labA.style.setProperty('--track-end', `rgb(${this.labToRgb(lab.l, 127, lab.b).r},${this.labToRgb(lab.l, 127, lab.b).g},${this.labToRgb(lab.l, 127, lab.b).b})`);
        this.sliders.labB.style.setProperty('--track-start', `rgb(${this.labToRgb(lab.l, lab.a, -128).r},${this.labToRgb(lab.l, lab.a, -128).g},${this.labToRgb(lab.l, lab.a, -128).b})`); this.sliders.labB.style.setProperty('--track-mid', `rgb(${this.labToRgb(lab.l, lab.a, 0).r},${this.labToRgb(lab.l, lab.a, 0).g},${this.labToRgb(lab.l, lab.a, 0).b})`); this.sliders.labB.style.setProperty('--track-end', `rgb(${this.labToRgb(lab.l, lab.a, 127).r},${this.labToRgb(lab.l, lab.a, 127).g},${this.labToRgb(lab.l, lab.a, 127).b})`);
    }

    bindEvents() {
        // Modal State
        this.backdrop.addEventListener('click', () => this.close());
        this.closeBtn.addEventListener('click', () => this.close());

        // Header Kinematics
        let startY = 0, currentY = 0;
        this.header.addEventListener('touchstart', (e) => { startY = e.touches[0].clientY; currentY = startY; this.isDraggingHeader = true; this.sheet.style.transition = 'none'; }, { passive: true });
        this.header.addEventListener('touchmove', (e) => { if (!this.isDraggingHeader) return; currentY = e.touches[0].clientY; const deltaY = currentY - startY; if (deltaY > 0) { e.preventDefault(); this.sheet.style.transform = `translateY(${deltaY}px)`; } }, { passive: false });
        this.header.addEventListener('touchend', () => { if (!this.isDraggingHeader) return; this.isDraggingHeader = false; this.sheet.style.transition = ''; const deltaY = currentY - startY; if (deltaY > 120) { this.close(); } else { this.sheet.style.transform = ''; } });

        // Segmented Control
        this.segButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.segButtons.forEach(b => b.classList.remove('active')); e.target.classList.add('active');
                this.segIndicator.style.transform = `translateX(${e.target.getAttribute('data-index') * 100}%)`;
                this.tabPanes.forEach(pane => { pane.classList.remove('active'); if (pane.id === e.target.getAttribute('data-target')) pane.classList.add('active'); });
            });
        });

        // Sync Generators
        const syncFromRGB = () => { const hsv = this.rgbToHsv(parseInt(this.inputs.red.value)||0, parseInt(this.inputs.green.value)||0, parseInt(this.inputs.blue.value)||0); if (hsv.s !== 0 && hsv.v !== 0) this.stateH = hsv.h; this.stateS = hsv.s; this.stateV = hsv.v; this.renderFromState(); };
        const syncFromHSB = () => { this.stateH = Math.max(0, Math.min(360, parseInt(this.inputs.hsbH.value)||0)); this.stateS = Math.max(0, Math.min(100, parseInt(this.inputs.hsbS.value)||0)) / 100; this.stateV = Math.max(0, Math.min(100, parseInt(this.inputs.hsbB.value)||0)) / 100; this.renderFromState(); };
        const syncFromHSL = () => { const hsv = this.hslToHsv(Math.max(0, Math.min(360, parseInt(this.inputs.hslH.value)||0)), Math.max(0, Math.min(100, parseInt(this.inputs.hslS.value)||0)) / 100, Math.max(0, Math.min(100, parseInt(this.inputs.hslL.value)||0)) / 100); this.stateH = hsv.h; this.stateS = hsv.s; this.stateV = hsv.v; this.renderFromState(); };
        const syncFromLAB = () => { const rgb = this.labToRgb(Math.max(0, Math.min(100, parseInt(this.inputs.labL.value)||0)), Math.max(-128, Math.min(127, parseInt(this.inputs.labA.value)||0)), Math.max(-128, Math.min(127, parseInt(this.inputs.labB.value)||0))); const hsv = this.rgbToHsv(rgb.r, rgb.g, rgb.b); if (hsv.s !== 0 && hsv.v !== 0) this.stateH = hsv.h; this.stateS = hsv.s; this.stateV = hsv.v; this.renderFromState(); };
        const syncFromHex = () => { let val = this.hexInput.value.replace('#', '').trim(); if (val.length === 3) val = val.split('').map(c => c + c).join(''); const rgb = this.hexToRgb(val); if (rgb) { const hsv = this.rgbToHsv(rgb.r, rgb.g, rgb.b); if (hsv.s !== 0 && hsv.v !== 0) this.stateH = hsv.h; this.stateS = hsv.s; this.stateV = hsv.v; this.renderFromState(); } };

        this.hexInput.addEventListener('change', syncFromHex);
        this.hexInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') { this.hexInput.blur(); syncFromHex(); } });

        const bindChannel = (inputEl, sliderEl, syncMethod, maxVal, minVal = 0) => {
            sliderEl.addEventListener('input', (e) => { inputEl.value = e.target.value; syncMethod(); });
            inputEl.addEventListener('input', (e) => { let v = parseInt(e.target.value, 10); if (!isNaN(v)) { sliderEl.value = Math.max(minVal, Math.min(maxVal, v)); syncMethod(); } });
            inputEl.addEventListener('change', (e) => { let v = parseInt(e.target.value, 10); if (isNaN(v)) v = minVal; if (v < minVal) v = minVal; if (v > maxVal) v = maxVal; e.target.value = v; sliderEl.value = v; syncMethod(); });
        };

        bindChannel(this.inputs.red, this.sliders.red, syncFromRGB, 255); bindChannel(this.inputs.green, this.sliders.green, syncFromRGB, 255); bindChannel(this.inputs.blue, this.sliders.blue, syncFromRGB, 255);
        bindChannel(this.inputs.hsbH, this.sliders.hsbH, syncFromHSB, 360); bindChannel(this.inputs.hsbS, this.sliders.hsbS, syncFromHSB, 100); bindChannel(this.inputs.hsbB, this.sliders.hsbB, syncFromHSB, 100);
        bindChannel(this.inputs.hslH, this.sliders.hslH, syncFromHSL, 360); bindChannel(this.inputs.hslS, this.sliders.hslS, syncFromHSL, 100); bindChannel(this.inputs.hslL, this.sliders.hslL, syncFromHSL, 100);
        bindChannel(this.inputs.labL, this.sliders.labL, syncFromLAB, 100); bindChannel(this.inputs.labA, this.sliders.labA, syncFromLAB, 127, -128); bindChannel(this.inputs.labB, this.sliders.labB, syncFromLAB, 127, -128);

        // Nudges
        document.querySelectorAll('.picker-nudge-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetInput = document.getElementById(btn.getAttribute('data-target'));
                const step = parseInt(btn.getAttribute('data-step'), 10);
                const minBoundary = parseInt(targetInput.getAttribute('min')) || 0;
                const maxBoundary = parseInt(targetInput.getAttribute('max')) || 255;
                let current = parseInt(targetInput.value, 10) || 0;
                targetInput.value = Math.max(minBoundary, Math.min(maxBoundary, current + step));
                targetInput.dispatchEvent(new Event('change'));
            });
        });

        // Complex Field Physics
        this.spectrumHue.addEventListener('input', (e) => { this.stateH = parseFloat(e.target.value); this.renderFromState(); });
        const updateField = (e) => { const rect = this.colorField.getBoundingClientRect(); const clientX = e.touches ? e.touches[0].clientX : e.clientX; const clientY = e.touches ? e.touches[0].clientY : e.clientY; this.stateS = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)); this.stateV = 1 - Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)); this.renderFromState(); };
        this.colorField.addEventListener('mousedown', (e) => { this.isDraggingField = true; updateField(e); }); this.colorField.addEventListener('touchstart', (e) => { this.isDraggingField = true; updateField(e); e.preventDefault(); }, {passive: false});
        
        this.wheelBriSlider.addEventListener('input', () => { this.stateV = Math.max(0, Math.min(100, parseInt(this.wheelBriSlider.value)||0)) / 100; this.renderFromState(); });
        const updateWheel = (e) => { const rect = this.colorWheel.getBoundingClientRect(); const clientX = e.touches ? e.touches[0].clientX : e.clientX; const clientY = e.touches ? e.touches[0].clientY : e.clientY; const dx = clientX - (rect.left + rect.width / 2); const dy = clientY - (rect.top + rect.height / 2); let angle = Math.atan2(dy, dx) * 180 / Math.PI; if (angle < 0) angle += 360; this.stateH = angle; this.stateS = Math.min(1, Math.sqrt(dx*dx + dy*dy) / (rect.width / 2)); this.renderFromState(); };
        this.colorWheel.addEventListener('mousedown', (e) => { this.isDraggingWheel = true; updateWheel(e); }); this.colorWheel.addEventListener('touchstart', (e) => { this.isDraggingWheel = true; updateWheel(e); e.preventDefault(); }, {passive: false});

        window.addEventListener('mousemove', (e) => { if(this.isDraggingField) updateField(e); if(this.isDraggingWheel) updateWheel(e); }); 
        window.addEventListener('touchmove', (e) => { if(this.isDraggingField) updateField(e); if(this.isDraggingWheel) updateWheel(e); }, {passive: false});
        window.addEventListener('mouseup', () => { this.isDraggingField = false; this.isDraggingWheel = false; }); 
        window.addEventListener('touchend', () => { this.isDraggingField = false; this.isDraggingWheel = false; });
    }

    open() { document.body.classList.add('picker-modal-active'); }
    close() { document.body.classList.remove('picker-modal-active'); setTimeout(() => { this.sheet.style.transform = ''; }, 500); }
}
