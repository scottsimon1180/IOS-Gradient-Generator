    // Update the constructor to accept configuration options
    constructor(options = {}) {
        this.onChangeCallback = options.onChange || null;
        
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
        
        // If an initial color was passed, set it before the first render
        if (options.initialColor) {
            this.hexInput.value = options.initialColor;
            this.syncFromHex(); 
        } else {
            this.renderFromState();
        }
    }

    // Move syncFromHex to be a class method so it can be called by the constructor
    syncFromHex() { 
        let val = this.hexInput.value.replace('#', '').trim(); 
        if (val.length === 3) val = val.split('').map(c => c + c).join(''); 
        const rgb = this.hexToRgb(val); 
        if (rgb) { 
            const hsv = this.rgbToHsv(rgb.r, rgb.g, rgb.b); 
            if (hsv.s !== 0 && hsv.v !== 0) this.stateH = hsv.h; 
            this.stateS = hsv.s; 
            this.stateV = hsv.v; 
            this.renderFromState(); 
        } 
    }

    // Add the callback trigger to the render function
    renderFromState() {
        const rgb = this.hsvToRgb(this.stateH, this.stateS, this.stateV);
        const pureRgb = this.hsvToRgb(this.stateH, 1, 1);
        const hsl = this.hsvToHsl(this.stateH, this.stateS, this.stateV);
        const lab = this.rgbToLab(rgb.r, rgb.g, rgb.b);
        
        document.documentElement.style.setProperty('--pure-hue', `rgb(${pureRgb.r}, ${pureRgb.g}, ${pureRgb.b})`);
        document.documentElement.style.setProperty('--mixed-color', `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);

        const finalHex = this.rgbToHex(rgb.r, rgb.g, rgb.b);

        if(document.activeElement !== this.hexInput) this.hexInput.value = finalHex;
        
        // FIRE THE CALLBACK TO THE MAIN HTML FILE
        if (this.onChangeCallback) {
            this.onChangeCallback(finalHex);
        }

        // ... [The rest of the renderFromState UI updating logic remains exactly the same] ...
        
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
