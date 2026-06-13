/* ==========================================================================
   Joe Nithin S - 3D Portfolio Javascript Engine
   Includes: Three.js Rendering, Synth Audio Engine, Scroll & Form Operations
   ========================================================================= */

// ==========================================================================
// 1. Web Audio Synth Engine (Futuristic UI Sound Effects)
// ==========================================================================
class SynthAudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = true;
    this.soundToggleBtn = document.getElementById('sound-btn');
    this.soundStatusText = document.getElementById('sound-status');
    
    this.initListeners();
  }

  initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  initListeners() {
    if (this.soundToggleBtn) {
      this.soundToggleBtn.addEventListener('click', () => {
        this.initContext();
        this.muted = !this.muted;
        
        if (this.muted) {
          this.soundToggleBtn.classList.add('muted');
          this.soundStatusText.textContent = "Sound Off";
          this.playClick();
        } else {
          this.soundToggleBtn.classList.remove('muted');
          this.soundStatusText.textContent = "Sound On";
          // Resume context if suspended (browser autoplay security)
          if (this.ctx.state === 'suspended') {
            this.ctx.resume();
          }
          this.playSuccess();
        }
      });
    }

    // Attach hover sound to navigation links and interactive cards
    const hovers = document.querySelectorAll('nav a, .btn, .glass-panel, .contact-item');
    hovers.forEach(el => {
      el.addEventListener('mouseenter', () => this.playHover());
      el.addEventListener('click', () => this.playClick());
    });

    // Form submit sound & FormSubmit secure email transmission
    const form = document.getElementById('cyber-contact-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const submitBtn = document.getElementById('form-submit-btn');
        const originalText = submitBtn.textContent;

        submitBtn.textContent = "SENDING...";
        submitBtn.disabled = true;

        const formData = new FormData(form);
        const object = Object.fromEntries(formData);
        const json = JSON.stringify(object);

        fetch('https://formsubmit.co/ajax/joenithin007@gmail.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: json
        })
        .then(async (response) => {
          let res = await response.json();
          if (response.status === 200 || res.success === "true" || res.success === true) {
            this.playSuccess();
            submitBtn.textContent = "TRANSMISSION SECURED";
            submitBtn.style.background = "linear-gradient(90deg, #00f2fe, #7f00ff)";
            submitBtn.style.color = "#fff";
            form.reset();
          } else {
            console.error("FormSubmit response error:", res);
            submitBtn.textContent = "TRANSMISSION FAILED";
            submitBtn.style.background = "#ff007f";
            submitBtn.style.color = "#fff";
            this.playClick();
          }
        })
        .catch(err => {
          console.error("FormSubmit network error:", err);
          submitBtn.textContent = "NETWORK ERROR";
          submitBtn.style.background = "#ff007f";
          submitBtn.style.color = "#fff";
          this.playClick();
        })
        .then(() => {
          setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.style.background = "";
            submitBtn.style.color = "";
            submitBtn.disabled = false;
          }, 3000);
        });
      });
    }
  }

  createOscillator(type, startFreq, endFreq, duration, volume) {
    if (this.muted || !this.ctx) return;
    
    try {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
      
      gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio synthesis error: ", e);
    }
  }

  playHover() {
    // Cyber beep
    this.createOscillator('sine', 800, 1600, 0.08, 0.03);
  }

  playClick() {
    // Cyber lock/click
    this.createOscillator('triangle', 300, 80, 0.15, 0.08);
  }

  playSuccess() {
    // Cyber chord (C5 then E5 then G5)
    if (this.muted || !this.ctx) return;
    
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    notes.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + (index * 0.08));
      
      gain.gain.setValueAtTime(0.06, now + (index * 0.08));
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (index * 0.08) + 0.35);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now + (index * 0.08));
      osc.stop(now + (index * 0.08) + 0.4);
    });
  }
}

// Instantiate Sound Engine
const soundEngine = new SynthAudioEngine();

// ==========================================================================
// 2. Main 3D Background Scene (Three.js Particle Network)
// ==========================================================================
class BackgroundScene {
  constructor() {
    this.container = document.getElementById('canvas-container');
    if (!this.container) return;
    
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.particles = null;
    this.particleCount = 750;
    this.particlePositions = [];
    this.particleVelocities = [];
    this.linesMesh = null;
    
    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;

    this.init();
    this.animate();
  }

  init() {
    // Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    this.camera.position.z = 400;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // Build Particles
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    
    const colorCyan = new THREE.Color('#00f2fe');
    const colorPurple = new THREE.Color('#7f00ff');
    
    for (let i = 0; i < this.particleCount; i++) {
      // Position inside sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const dist = 100 + Math.random() * 300;
      
      const px = dist * Math.sin(phi) * Math.cos(theta);
      const py = dist * Math.sin(phi) * Math.sin(theta);
      const pz = dist * Math.cos(phi);
      
      positions[i * 3] = px;
      positions[i * 3 + 1] = py;
      positions[i * 3 + 2] = pz;
      
      // Velocities
      this.particleVelocities.push({
        x: (Math.random() - 0.5) * 0.3,
        y: (Math.random() - 0.5) * 0.3,
        z: (Math.random() - 0.5) * 0.3
      });

      // Colors mix
      const mixRatio = Math.random();
      const col = new THREE.Color().lerpColors(colorCyan, colorPurple, mixRatio);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Custom Glow Particle Shader / Texture
    const particleMaterial = new THREE.PointsMaterial({
      size: 3,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    
    this.particles = new THREE.Points(geometry, particleMaterial);
    this.scene.add(this.particles);

    // Handle Resize & Mouse Move
    window.addEventListener('resize', () => this.onWindowResize());
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
  }

  onMouseMove(e) {
    this.targetMouseX = (e.clientX - window.innerWidth / 2) * 0.15;
    this.targetMouseY = (e.clientY - window.innerHeight / 2) * 0.15;
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Mouse drift interpolation
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;
    
    this.camera.position.x += (this.mouseX - this.camera.position.x) * 0.05;
    this.camera.position.y += (-this.mouseY - this.camera.position.y) * 0.05;
    this.camera.lookAt(this.scene.position);

    // Animate Particles
    const positions = this.particles.geometry.attributes.position.array;
    
    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;
      
      positions[idx] += this.particleVelocities[i].x;
      positions[idx + 1] += this.particleVelocities[i].y;
      positions[idx + 2] += this.particleVelocities[i].z;
      
      // Keep within sphere shell bounds
      const dist = Math.sqrt(positions[idx]**2 + positions[idx+1]**2 + positions[idx+2]**2);
      if (dist > 450) {
        positions[idx] *= -0.9;
        positions[idx+1] *= -0.9;
        positions[idx+2] *= -0.9;
      }
    }
    
    this.particles.geometry.attributes.position.needsUpdate = true;
    
    // Rotate entire node swarm
    this.particles.rotation.y += 0.0006;
    this.particles.rotation.x += 0.0002;

    this.renderer.render(this.scene, this.camera);
  }
}

const mainBg = new BackgroundScene();

// ==========================================================================
// 3. Project 1: Face Scan Grid Visualizer
// ==========================================================================
function initFaceRecVisualizer() {
  const canvas = document.getElementById('canvas-facerec');
  const panel = document.getElementById('canvas-panel-facerec');
  if (!canvas || !panel) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, panel.clientWidth / panel.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 10);

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setSize(panel.clientWidth, panel.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Orbit Controls locally
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enableZoom = false;

  // Face Scan Group
  const faceGroup = new THREE.Group();
  scene.add(faceGroup);

  // Procedural face shape grid (represented as low-poly wireframe head mesh)
  const faceGeometry = new THREE.IcosahedronGeometry(3, 2);
  const faceMaterial = new THREE.MeshBasicMaterial({
    color: 0x00f2fe,
    wireframe: true,
    transparent: true,
    opacity: 0.4
  });
  const faceMesh = new THREE.Mesh(faceGeometry, faceMaterial);
  faceGroup.add(faceMesh);

  // Glowing analysis nodes
  const dotsGeom = new THREE.BufferGeometry();
  const facePos = faceGeometry.attributes.position.array;
  dotsGeom.setAttribute('position', new THREE.BufferAttribute(facePos, 3));
  
  const dotsMaterial = new THREE.PointsMaterial({
    color: 0xff007f,
    size: 0.15,
    transparent: true,
    opacity: 0.95
  });
  const dots = new THREE.Points(dotsGeom, dotsMaterial);
  faceGroup.add(dots);

  // Dynamic Scan Plane
  const scanPlaneGeom = new THREE.BoxGeometry(7, 0.05, 7);
  const scanPlaneMat = new THREE.MeshBasicMaterial({
    color: 0x00f2fe,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending
  });
  const scanPlane = new THREE.Mesh(scanPlaneGeom, scanPlaneMat);
  scene.add(scanPlane);

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(ambientLight);

  // Resize listener
  window.addEventListener('resize', () => {
    camera.aspect = panel.clientWidth / panel.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(panel.clientWidth, panel.clientHeight);
  });

  // Animation Loop
  let time = 0;
  function animate() {
    requestAnimationFrame(animate);
    time += 0.02;

    // Face rotation
    faceGroup.rotation.y += 0.005;
    faceGroup.rotation.x = Math.sin(time * 0.2) * 0.15;

    // Scan plane sweep
    scanPlane.position.y = Math.sin(time) * 3.5;
    
    // Make scan plane pulse color
    const brightness = Math.abs(Math.sin(time * 2)) * 0.3 + 0.3;
    scanPlaneMat.opacity = brightness;

    controls.update();
    renderer.render(scene, camera);
  }
  animate();
}

// ==========================================================================
// 4. Project 2: Full-Stack Database Layer Network Visualizer
// ==========================================================================
function initFullStackVisualizer() {
  const canvas = document.getElementById('canvas-fullstack');
  const panel = document.getElementById('canvas-panel-fullstack');
  if (!canvas || !panel) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, panel.clientWidth / panel.clientHeight, 0.1, 100);
  camera.position.set(0, 4, 11);

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setSize(panel.clientWidth, panel.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enableZoom = false;

  const stackGroup = new THREE.Group();
  scene.add(stackGroup);

  // Elements: Database Cylinder, Server Sphere, Client Screen Layer
  // 1. Client Layer (Top)
  const clientGeom = new THREE.BoxGeometry(4, 0.1, 2.5);
  const wireframeMatCyan = new THREE.MeshBasicMaterial({ color: 0x00f2fe, wireframe: true });
  const clientMesh = new THREE.Mesh(clientGeom, wireframeMatCyan);
  clientMesh.position.y = 2.5;
  stackGroup.add(clientMesh);

  // 2. Server layer (Middle)
  const serverGeom = new THREE.IcosahedronGeometry(0.8, 1);
  const wireframeMatPurple = new THREE.MeshBasicMaterial({ color: 0x7f00ff, wireframe: true });
  const serverMesh = new THREE.Mesh(serverGeom, wireframeMatPurple);
  serverMesh.position.y = 0;
  stackGroup.add(serverMesh);

  // 3. Database Layer (Bottom)
  const dbGeom = new THREE.CylinderGeometry(1.2, 1.2, 0.6, 12);
  const wireframeMatPink = new THREE.MeshBasicMaterial({ color: 0xff007f, wireframe: true });
  const dbMesh1 = new THREE.Mesh(dbGeom, wireframeMatPink);
  dbMesh1.position.y = -2;
  const dbMesh2 = dbMesh1.clone();
  dbMesh2.position.y = -2.7;
  stackGroup.add(dbMesh1);
  stackGroup.add(dbMesh2);

  // Packet transfers (Moving lights/spheres along vertical links)
  const packetCount = 6;
  const packets = [];
  const packetGeom = new THREE.SphereGeometry(0.08, 8, 8);
  
  for (let i = 0; i < packetCount; i++) {
    const isUpstream = Math.random() > 0.5;
    const packetMat = new THREE.MeshBasicMaterial({ 
      color: isUpstream ? 0x00f2fe : 0xff007f,
      transparent: true,
      opacity: 0.9
    });
    const packetMesh = new THREE.Mesh(packetGeom, packetMat);
    
    // Choose connection path: client-to-server or server-to-db
    const isUpperLink = Math.random() > 0.5;
    
    packets.push({
      mesh: packetMesh,
      upper: isUpperLink,
      progress: Math.random(),
      speed: 0.01 + Math.random() * 0.015,
      direction: isUpstream ? 1 : -1
    });
    
    scene.add(packetMesh);
  }

  // Vertical line conduits
  const createLine = (p1, p2, col) => {
    const geom = new THREE.BufferGeometry().setFromPoints([p1, p2]);
    const mat = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.2 });
    return new THREE.Line(geom, mat);
  };

  const line1 = createLine(new THREE.Vector3(0, 2.5, 0), new THREE.Vector3(0, 0, 0), 0x00f2fe);
  const line2 = createLine(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -2, 0), 0xff007f);
  stackGroup.add(line1);
  stackGroup.add(line2);

  // Resize listener
  window.addEventListener('resize', () => {
    camera.aspect = panel.clientWidth / panel.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(panel.clientWidth, panel.clientHeight);
  });

  // Animation Loop
  function animate() {
    requestAnimationFrame(animate);

    // Rotate elements
    stackGroup.rotation.y += 0.004;
    clientMesh.rotation.y += 0.002;
    serverMesh.rotation.x += 0.005;
    dbMesh1.rotation.y -= 0.003;
    dbMesh2.rotation.y -= 0.003;

    // Update data packet paths
    const matrix = new THREE.Matrix4();
    matrix.makeRotationY(stackGroup.rotation.y);

    packets.forEach(p => {
      p.progress += p.speed * p.direction;
      if (p.progress > 1) { p.progress = 0; }
      if (p.progress < 0) { p.progress = 1; }

      // Compute local vertical position
      let y = 0;
      if (p.upper) {
        // Link: client (2.5) to server (0)
        y = THREE.MathUtils.lerp(0, 2.5, p.progress);
      } else {
        // Link: server (0) to database (-2)
        y = THREE.MathUtils.lerp(-2, 0, p.progress);
      }

      // Compute final global position rotating with stackGroup
      const pos = new THREE.Vector3(0, y, 0);
      pos.applyMatrix4(matrix);
      p.mesh.position.copy(pos);
    });

    controls.update();
    renderer.render(scene, camera);
  }
  animate();
}

// ==========================================================================
// 5. Project 3: Drone System Wireframe Model
// ==========================================================================
function initDroneVisualizer() {
  const canvas = document.getElementById('canvas-drone');
  const panel = document.getElementById('canvas-panel-drone');
  if (!canvas || !panel) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, panel.clientWidth / panel.clientHeight, 0.1, 100);
  camera.position.set(5, 5, 8);

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setSize(panel.clientWidth, panel.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enableZoom = false;

  // Drone Group
  const drone = new THREE.Group();
  scene.add(drone);

  // Materials
  const cyanMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe, wireframe: true });
  const pinkMat = new THREE.MeshBasicMaterial({ color: 0xff007f, wireframe: true });
  const purpleMat = new THREE.MeshBasicMaterial({ color: 0x7f00ff, wireframe: true });

  // Drone Core Frame (Center Sphere)
  const coreGeom = new THREE.SphereGeometry(0.6, 8, 8);
  const coreMesh = new THREE.Mesh(coreGeom, purpleMat);
  drone.add(coreMesh);

  // 4 Arms (X-Configuration)
  const armGeom = new THREE.CylinderGeometry(0.08, 0.08, 2.5, 6);
  armGeom.rotateZ(Math.PI / 2); // Make horizontal cylinder

  const arms = [];
  for (let i = 0; i < 2; i++) {
    const arm = new THREE.Mesh(armGeom, cyanMat);
    arm.rotation.y = (Math.PI / 4) + (i * Math.PI / 2);
    drone.add(arm);
    arms.push(arm);
  }

  // 4 Rotor Hubs & Propellers
  const motorGeom = new THREE.CylinderGeometry(0.18, 0.18, 0.3, 6);
  const propellerGeom = new THREE.BoxGeometry(1.6, 0.02, 0.08);
  
  const propellers = [];
  const armLength = 1.25; // radius to end of cylinder arm
  
  const angles = [
    Math.PI / 4,
    3 * Math.PI / 4,
    5 * Math.PI / 4,
    7 * Math.PI / 4
  ];

  angles.forEach(angle => {
    const rx = Math.cos(angle) * armLength;
    const rz = Math.sin(angle) * armLength;

    // Motor Cylinder
    const motor = new THREE.Mesh(motorGeom, pinkMat);
    motor.position.set(rx, 0.15, rz);
    drone.add(motor);

    // Propeller Blade
    const propeller = new THREE.Mesh(propellerGeom, cyanMat);
    propeller.position.set(rx, 0.3, rz);
    drone.add(propeller);
    propellers.push(propeller);
  });

  // Lights
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 5, 5);
  scene.add(light);

  // Resize listener
  window.addEventListener('resize', () => {
    camera.aspect = panel.clientWidth / panel.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(panel.clientWidth, panel.clientHeight);
  });

  // Animation Loop
  let time = 0;
  function animate() {
    requestAnimationFrame(animate);
    time += 0.03;

    // Gentle hovering elevation (oscillating Y position)
    drone.position.y = Math.sin(time) * 0.25;
    
    // Add micro-tilting response
    drone.rotation.x = Math.sin(time * 0.5) * 0.05;
    drone.rotation.z = Math.cos(time * 0.4) * 0.05;
    drone.rotation.y += 0.005; // Slow rotation of drone structure

    // Rapid spinning propellers
    propellers.forEach((p, idx) => {
      // Alternate spin directions for hover logic realism
      const direction = idx % 2 === 0 ? 1 : -1;
      p.rotation.y += 0.45 * direction;
    });

    controls.update();
    renderer.render(scene, camera);
  }
  animate();
}

// Initialize Project Canvases once DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  initFaceRecVisualizer();
  initFullStackVisualizer();
  initDroneVisualizer();
});

// ==========================================================================
// 6. Navigation Scroll & Skill Bar Animations
// ==========================================================================
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section');
const header = document.getElementById('header');

// Smooth navbar highlight & scrolled background shadow
window.addEventListener('scroll', () => {
  let currentSec = "";
  
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }

  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (window.scrollY >= (sectionTop - 250)) {
      currentSec = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href').includes(currentSec)) {
      link.classList.add('active');
    }
  });
});

// Scroll to sections on clicking navigation elements
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.getAttribute('href');
    const targetSection = document.querySelector(targetId);
    if (targetSection) {
      window.scrollTo({
        top: targetSection.offsetTop - 70,
        behavior: 'smooth'
      });
    }
  });
});

// Click Hero Mouse Indicator to scroll
const scrollMouseBtn = document.getElementById('scroll-mouse-btn');
if (scrollMouseBtn) {
  scrollMouseBtn.addEventListener('click', () => {
    const aboutSec = document.getElementById('about');
    if (aboutSec) {
      window.scrollTo({
        top: aboutSec.offsetTop - 70,
        behavior: 'smooth'
      });
    }
  });
}

// Intersection Observer for Skill Bar animation
const skillsSection = document.getElementById('skills');
const skillBars = document.querySelectorAll('.skill-bar');

if (skillsSection) {
  const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        skillBars.forEach(bar => {
          const widthVal = bar.getAttribute('data-width');
          bar.style.width = widthVal;
        });
        skillObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  skillObserver.observe(skillsSection);
}
