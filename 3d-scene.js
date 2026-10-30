/* ============================================================
   Fullpage 3D scene — Three.js
   Fixed fullscreen canvas behind the whole page. The camera
   flies forward through a particle corridor as you scroll, so
   the 3D depth keeps going all the way down the page.
   ============================================================ */
(function () {
    "use strict";

    const canvas = document.getElementById("heroCanvas");

    if (!canvas || !window.THREE) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isSmall = window.matchMedia("(max-width: 767.98px)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);

    const CAM_START = 26;
    const CAM_TRAVEL = 17; /* camera flies from z=26 to z=9 across the page */
    camera.position.set(0, 0, CAM_START);

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: !isSmall,
        powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSmall ? 1.5 : 2));

    const world = new THREE.Group();
    scene.add(world);

    /* ---------- Particle corridor (deep z-range) ---------- */
    const COUNT = isSmall ? 380 : 900;
    const SPREAD_X = 34;
    const SPREAD_Y = 20;

    const palette = [
        { color: new THREE.Color("#ff8a3d"), weight: 0.28 },
        { color: new THREE.Color("#ffac62"), weight: 0.2 },
        { color: new THREE.Color("#9ad8c8"), weight: 0.22 },
        { color: new THREE.Color("#8caee5"), weight: 0.22 },
        { color: new THREE.Color("#ffffff"), weight: 0.08 }
    ];

    const pickColor = () => {
        let roll = Math.random();
        for (let i = 0; i < palette.length; i += 1) {
            roll -= palette[i].weight;
            if (roll <= 0) return palette[i].color;
        }
        return palette[0].color;
    };

    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i += 1) {
        positions[i * 3] = (Math.random() - 0.5) * SPREAD_X * 2;
        positions[i * 3 + 1] = (Math.random() - 0.5) * SPREAD_Y * 2;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 76 - 8; /* z: -46 .. 30 corridor */

        const c = pickColor();
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
        size: isSmall ? 0.17 : 0.13,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    world.add(particles);

    /* ---------- Floating wireframes placed at different depths ---------- */
    const shapes = [];

    const addShape = (mesh, base, rotX, rotY, floatAmp, floatSpeed, phase) => {
        mesh.position.set(base[0], base[1], base[2]);
        mesh.userData = { baseY: base[1], rotX, rotY, floatAmp, floatSpeed, phase };
        shapes.push(mesh);
        world.add(mesh);
    };

    const wireMesh = (geo, color, opacity) => new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({
            color: new THREE.Color(color),
            wireframe: true,
            transparent: true,
            opacity: opacity
        })
    );

    /* Spread along -z so scrolling passes each one like a space corridor */
    addShape(wireMesh(new THREE.IcosahedronGeometry(4.4, 1), "#ff8a3d", 0.4), [15, -3, -6], 0.0026, 0.0035, 1.4, 0.55, 0);
    addShape(wireMesh(new THREE.TorusKnotGeometry(4.6, 1.35, 90, 14), "#9ad8c8", 0.3), [-17, 7.5, -14], 0.0016, 0.0026, 1.8, 0.42, 2.1);
    addShape(wireMesh(new THREE.OctahedronGeometry(3.4, 0), "#8caee5", 0.36), [19, 9.5, -22], 0.0038, 0.004, 1.2, 0.65, 4.0);
    addShape(wireMesh(new THREE.DodecahedronGeometry(3.0, 0), "#ffac62", 0.32), [-20, -8, -30], 0.0028, 0.0034, 1.0, 0.5, 1.2);
    addShape(wireMesh(new THREE.IcosahedronGeometry(3.6, 0), "#8caee5", 0.28), [16, -10, -38], 0.0032, 0.0028, 1.3, 0.58, 5.1);
    addShape(wireMesh(new THREE.TorusGeometry(3.4, 1.1, 12, 26), "#9ad8c8", 0.26), [-15, 10, -44], 0.0022, 0.0036, 1.5, 0.45, 3.3);

    /* ---------- Mouse parallax + scroll flight ---------- */
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

    window.addEventListener("mousemove", (event) => {
        mouse.tx = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.ty = (event.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    let scrollDrift = 0;
    let targetDrift = 0;
    let scrollProgress = 0;

    const readScroll = () => {
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        scrollProgress = Math.min(1, Math.max(0, window.scrollY / max));
        targetDrift = window.scrollY * 0.00016;
    };

    window.addEventListener("scroll", readScroll, { passive: true });
    readScroll();

    /* ---------- Render loop ---------- */
    let running = false;
    let enabled = true;

    const resize = () => {
        const width = canvas.clientWidth || window.innerWidth;
        const height = canvas.clientHeight || window.innerHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
    };

    window.addEventListener("resize", resize);
    resize();

    const clock = new THREE.Clock();

    const animate = () => {
        if (!running) return;
        window.requestAnimationFrame(animate);

        if (document.hidden) return;

        const t = clock.getElapsedTime();

        mouse.x += (mouse.tx - mouse.x) * 0.04;
        mouse.y += (mouse.ty - mouse.y) * 0.04;

        /* Fly through the field while scrolling, drift sideways with the mouse */
        camera.position.x = mouse.x * 3.2;
        camera.position.y = -mouse.y * 2.1;
        camera.position.z = CAM_START - scrollProgress * CAM_TRAVEL;
        camera.lookAt(0, 0, camera.position.z - 10);

        scrollDrift += (targetDrift - scrollDrift) * 0.05;
        particles.rotation.y = scrollDrift + t * 0.012;
        world.rotation.x = scrollProgress * 0.12;

        for (let i = 0; i < shapes.length; i += 1) {
            const s = shapes[i];
            const d = s.userData;
            s.rotation.x += d.rotX;
            s.rotation.y += d.rotY;
            s.position.y = d.baseY + Math.sin(t * d.floatSpeed + d.phase) * d.floatAmp;
        }

        renderer.render(scene, camera);
    };

    const start = () => {
        if (running) return;
        running = true;
        clock.start();
        animate();
    };

    const stop = () => {
        running = false;
    };

    window.__hero3D = {
        setEnabled(on) {
            enabled = !!on;
            canvas.classList.toggle("is-off", !enabled);
            if (enabled) {
                resize();
                start();
            } else {
                stop();
            }
        },
        isEnabled() {
            return enabled;
        }
    };

    if (prefersReduced) {
        window.__hero3D.setEnabled(false);
    } else {
        start();
    }
})();
