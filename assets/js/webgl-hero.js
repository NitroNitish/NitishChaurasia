/**
 * Minimal Smooth Wave WebGL Animation
 * Optimized for low-end devices and smooth 60 FPS performance.
 */

const vertexShader = `
uniform float uTime;
varying vec2 vUv;
varying float vElevation;

// Simplex 2D noise
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
    vUv = uv;
    
    // Calculate slow, smooth noise for elevation
    float elevation = snoise(vec2(position.x * 0.4 + uTime * 0.1, position.y * 0.4 + uTime * 0.15)) * 1.5;
    
    // Add a secondary wave for detail
    elevation += snoise(vec2(position.x * 0.8 - uTime * 0.2, position.y * 0.8 + uTime * 0.1)) * 0.5;

    vElevation = elevation;

    vec3 newPosition = position;
    newPosition.z += elevation;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`;

const fragmentShader = `
uniform float uTime;
varying vec2 vUv;
varying float vElevation;

void main() {
    // Distance from center to create a circular fade out
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(vUv, center);
    float alpha = smoothstep(0.5, 0.1, dist); // Fades to 0 at edges

    // Color gradient based on elevation
    vec3 colorDark = vec3(0.0, 0.02, 0.4);   // Deep Blue
    vec3 colorLight = vec3(0.0, 0.5, 1.0);  // Cyan/Electric Blue
    
    // Mix colors based on height of the wave
    float mixStrength = (vElevation + 2.0) * 0.25;
    vec3 finalColor = mix(colorDark, colorLight, mixStrength);

    // Apply glowing alpha
    gl_FragColor = vec4(finalColor, alpha * 0.7); // 0.7 opacity for minimal subtle feel
}
`;

class WebGLHero {
    constructor() {
        this.container = document.getElementById('webgl-canvas-container');
        if (!this.container) return;

        // Check reduced motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion || !this.isWebGLAvailable()) {
            this.showFallback();
            return;
        }

        this.init();
    }

    isWebGLAvailable() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    }

    showFallback() {
        document.getElementById('css-fallback-glow').style.opacity = '1';
    }

    init() {
        this.scene = new THREE.Scene();
        
        // Setup Camera
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.z = 10;
        this.camera.position.y = -2; // Look slightly from bottom up

        // Setup Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        this.createWave();

        this.clock = new THREE.Clock();
        
        // Performance monitoring
        this.fpsThreshold = 30;
        this.framesBelowThreshold = 0;
        this.frameCount = 0;
        this.lastTime = performance.now();

        this.bindEvents();
        this.animate();
        
        // Fade in
        setTimeout(() => {
            this.renderer.domElement.style.opacity = '1';
            this.renderer.domElement.style.transition = 'opacity 2s ease';
        }, 100);
    }

    createWave() {
        // Create a plane with high segment count for smooth wave bending
        // Reduced segment count on mobile for performance
        const segments = window.innerWidth < 768 ? 48 : 96;
        const geometry = new THREE.PlaneGeometry(25, 15, segments, segments);

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true,
            wireframe: false,
            side: THREE.DoubleSide
        });

        this.mesh = new THREE.Mesh(geometry, this.material);
        
        // Rotate the plane to lay flat like an ocean
        this.mesh.rotation.x = -Math.PI / 2.5;
        this.mesh.position.y = -1; // Push it down
        this.mesh.position.z = -2;
        
        this.scene.add(this.mesh);
    }

    bindEvents() {
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        const rafId = requestAnimationFrame(this.animate.bind(this));

        // Performance check
        this.frameCount++;
        const timeNow = performance.now();
        if (timeNow - this.lastTime >= 1000) {
            const fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = timeNow;

            if (fps < this.fpsThreshold) {
                this.framesBelowThreshold++;
                if (this.framesBelowThreshold > 3) {
                    // Graceful degradation
                    console.warn('Low framerate detected. Switching to fallback.');
                    cancelAnimationFrame(rafId);
                    this.renderer.domElement.style.opacity = '0';
                    setTimeout(() => {
                        this.showFallback();
                        this.container.removeChild(this.renderer.domElement);
                        this.scene.clear();
                    }, 1000);
                    return;
                }
            } else {
                this.framesBelowThreshold = 0;
            }
        }

        const elapsedTime = this.clock.getElapsedTime();
        this.material.uniforms.uTime.value = elapsedTime;

        // Slow, gentle rotation for extra dimension
        this.mesh.rotation.z = Math.sin(elapsedTime * 0.1) * 0.1;

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new WebGLHero());
} else {
    new WebGLHero();
}
