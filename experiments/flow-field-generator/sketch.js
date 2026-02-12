let particles = [];
let flowField = [];
let cols, rows;
let zoff = 0;
let attractorPos;

// GUI Parameters
let params = {
    // Mode
    mode: 'Generate', // 'Generate', 'Brush', or 'Spawn'
    
    // Particle settings
    particleCount: 500,
    particleSpeed: 2,
    particleAlpha: 255, // Changed default to fully opaque
    particleSpacing: 30, // Minimum distance between particles
    maintainDistance: true, // Enable distance-based repulsion
    repulsionStrength: 1.0,
    trailLength: false, // Changed default to disabled
    maxTrailLength: 500, // Maximum number of points in trail
    simulateParticles: true,
    
    // Spawn settings
    spawnAmount: 10, // Number of particles to spawn per click
    spawnRadius: 50, // Radius within which to spawn particles
    
    // Particle appearance
    particleShape: 'line', // 'line', 'dot', 'rect', 'triangle'
    particleWidth: 2,
    particleHeight: 2,
    particleSizeVariation: 0, // 0-100% variation in size
    
    // Color palette
    useColorPalette: false,
    colorPalette: '#EE3124, #7851A9, #003DA5, #00457C, #1B3D4F', // RAL 3024 Red Fluo, Pantone 2587 C, 287 C, 294 C, 296 C
    
    // Flow field
    noiseScale: 0.01,
    noiseStrength: 1.0,
    timeSpeed: 0.002,
    fieldResolution: 20, // Cell size in pixels for flow field grid
    
    // Brush settings
    brushSize: 50,
    brushStrength: 1.0,
    
    // Forces
    windForce: 0.3,
    windAngle: 0,
    turbulence: 0.5,
    attractorStrength: 0.2,
    attractorRadius: 200,
    
    // Visual
    backgroundColor: '#0a0a0a',
    backgroundAlpha: 255, // 0 = transparent, 255 = opaque
    particleColor: '#ffffff',
    flowFieldColor: '#4488ff',
    showFlowField: false,
    
    // SVG Export
    simplifyPaths: true,
    pathSampling: 3, // Sample every Nth point (1=all, 2=half, 3=third, etc.)
    trailFade: true, // Enable fade effect on trails
    fadeIntensity: 0.3, // Minimum opacity at trail start (0=invisible, 1=no fade)
    exportTrailLength: 150, // Number of most recent points to export (visual length)
    
    // Actions
    reset: function() { initParticles(); },
    clear: function() { background(params.backgroundColor); },
    clearParticles: function() { particles = []; paths = []; },
    resetFlowField: function() { initFlowField(); },
    exportSVG: function() { exportFiles(); }
};

let brushing = false;
let spawning = false;
let parsedColorPalette = [];

let gui;
let paths = []; // Store paths for SVG export
let showInstructions = true;

function setup() {
    // Make canvas responsive to window size
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('canvas-container');
    
    // Set background with alpha
    let bgColor = color(params.backgroundColor);
    background(red(bgColor), green(bgColor), blue(bgColor), params.backgroundAlpha);
    
    updateFieldGrid();
    
    attractorPos = createVector(width / 2, height / 2);
    
    initFlowField();
    initParticles();
    setupGUI();
    parseColorPalette();
    
    // Show initial instructions
    console.log('=== FLOW FIELD GENERATOR ===');
    console.log('THREE MODES:');
    console.log('  GENERATE: Auto flow field with attractor');
    console.log('  BRUSH: Drag to paint custom flow field');
    console.log('  SPAWN: Click to spawn particle groups');
    console.log('Press [B] to cycle modes | [H] hide instructions');
    console.log('===========================');
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    updateFieldGrid();
    initFlowField();
    // Recenter attractor
    attractorPos.x = width / 2;
    attractorPos.y = height / 2;
}

function updateFieldGrid() {
    cols = floor(width / params.fieldResolution);
    rows = floor(height / params.fieldResolution);
}

function parseColorPalette() {
    // Parse comma-separated hex colors
    let colors = params.colorPalette.split(',').map(c => c.trim());
    parsedColorPalette = colors.filter(c => c.match(/^#[0-9A-Fa-f]{6}$/));
    if (parsedColorPalette.length === 0) {
        parsedColorPalette = ['#ffffff']; // Fallback
    }
    console.log('Color palette loaded:', parsedColorPalette);
}

function getParticleColor() {
    if (params.useColorPalette && parsedColorPalette.length > 0) {
        return random(parsedColorPalette);
    }
    return params.particleColor;
}

function initFlowField() {
    flowField = new Array(cols * rows);
    // Initialize with zero vectors for brush mode
    for (let i = 0; i < flowField.length; i++) {
        flowField[i] = createVector(0, 0);
    }
}

function initParticles() {
    particles = [];
    paths = [];
    
    // Always use grid when maintaining distance
    let spacing = params.particleSpacing;
    let cols = floor(width / spacing);
    let rows = floor(height / spacing);
    let totalGridParticles = cols * rows;
    
    // Add offset to center the grid
    let offsetX = (width - (cols - 1) * spacing) / 2;
    let offsetY = (height - (rows - 1) * spacing) / 2;
    
    // Use the smaller of particleCount or grid capacity
    let particlesToCreate = min(params.particleCount, totalGridParticles);
    
    for (let i = 0; i < particlesToCreate; i++) {
        let x = (i % cols) * spacing + offsetX;
        let y = floor(i / cols) * spacing + offsetY;
        
        // Add small random offset for organic feel
        x += random(-spacing * 0.15, spacing * 0.15);
        y += random(-spacing * 0.15, spacing * 0.15);
        
        particles.push(new Particle(x, y));
        // Each particle has an array of path segments
        // paths[i] = [[segment1_points], [segment2_points], ...]
        paths.push([[]]);
    }
}

function draw() {
    // Convert hex color to RGB and add alpha
    let bgColor = color(params.backgroundColor);
    let r = red(bgColor);
    let g = green(bgColor);
    let b = blue(bgColor);
    
    if (params.trailLength) {
        // Trail mode: semi-transparent overlay
        fill(r, g, b, 10);
        noStroke();
        rect(0, 0, width, height);
    } else {
        // No trail: solid background with alpha
        background(r, g, b, params.backgroundAlpha);
    }
    
    // Update flow field only in Generate mode
    if (params.mode === 'Generate') {
        updateFlowField();
    }
    
    // Draw flow field (hide during export)
    if (!isExporting && (params.mode === 'Brush' || params.showFlowField)) {
        drawFlowField();
    }
    
    // Draw brush cursor in Brush mode (hide during export)
    if (!isExporting && params.mode === 'Brush') {
        drawBrushCursor();
    }
    
    // Draw spawn cursor in Spawn mode (hide during export)
    if (!isExporting && params.mode === 'Spawn') {
        drawSpawnCursor();
    }
    
    // Update and draw particles only if simulation is active
    if (params.simulateParticles) {
        // Apply separation forces if maintaining distance
        if (params.maintainDistance) {
            applySeparation();
        }
        
        for (let i = 0; i < particles.length; i++) {
            particles[i].follow(flowField);
            particles[i].update();
            let wrapped = particles[i].edges();
            particles[i].show();
            
            // Store path for SVG export
            if (params.trailLength) {
                // If particle wrapped, start a new path segment
                if (wrapped) {
                    // Add a new empty segment
                    paths[i].push([]);
                }
                
                // Get current segment (last one in the array)
                let currentSegment = paths[i][paths[i].length - 1];
                currentSegment.push(createVector(particles[i].pos.x, particles[i].pos.y));
                
                // Limit segment length to prevent memory issues
                if (currentSegment.length > params.maxTrailLength) {
                    currentSegment.shift();
                }
            }
        }
    }
    
    // Draw attractor position (only in Generate mode and not exporting)
    if (!isExporting && params.mode === 'Generate' && params.attractorStrength > 0) {
        noFill();
        stroke(255, 255, 0, 50);
        strokeWeight(2);
        circle(attractorPos.x, attractorPos.y, params.attractorRadius * 2);
    }
    
    if (params.mode === 'Generate') {
        zoff += params.timeSpeed;
    }
    
    // Draw instructions overlay (hide during export)
    if (!isExporting && showInstructions) {
        drawInstructions();
    }
}

function drawInstructions() {
    push();
    fill(0, 0, 0, 200);
    noStroke();
    rectMode(CORNER);
    let boxHeight = params.mode === 'Spawn' ? 140 : (params.mode === 'Brush' ? 140 : 120);
    rect(10, 10, 340, boxHeight, 5);
    
    fill(255);
    textSize(14);
    textAlign(LEFT, TOP);
    
    let y = 20;
    text('MODE: ' + params.mode.toUpperCase(), 20, y);
    y += 25;
    
    if (params.mode === 'Brush') {
        fill(100, 200, 255);
        text('🖌️ DRAG mouse to paint flow field', 20, y);
        y += 20;
        fill(150);
        text('Flow field stays fixed after painting', 20, y);
        y += 20;
        text('Adjust Brush Size & Strength →', 20, y);
        y += 20;
        text('Use SPAWN mode to add particles', 20, y);
    } else if (params.mode === 'Spawn') {
        fill(100, 255, 100);
        text('🖱️ CLICK to spawn particles', 20, y);
        y += 20;
        fill(150);
        text(`Spawns ${params.spawnAmount} particles per click`, 20, y);
        y += 20;
        text(`Within ${params.spawnRadius}px radius`, 20, y);
        y += 20;
        text('Adjust amount & radius in panel →', 20, y);
    } else {
        fill(100, 255, 150);
        text('🌊 Flow field auto-generated', 20, y);
        y += 20;
        fill(150);
        text('Mouse controls attractor', 20, y);
        y += 20;
        text('Use SPAWN mode to add particles', 20, y);
    }
    
    y += 25;
    fill(200);
    text('[B] Cycle modes  [H] Hide this', 20, y);
    
    pop();
}

function updateFlowField() {
    let yoff = 0;
    for (let y = 0; y < rows; y++) {
        let xoff = 0;
        for (let x = 0; x < cols; x++) {
            let index = x + y * cols;
            let angle = noise(xoff, yoff, zoff) * TWO_PI * 4;
            let v = p5.Vector.fromAngle(angle);
            v.setMag(params.noiseStrength);
            flowField[index] = v;
            xoff += params.noiseScale;
        }
        yoff += params.noiseScale;
    }
}

function applySeparation() {
    // Use spatial hashing for better performance
    let desiredSeparation = params.particleSpacing;
    
    for (let i = 0; i < particles.length; i++) {
        let sum = createVector(0, 0);
        let count = 0;
        
        // Check nearby particles (simple O(n²) for small particle counts)
        for (let j = 0; j < particles.length; j++) {
            if (i !== j) {
                let d = p5.Vector.dist(particles[i].pos, particles[j].pos);
                
                if (d < desiredSeparation && d > 0) {
                    // Calculate repulsion force
                    let diff = p5.Vector.sub(particles[i].pos, particles[j].pos);
                    diff.normalize();
                    diff.div(d); // Weight by distance (closer = stronger)
                    sum.add(diff);
                    count++;
                }
            }
        }
        
        if (count > 0) {
            sum.div(count);
            sum.normalize();
            sum.mult(params.repulsionStrength);
            particles[i].applyForce(sum);
        }
    }
}

function drawFlowField() {
    let arrowColor = params.mode === 'Brush' ? params.flowFieldColor : color(100, 100, 100);
    let alpha = params.mode === 'Brush' ? 180 : 50;
    
    stroke(red(arrowColor), green(arrowColor), blue(arrowColor), alpha);
    strokeWeight(params.mode === 'Brush' ? 2 : 1);
    
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            let index = x + y * cols;
            let v = flowField[index];
            let px = x * params.fieldResolution + params.fieldResolution / 2;
            let py = y * params.fieldResolution + params.fieldResolution / 2;
            
            // Draw arrow
            push();
            translate(px, py);
            
            let mag = v.mag();
            if (mag > 0.01) {
                rotate(v.heading());
                let len = params.fieldResolution * 0.4 * min(mag, 2);
                
                // Arrow line
                line(0, 0, len, 0);
                
                // Arrow head
                let arrowSize = 3;
                line(len, 0, len - arrowSize, -arrowSize);
                line(len, 0, len - arrowSize, arrowSize);
            } else {
                // Draw a small circle for zero vectors
                noFill();
                circle(0, 0, 2);
            }
            
            pop();
        }
    }
}

function drawBrushCursor() {
    if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
        noFill();
        stroke(params.flowFieldColor);
        strokeWeight(2);
        circle(mouseX, mouseY, params.brushSize * 2);
        
        // Draw direction indicator if brushing
        if (brushing && pmouseX !== mouseX && pmouseY !== mouseY) {
            let angle = atan2(mouseY - pmouseY, mouseX - pmouseX);
            push();
            translate(mouseX, mouseY);
            rotate(angle);
            stroke(255, 255, 0);
            strokeWeight(3);
            line(0, 0, params.brushSize, 0);
            // Arrow head
            line(params.brushSize, 0, params.brushSize - 8, -5);
            line(params.brushSize, 0, params.brushSize - 8, 5);
            pop();
        }
    }
}

function drawSpawnCursor() {
    if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
        noFill();
        stroke(100, 255, 100);
        strokeWeight(2);
        
        // Outer circle showing spawn radius
        circle(mouseX, mouseY, params.spawnRadius * 2);
        
        // Inner crosshair
        stroke(100, 255, 100, 150);
        strokeWeight(1);
        line(mouseX - 10, mouseY, mouseX + 10, mouseY);
        line(mouseX, mouseY - 10, mouseX, mouseY + 10);
        
        // Small dots showing approximate spawn positions
        fill(100, 255, 100, 100);
        noStroke();
        for (let i = 0; i < min(params.spawnAmount, 20); i++) {
            let angle = (i / params.spawnAmount) * TWO_PI;
            let r = params.spawnRadius * 0.7;
            let x = mouseX + cos(angle) * r;
            let y = mouseY + sin(angle) * r;
            circle(x, y, 3);
        }
    }
}

function brushFlowField() {
    if (params.mode !== 'Brush') return;
    
    // Calculate brush direction from mouse movement
    let angle = atan2(mouseY - pmouseY, mouseX - pmouseX);
    let brushDirection = p5.Vector.fromAngle(angle);
    brushDirection.setMag(params.brushStrength);
    
    // Apply brush to affected cells
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            let px = x * params.fieldResolution + params.fieldResolution / 2;
            let py = y * params.fieldResolution + params.fieldResolution / 2;
            let d = dist(mouseX, mouseY, px, py);
            
            if (d < params.brushSize) {
                let index = x + y * cols;
                // Blend the brush direction with existing direction
                let influence = map(d, 0, params.brushSize, 1, 0);
                let blendedVector = p5.Vector.lerp(flowField[index], brushDirection, influence * 0.3);
                flowField[index] = blendedVector;
            }
        }
    }
}

function mousePressed() {
    if (params.mode === 'Brush') {
        brushing = true;
    } else if (params.mode === 'Spawn') {
        spawning = true;
        spawnParticlesAtMouse(); // Spawn immediately on press
    }
}

function mouseReleased() {
    brushing = false;
    spawning = false;
}

function mouseDragged() {
    if (brushing && params.mode === 'Brush') {
        brushFlowField();
    } else if (spawning && params.mode === 'Spawn') {
        spawnParticlesAtMouse(); // Continue spawning while dragging
    }
}

function mouseClicked() {
    // Removed - now handled by mousePressed/mouseDragged
}

function spawnParticlesAtMouse() {
    if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
        for (let i = 0; i < params.spawnAmount; i++) {
            // Random position within spawn radius
            let angle = random(TWO_PI);
            let distance = random(params.spawnRadius);
            let x = mouseX + cos(angle) * distance;
            let y = mouseY + sin(angle) * distance;
            
            // Keep within bounds
            x = constrain(x, 0, width);
            y = constrain(y, 0, height);
            
            // Add new particle
            particles.push(new Particle(x, y));
            // Initialize with array of segments (same structure as initParticles)
            paths.push([[]]);
            
            // Remove oldest particles if exceeding particleCount limit
            if (particles.length > params.particleCount) {
                particles.shift(); // Remove first (oldest) particle
                paths.shift();     // Remove corresponding path
            }
        }
        console.log(`Spawned ${params.spawnAmount} particles at (${mouseX}, ${mouseY})`);
    }
}

function mouseMoved() {
    if (params.mode === 'Generate') {
        attractorPos.x = mouseX;
        attractorPos.y = mouseY;
    }
}

class Particle {
    constructor(x, y) {
        if (x !== undefined && y !== undefined) {
            this.pos = createVector(x, y);
        } else {
            this.pos = createVector(random(width), random(height));
        }
        this.vel = createVector(0, 0);
        this.acc = createVector(0, 0);
        this.maxSpeed = params.particleSpeed;
        this.prevPos = this.pos.copy();
        this.color = getParticleColor(); // Assign color from palette
        
        // Size variation
        let sizeVar = params.particleSizeVariation / 100;
        this.sizeMultiplier = random(1 - sizeVar, 1 + sizeVar);
    }
    
    follow(vectors) {
        let x = floor(this.pos.x / params.fieldResolution);
        let y = floor(this.pos.y / params.fieldResolution);
        let index = x + y * cols;
        let force = vectors[index];
        if (force) {
            this.applyForce(force);
        }
    }
    
    applyForce(force) {
        this.acc.add(force);
    }
    
    update() {
        // Apply wind force
        if (params.windForce > 0) {
            let wind = p5.Vector.fromAngle(radians(params.windAngle));
            wind.mult(params.windForce * 0.1);
            this.applyForce(wind);
        }
        
        // Apply turbulence
        if (params.turbulence > 0) {
            let turbulence = p5.Vector.random2D();
            turbulence.mult(params.turbulence * 0.1);
            this.applyForce(turbulence);
        }
        
        // Apply attractor force
        if (params.attractorStrength > 0) {
            let attractorForce = p5.Vector.sub(attractorPos, this.pos);
            let distance = attractorForce.mag();
            
            if (distance < params.attractorRadius) {
                attractorForce.normalize();
                let strength = map(distance, 0, params.attractorRadius, params.attractorStrength, 0);
                attractorForce.mult(strength * 0.1);
                this.applyForce(attractorForce);
            }
        }
        
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.mult(0);
    }
    
    show() {
        let alpha = params.particleAlpha.toString(16).padStart(2, '0');
        let particleColor = this.color || params.particleColor;
        let w = params.particleWidth * this.sizeMultiplier;
        let h = params.particleHeight * this.sizeMultiplier;
        
        if (params.particleShape === 'line') {
            // Traditional line trail
            stroke(particleColor + alpha);
            strokeWeight(w);
            line(this.pos.x, this.pos.y, this.prevPos.x, this.prevPos.y);
            
        } else if (params.particleShape === 'dot') {
            // Circular dots
            fill(particleColor + alpha);
            noStroke();
            ellipse(this.pos.x, this.pos.y, w, h);
            
        } else if (params.particleShape === 'rect') {
            // Rectangles oriented along velocity
            push();
            translate(this.pos.x, this.pos.y);
            
            // Rotate based on velocity direction
            if (this.vel.mag() > 0.1) {
                rotate(this.vel.heading());
            }
            
            fill(particleColor + alpha);
            noStroke();
            rectMode(CENTER);
            rect(0, 0, w, h);
            pop();
            
        } else if (params.particleShape === 'triangle') {
            // Triangles oriented along velocity (pointing forward)
            push();
            translate(this.pos.x, this.pos.y);
            
            // Rotate based on velocity direction
            if (this.vel.mag() > 0.1) {
                rotate(this.vel.heading());
            }
            
            fill(particleColor + alpha);
            noStroke();
            
            // Draw triangle pointing right (direction of travel)
            triangle(
                w/2, 0,           // tip (front)
                -w/2, -h/2,       // back top
                -w/2, h/2         // back bottom
            );
            pop();
        }
        
        this.updatePrev();
    }
    
    updatePrev() {
        this.prevPos.x = this.pos.x;
        this.prevPos.y = this.pos.y;
    }
    
    edges() {
        // Wrap around screen edges (teleport to opposite side)
        // Returns true if wrapping occurred
        let wrapped = false;
        
        if (this.pos.x > width) {
            this.pos.x = 0;
            this.prevPos.x = 0;
            wrapped = true;
        }
        if (this.pos.x < 0) {
            this.pos.x = width;
            this.prevPos.x = width;
            wrapped = true;
        }
        if (this.pos.y > height) {
            this.pos.y = 0;
            this.prevPos.y = 0;
            wrapped = true;
        }
        if (this.pos.y < 0) {
            this.pos.y = height;
            this.prevPos.y = height;
            wrapped = true;
        }
        
        return wrapped;
    }
}

function setupGUI() {
    gui = new dat.GUI();
    
    // Mode selection
    gui.add(params, 'mode', ['Generate', 'Brush', 'Spawn']).name('Mode').onChange((value) => {
        if (value === 'Brush') {
            params.simulateParticles = true;
            params.showFlowField = true;
            console.log('BRUSH MODE: Drag to paint flow field.');
        } else if (value === 'Spawn') {
            params.simulateParticles = true;
            console.log('SPAWN MODE: Click to spawn particles.');
        } else {
            params.showFlowField = false;
            console.log('GENERATE MODE: Flow field auto-generated.');
        }
    });
    
    let particleFolder = gui.addFolder('Particles');
    particleFolder.add(params, 'simulateParticles').name('Simulate');
    particleFolder.add(params, 'particleCount', 50, 2000).step(50).onChange(() => initParticles());
    particleFolder.add(params, 'particleSpacing', 10, 100).step(5).name('Min Distance');
    particleFolder.add(params, 'maintainDistance').name('Maintain Distance');
    particleFolder.add(params, 'repulsionStrength', 0.1, 3).step(0.1).name('Repulsion');
    particleFolder.add(params, 'particleSpeed', 0.1, 5).step(0.1);
    particleFolder.add(params, 'particleAlpha', 5, 255).step(5);
    particleFolder.add(params, 'trailLength').name('Enable Trails');
    particleFolder.add(params, 'maxTrailLength', 50, 2000).step(50).name('Max Trail Length');
    particleFolder.open();
    
    let appearanceFolder = gui.addFolder('Particle Appearance');
    appearanceFolder.add(params, 'particleShape', ['line', 'dot', 'rect', 'triangle']).name('Shape');
    appearanceFolder.add(params, 'particleWidth', 1, 160).step(0.5).name('Width');
    appearanceFolder.add(params, 'particleHeight', 1, 160).step(0.5).name('Height');
    appearanceFolder.add(params, 'particleSizeVariation', 0, 100).step(5).name('Size Variation %').onChange(() => {
        // Update existing particles with new variation
        for (let particle of particles) {
            let sizeVar = params.particleSizeVariation / 100;
            particle.sizeMultiplier = random(1 - sizeVar, 1 + sizeVar);
        }
    });
    appearanceFolder.add(params, 'useColorPalette').name('Use Color Palette').onChange(() => {
        if (params.useColorPalette) {
            parseColorPalette();
        }
    });
    appearanceFolder.add(params, 'colorPalette').name('Palette (hex, comma)').onChange(() => {
        parseColorPalette();
    });
    appearanceFolder.open();
    
    let flowFolder = gui.addFolder('Flow Field - Generate');
    flowFolder.add(params, 'fieldResolution', 5, 50).step(5).name('Grid Resolution').onChange(() => {
        updateFieldGrid();
        initFlowField();
        console.log(`Flow field grid updated: ${cols}x${rows} cells`);
    });
    flowFolder.add(params, 'noiseScale', 0.001, 0.05).step(0.001);
    flowFolder.add(params, 'noiseStrength', 0.1, 3).step(0.1);
    flowFolder.add(params, 'timeSpeed', 0, 0.01).step(0.001);
    flowFolder.add(params, 'showFlowField').name('Show Field');
    
    let brushFolder = gui.addFolder('Brush Mode');
    brushFolder.add(params, 'brushSize', 10, 150).step(5);
    brushFolder.add(params, 'brushStrength', 0.1, 3).step(0.1);
    brushFolder.addColor(params, 'flowFieldColor').name('Arrow Color');
    brushFolder.add(params, 'resetFlowField').name('Reset Flow Field');
    
    let spawnFolder = gui.addFolder('Spawn Mode');
    spawnFolder.add(params, 'spawnAmount', 1, 100).step(1).name('Particles per Click');
    spawnFolder.add(params, 'spawnRadius', 10, 200).step(5).name('Spawn Radius');
    spawnFolder.add(params, 'clearParticles').name('Clear All Particles');
    
    let forcesFolder = gui.addFolder('Forces - Generate');
    forcesFolder.add(params, 'windForce', 0, 2).step(0.1);
    forcesFolder.add(params, 'windAngle', 0, 360).step(1);
    forcesFolder.add(params, 'turbulence', 0, 2).step(0.1);
    forcesFolder.add(params, 'attractorStrength', 0, 2).step(0.1);
    forcesFolder.add(params, 'attractorRadius', 50, 500).step(10);
    
    let visualFolder = gui.addFolder('Visual');
    visualFolder.addColor(params, 'backgroundColor');
    visualFolder.add(params, 'backgroundAlpha', 0, 255).step(1).name('Background Opacity');
    visualFolder.addColor(params, 'particleColor');
    visualFolder.open();
    
    let exportFolder = gui.addFolder('SVG Export');
    exportFolder.add(params, 'simplifyPaths').name('Simplify Paths');
    exportFolder.add(params, 'pathSampling', 1, 10).step(1).name('Sampling (1=all points)');
    exportFolder.add(params, 'trailFade').name('Enable Fade Effect');
    exportFolder.add(params, 'fadeIntensity', 0, 1).step(0.1).name('Fade Start Opacity');
    exportFolder.add(params, 'exportTrailLength', 20, 500).step(10).name('Trail Length (points)');
    
    gui.add(params, 'reset').name('Reset Particles');
    gui.add(params, 'clear').name('Clear Canvas');
    gui.add(params, 'exportSVG').name('Export SVG + PNG');
}

function simplifyPath(points, samplingRate) {
    // Simple uniform sampling - keeps curves intact
    // samplingRate: how many points to skip (1 = every point, 2 = every other point, etc.)
    if (points.length <= 2) return points;
    
    let simplified = [points[0]]; // Always keep first point
    
    for (let i = samplingRate; i < points.length - 1; i += samplingRate) {
        simplified.push(points[i]);
    }
    
    // Always keep last point
    if (points[points.length - 1] !== simplified[simplified.length - 1]) {
        simplified.push(points[points.length - 1]);
    }
    
    return simplified;
}

function perpendicularDistance(point, lineStart, lineEnd) {
    // This function is no longer needed but kept for compatibility
    let dx = lineEnd.x - lineStart.x;
    let dy = lineEnd.y - lineStart.y;
    
    if (dx === 0 && dy === 0) {
        return dist(point.x, point.y, lineStart.x, lineStart.y);
    }
    
    let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy);
    t = Math.max(0, Math.min(1, t));
    
    let projX = lineStart.x + t * dx;
    let projY = lineStart.y + t * dy;
    
    return dist(point.x, point.y, projX, projY);
}

let isExporting = false; // Flag to hide UI during export

function exportFiles() {
    // Export both SVG and PNG with timestamp
    let timestamp = Date.now();
    
    // Pause animation and set export flag
    isExporting = true;
    noLoop();
    
    // Hide mouse cursor
    noCursor();
    
    // Force a clean redraw without UI
    redraw();
    
    // Wait longer for complex sketches to fully redraw (500ms)
    setTimeout(() => {
        // Capture PNG first
        exportToPNG(timestamp);
        
        // Wait another 500ms before generating SVG (heavy operation)
        setTimeout(() => {
            exportToSVG(timestamp);
            
            // Wait a bit more before restoring UI to ensure SVG is done
            setTimeout(() => {
                // Restore UI, animation, and cursor
                isExporting = false;
                cursor();
                loop();
                
                console.log('Exported SVG and PNG!');
            }, 200);
        }, 500);
    }, 500);
}

function exportToPNG(timestamp) {
    // Save current canvas as PNG (UI already hidden via isExporting flag)
    saveCanvas(`flow-field-${timestamp}`, 'png');
}

function exportToSVG(timestamp) {
    let svg = '<?xml version="1.0" encoding="UTF-8"?>\n';
    svg += `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n`;
    
    // Add background rect with alpha support
    if (params.backgroundAlpha > 0) {
        svg += `<rect width="${width}" height="${height}" `;
        svg += `fill="${params.backgroundColor}" `;
        svg += `opacity="${params.backgroundAlpha / 255}"/>\n`;
    }
    // If alpha is 0, no background rect = transparent
    
    // Define gradients for trails if fade is enabled
    let gradientId = 0;
    if (params.trailFade && params.particleShape === 'line' && params.trailLength) {
        svg += '<defs>\n';
        
        for (let i = 0; i < paths.length; i++) {
            let color = particles[i] ? (particles[i].color || params.particleColor) : params.particleColor;
            
            for (let segmentIdx = 0; segmentIdx < paths[i].length; segmentIdx++) {
                let segment = paths[i][segmentIdx];
                if (segment.length > 1) {
                    let startPoint = segment[0];
                    let endPoint = segment[segment.length - 1];
                    
                    // Limit segment to most recent points for export (matches visual appearance)
                    let exportSegment = segment;
                    if (segment.length > params.exportTrailLength) {
                        exportSegment = segment.slice(-params.exportTrailLength);
                        startPoint = exportSegment[0];
                    }
                    
                    // Create linear gradient from end (opaque) to start (transparent)
                    svg += `<linearGradient id="grad${gradientId}" `;
                    svg += `x1="${endPoint.x}" y1="${endPoint.y}" `;
                    svg += `x2="${startPoint.x}" y2="${startPoint.y}" `;
                    svg += `gradientUnits="userSpaceOnUse">\n`;
                    svg += `<stop offset="0%" stop-color="${color}" stop-opacity="${params.particleAlpha / 255}"/>\n`;
                    svg += `<stop offset="100%" stop-color="${color}" stop-opacity="${params.fadeIntensity * (params.particleAlpha / 255)}"/>\n`;
                    svg += `</linearGradient>\n`;
                    
                    gradientId++;
                }
            }
        }
        
        svg += '</defs>\n';
    }
    
    // Reset gradient counter for use in paths
    gradientId = 0;
    
    // Export based on particle shape
    if (params.particleShape === 'line') {
        // For lines, we NEED trails to have something to export
        if (params.trailLength && paths.length > 0) {
            // Export particle paths - each particle can have multiple segments
            for (let i = 0; i < paths.length; i++) {
                let color = particles[i] ? (particles[i].color || params.particleColor) : params.particleColor;
                
                // Loop through all segments for this particle
                for (let segmentIdx = 0; segmentIdx < paths[i].length; segmentIdx++) {
                    let segment = paths[i][segmentIdx];
                    
                    if (segment.length > 1) {
                        // Limit segment to most recent points for export (matches visual appearance)
                        let exportSegment = segment;
                        if (segment.length > params.exportTrailLength) {
                            exportSegment = segment.slice(-params.exportTrailLength);
                        }
                        
                        // Simplify path if enabled
                        let pathPoints = exportSegment;
                        if (params.simplifyPaths && pathPoints.length > 2) {
                            pathPoints = simplifyPath(pathPoints, params.pathSampling);
                        }
                        
                        if (params.trailFade) {
                            // With fade: use polyline with gradient stroke
                            svg += `<polyline points="`;
                            for (let j = 0; j < pathPoints.length; j++) {
                                svg += `${pathPoints[j].x},${pathPoints[j].y} `;
                            }
                            svg += `" fill="none" stroke="url(#grad${gradientId})" `;
                            svg += `stroke-width="${params.particleWidth}" `;
                            svg += `stroke-linecap="round" stroke-linejoin="round"/>\n`;
                            
                            gradientId++;
                        } else {
                            // Without fade: export as single continuous polyline with solid color
                            svg += `<polyline points="`;
                            for (let j = 0; j < pathPoints.length; j++) {
                                svg += `${pathPoints[j].x},${pathPoints[j].y} `;
                            }
                            svg += `" fill="none" stroke="${color}" `;
                            svg += `stroke-width="${params.particleWidth}" `;
                            svg += `stroke-linecap="round" stroke-linejoin="round" `;
                            svg += `opacity="${params.particleAlpha / 255}"/>\n`;
                        }
                    }
                }
            }
        } else {
            // If no trails, export current particle positions as small lines
            for (let i = 0; i < particles.length; i++) {
                let p = particles[i];
                let color = p.color || params.particleColor;
                let w = params.particleWidth * p.sizeMultiplier;
                
                // Create a small line in the direction of velocity
                let lineLength = 5;
                let angle = p.vel.heading();
                let x2 = p.pos.x + cos(angle) * lineLength;
                let y2 = p.pos.y + sin(angle) * lineLength;
                
                svg += `<line x1="${p.pos.x}" y1="${p.pos.y}" x2="${x2}" y2="${y2}" `;
                svg += `stroke="${color}" stroke-width="${w}" `;
                svg += `stroke-linecap="round" opacity="${params.particleAlpha / 255}"/>\n`;
            }
        }
    } else if (params.particleShape === 'dot') {
        // Export dots as circles
        for (let i = 0; i < particles.length; i++) {
            let p = particles[i].pos;
            let color = particles[i].color || params.particleColor;
            let w = params.particleWidth * particles[i].sizeMultiplier;
            let h = params.particleHeight * particles[i].sizeMultiplier;
            let rx = w / 2;
            let ry = h / 2;
            
            if (rx === ry) {
                svg += `<circle cx="${p.x}" cy="${p.y}" r="${rx}" fill="${color}" opacity="${params.particleAlpha / 255}"/>\n`;
            } else {
                svg += `<ellipse cx="${p.x}" cy="${p.y}" rx="${rx}" ry="${ry}" fill="${color}" opacity="${params.particleAlpha / 255}"/>\n`;
            }
        }
        
        // Also export trails if trail mode is on
        if (params.trailLength && paths.length > 0) {
            for (let i = 0; i < paths.length; i++) {
                let color = particles[i] ? (particles[i].color || params.particleColor) : params.particleColor;
                
                // Loop through all segments for this particle
                for (let segmentIdx = 0; segmentIdx < paths[i].length; segmentIdx++) {
                    let segment = paths[i][segmentIdx];
                    
                    for (let j = 0; j < segment.length; j++) {
                        let p = segment[j];
                        let w = params.particleWidth * particles[i].sizeMultiplier;
                        let h = params.particleHeight * particles[i].sizeMultiplier;
                        let rx = w / 2;
                        let ry = h / 2;
                        let alpha = (params.particleAlpha / 255) * 0.3;
                        
                        if (rx === ry) {
                            svg += `<circle cx="${p.x}" cy="${p.y}" r="${rx}" fill="${color}" opacity="${alpha}"/>\n`;
                        } else {
                            svg += `<ellipse cx="${p.x}" cy="${p.y}" rx="${rx}" ry="${ry}" fill="${color}" opacity="${alpha}"/>\n`;
                        }
                    }
                }
            }
        }
    } else if (params.particleShape === 'rect') {
        // Export rectangles
        for (let i = 0; i < particles.length; i++) {
            let p = particles[i].pos;
            let color = particles[i].color || params.particleColor;
            let angle = particles[i].vel.heading() * (180 / PI);
            let w = params.particleWidth * particles[i].sizeMultiplier;
            let h = params.particleHeight * particles[i].sizeMultiplier;
            
            svg += `<rect x="${p.x - w/2}" y="${p.y - h/2}" `;
            svg += `width="${w}" height="${h}" `;
            svg += `fill="${color}" opacity="${params.particleAlpha / 255}" `;
            svg += `transform="rotate(${angle} ${p.x} ${p.y})"/>\n`;
        }
        
        // Also export trails if trail mode is on
        if (params.trailLength && paths.length > 0) {
            for (let i = 0; i < paths.length; i++) {
                let color = particles[i] ? (particles[i].color || params.particleColor) : params.particleColor;
                
                // Loop through all segments for this particle
                for (let segmentIdx = 0; segmentIdx < paths[i].length; segmentIdx++) {
                    let segment = paths[i][segmentIdx];
                    
                    for (let j = 1; j < segment.length; j++) {
                        let p = segment[j];
                        let prevP = segment[j-1];
                        let w = params.particleWidth * particles[i].sizeMultiplier;
                        let h = params.particleHeight * particles[i].sizeMultiplier;
                        let angle = atan2(p.y - prevP.y, p.x - prevP.x) * (180 / PI);
                        let alpha = (params.particleAlpha / 255) * 0.3;
                        
                        svg += `<rect x="${p.x - w/2}" y="${p.y - h/2}" `;
                        svg += `width="${w}" height="${h}" `;
                        svg += `fill="${color}" opacity="${alpha}" `;
                        svg += `transform="rotate(${angle} ${p.x} ${p.y})"/>\n`;
                    }
                }
            }
        }
    } else if (params.particleShape === 'triangle') {
        // Export triangles
        for (let i = 0; i < particles.length; i++) {
            let p = particles[i].pos;
            let color = particles[i].color || params.particleColor;
            let angle = particles[i].vel.heading() * (180 / PI);
            let w = params.particleWidth * particles[i].sizeMultiplier;
            let h = params.particleHeight * particles[i].sizeMultiplier;
            
            // Calculate triangle points
            let p1x = p.x + w/2;
            let p1y = p.y;
            let p2x = p.x - w/2;
            let p2y = p.y - h/2;
            let p3x = p.x - w/2;
            let p3y = p.y + h/2;
            
            svg += `<polygon points="${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y}" `;
            svg += `fill="${color}" opacity="${params.particleAlpha / 255}" `;
            svg += `transform="rotate(${angle} ${p.x} ${p.y})"/>\n`;
        }
    }
    
    svg += '</svg>';
    
    // Download SVG
    let blob = new Blob([svg], { type: 'image/svg+xml' });
    let url = URL.createObjectURL(blob);
    let link = document.createElement('a');
    link.href = url;
    link.download = `flow-field-${timestamp}.svg`;
    link.click();
    URL.revokeObjectURL(url);
}

// Keyboard shortcuts
function keyPressed() {
    if (key === 's' || key === 'S') {
        exportFiles();
    }
    if (key === 'r' || key === 'R') {
        params.reset();
    }
    if (key === 'c' || key === 'C') {
        params.clear();
    }
    if (key === 'b' || key === 'B') {
        // Cycle through modes: Generate -> Brush -> Spawn -> Generate
        if (params.mode === 'Generate') {
            params.mode = 'Brush';
            params.simulateParticles = true;
            params.showFlowField = true;
            console.log('BRUSH MODE: Drag to paint flow field.');
        } else if (params.mode === 'Brush') {
            params.mode = 'Spawn';
            console.log('SPAWN MODE: Click to spawn particles.');
        } else {
            params.mode = 'Generate';
            params.showFlowField = false;
            console.log('GENERATE MODE: Flow field auto-generated.');
        }
    }
    if (key === 'p' || key === 'P') {
        params.simulateParticles = !params.simulateParticles;
    }
    if (key === ' ') {
        params.resetFlowField();
    }
    if (key === 'h' || key === 'H') {
        showInstructions = !showInstructions;
    }
}