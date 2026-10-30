/* ============================================================
   Fullpage 3D scene — Three.js
   Fixed fullscreen canvas behind the whole page. A realistic
   Earth-like planet with a clearly visible orbiting satellite
   floats in the hero; the camera flies forward through a star
   corridor as you scroll, so the 3D depth keeps going all the
   way down the page.
   ============================================================ */
(function () {
    "use strict";

    const canvas = document.getElementById("heroCanvas");

    if (!canvas || !window.THREE) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const smallQuery = window.matchMedia("(max-width: 767.98px)");
    const isSmall = smallQuery.matches;

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

    /* ---------- Star corridor (deep z-range) ---------- */
    const COUNT = isSmall ? 380 : 900;
    const SPREAD_X = 34;
    const SPREAD_Y = 20;

    const palette = [
        { color: new THREE.Color("#ff8a3d"), weight: 0.14 },
        { color: new THREE.Color("#ffac62"), weight: 0.1 },
        { color: new THREE.Color("#9ad8c8"), weight: 0.2 },
        { color: new THREE.Color("#8caee5"), weight: 0.24 },
        { color: new THREE.Color("#ffffff"), weight: 0.32 }
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

    /* ---------- Lighting (sun + gentle fill) ---------- */
    const sun = new THREE.DirectionalLight(0xfff3d8, 1.25);
    sun.position.set(14, 9, 9);
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x44599a, 0.32);
    fill.position.set(-10, -6, 4);
    scene.add(fill);

    scene.add(new THREE.AmbientLight(0x1a2438, 0.9));

    /* ---------- Planet (Earth-like) ---------- */
    const PLANET_R = 4.2;

    const loadTexture = url => new Promise((resolve, reject) => {
        new THREE.TextureLoader().load(url, resolve, undefined, reject);
    });

    /* Offline fallback: procedurally drawn continents so the planet never looks plain */
    const makeFallbackTexture = () => {
        const mapCanvas = document.createElement("canvas");
        mapCanvas.width = 512;
        mapCanvas.height = 256;
        const ctx = mapCanvas.getContext("2d");

        const ocean = ctx.createLinearGradient(0, 0, 0, 256);
        ocean.addColorStop(0, "#123a6e");
        ocean.addColorStop(0.5, "#0b2d5e");
        ocean.addColorStop(1, "#0e2f57");
        ctx.fillStyle = ocean;
        ctx.fillRect(0, 0, 512, 256);

        const landColors = ["#2f7d4f", "#3b8f55", "#4b6f3d", "#7d905c"];
        for (let i = 0; i < 46; i += 1) {
            const cx = Math.random() * 512;
            const cy = 40 + Math.random() * 176;
            const landColor = landColors[Math.floor(Math.random() * landColors.length)];
            ctx.fillStyle = landColor;
            for (let j = 0; j < 9; j += 1) {
                const r = 4 + Math.random() * 16;
                ctx.beginPath();
                ctx.ellipse(cx + (Math.random() - 0.5) * 26, cy + (Math.random() - 0.5) * 14, r, r * 0.6, Math.random() * Math.PI, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.fillStyle = "rgba(240, 246, 252, 0.85)";
        ctx.fillRect(0, 0, 512, 12);
        ctx.fillRect(0, 244, 512, 12);

        return new THREE.CanvasTexture(mapCanvas);
    };

    const planetGroup = new THREE.Group();
    world.add(planetGroup);

    const planetGeo = new THREE.SphereGeometry(PLANET_R, isSmall ? 40 : 64, isSmall ? 26 : 44);

    const planetMat = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        specular: 0x223344,
        shininess: 16
    });
    planetMat.map = makeFallbackTexture();

    loadTexture("https://raw.githubusercontent.com/mrdoob/three.js/r128/examples/textures/planets/earth_atmos_2048.jpg")
        .then(texture => {
            texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
            planetMat.map = texture;
            planetMat.needsUpdate = true;
        })
        .catch(() => {
            /* network texture unavailable — keep procedural map */
        });

    const planet = new THREE.Mesh(planetGeo, planetMat);
    planet.rotation.z = 23.4 / 180 * Math.PI; /* real Earth axial tilt */
    planetGroup.add(planet);

    /* Cloud layer */
    const cloudMat = new THREE.MeshPhongMaterial({
        transparent: true,
        opacity: 0.55,
        depthWrite: false
    });
    const clouds = new THREE.Mesh(new THREE.SphereGeometry(PLANET_R * 1.015, isSmall ? 36 : 56, isSmall ? 22 : 36), cloudMat);
    clouds.visible = false;
    planetGroup.add(clouds);

    loadTexture("https://raw.githubusercontent.com/mrdoob/three.js/r128/examples/textures/planets/earth_clouds_1024.png")
        .then(texture => {
            cloudMat.map = texture;
            cloudMat.needsUpdate = true;
            clouds.visible = true;
        })
        .catch(() => {
            /* clouds optional */
        });

    /* Atmosphere fresnel halo */
    const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(PLANET_R * 1.09, isSmall ? 32 : 48, isSmall ? 20 : 32),
        new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color("#6db4ff") }
            },
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                varying vec3 vNormal;
                void main() {
                    float rim = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 3.0);
                    gl_FragColor = vec4(glowColor, 1.0) * rim;
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false
        })
    );
    planetGroup.add(atmosphere);

    /* ---------- Satellite (clearly visible, orbiting) ---------- */
    const ORBIT_R = PLANET_R * 1.85;

    const orbitGroup = new THREE.Group();
    orbitGroup.rotation.set(0.42, 0, -0.18); /* tilted LEO-style orbit plane */
    planetGroup.add(orbitGroup);

    const orbitPathMat = new THREE.LineBasicMaterial({
        color: 0x9ad8c8,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const orbitPath = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(
            Array.from({ length: 128 }, (_, i) => {
                const a = i / 128 * Math.PI * 2;
                return new THREE.Vector3(Math.cos(a) * ORBIT_R, 0, Math.sin(a) * ORBIT_R);
            })
        ),
        orbitPathMat
    );
    orbitGroup.add(orbitPath);

    const satellite = new THREE.Group();

    const bodyMat = new THREE.MeshPhongMaterial({ color: 0xd8d2c4, shininess: 60, specular: 0x888888 });
    const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.5, 0.92), bodyMat);
    satellite.add(bodyMesh);

    const foilMat = new THREE.MeshPhongMaterial({ color: 0xd4af37, shininess: 90, specular: 0xfff2c0 });
    const foil = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.52, 0.3), foilMat);
    foil.position.z = 0.32;
    satellite.add(foil);

    const panelMat = new THREE.MeshPhongMaterial({ color: 0x1d3f8f, shininess: 120, specular: 0x99bbff, emissive: 0x0a1a45 });
    for (const side of [-1, 1]) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.68), panelMat);
        panel.position.x = side * 1.25;
        panel.rotation.y = side * 0.08;
        satellite.add(panel);
        const strut = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.08), bodyMat);
        strut.position.x = side * 0.62;
        satellite.add(strut);
    }

    const dish = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.26, 16), bodyMat);
    dish.rotation.x = Math.PI / 2 - 0.7;
    dish.position.set(0, 0.18, -0.62);
    satellite.add(dish);

    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff8a3d, transparent: true });
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), beaconMat);
    beacon.position.y = 0.32;
    satellite.add(beacon);

    const satAnchor = new THREE.Group();
    satAnchor.position.set(ORBIT_R, 0, 0);
    satAnchor.rotation.y = Math.PI / 2;
    satellite.rotation.z = 0.55;
    satAnchor.add(satellite);
    orbitGroup.add(satAnchor);

    /* ---------- Viewport layout (phone vs desktop) ---------- */
    const applyViewportLayout = () => {
        if (smallQuery.matches) {
            /* Phone: smaller planet, tucked into the upper sky so it
               stays visible without fighting the stacked hero text */
            planetGroup.scale.setScalar(0.72);
            planetGroup.position.set(1.6, 6.9, -2);
            orbitPathMat.opacity = 0.2;
        } else {
            planetGroup.scale.setScalar(1);
            planetGroup.position.set(7.2, 5.4, -2);
            orbitPathMat.opacity = 0.28;
        }
    };

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
        camera.fov = smallQuery.matches ? 66 : 60;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
        applyViewportLayout();
    };

    window.addEventListener("resize", resize);
    resize();

    if (window.matchMedia) {
        try {
            smallQuery.addEventListener("change", () => {
                resize();
                applyViewportLayout();
            });
        } catch (error) {
            /* addEventListener on MediaQueryList not supported, listener on resize sudah cukup */
        }
    }

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

        /* Slow realistic spin, clouds drift slightly faster */
        planet.rotation.y += 0.055 * 0.016;
        clouds.rotation.y += 0.075 * 0.016;

        /* Satellite orbits and its beacon blinks */
        const orbitAngle = t * 0.22;
        satAnchor.position.set(Math.cos(orbitAngle) * ORBIT_R, 0, Math.sin(orbitAngle) * ORBIT_R);
        satellite.rotation.y = orbitAngle + Math.PI / 2;
        beaconMat.opacity = Math.sin(t * 4.2) > 0 ? 1 : 0.18;

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
