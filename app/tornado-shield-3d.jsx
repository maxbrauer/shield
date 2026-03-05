import { useEffect, useRef, useState } from "react";

export default function App() {
  const mountRef = useRef(null);
  const stateRef = useRef({ power: 80, running: true, shieldActive: true });
  const [power, setPower] = useState(80);
  const [running, setRunning] = useState(true);
  const [shieldActive, setShieldActive] = useState(true);
  const [stats, setStats] = useState({ deflected: 0, windspeed: 280, shieldPct: 80 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { stateRef.current = { power, running, shieldActive }; }, [power, running, shieldActive]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch(e){} };
  }, []);

  useEffect(() => {
    if (!loaded || !mountRef.current) return;
    const THREE = window.THREE;
    const container = mountRef.current;
    const W = container.clientWidth || window.innerWidth;
    const H = container.clientHeight || 500;

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.setClearColor(0x050210, 1);
    container.appendChild(renderer.domElement);

    // ── Scene & Camera ─────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050210, 0.010);
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 1000);
    let theta = 0.5, phi = 0.52, camR = 110, dragging = false, prevX = 0, prevY = 0;
    function updateCam() {
      camera.position.set(
        camR * Math.sin(phi) * Math.sin(theta),
        camR * Math.cos(phi) + 8,
        camR * Math.sin(phi) * Math.cos(theta)
      );
      camera.lookAt(0, 10, 0);
    }
    updateCam();

    // ── Lights ─────────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x110820, 5));
    const dirLight = new THREE.DirectionalLight(0x4433bb, 2);
    dirLight.position.set(-40, 80, -30); dirLight.castShadow = true; scene.add(dirLight);
    const shieldGlow = new THREE.PointLight(0x00e5ff, 0, 100); shieldGlow.position.set(0, 5, 0); scene.add(shieldGlow);
    const tGlow = new THREE.PointLight(0x7722ff, 3, 250); scene.add(tGlow);
    const flash = new THREE.PointLight(0x9966ff, 0, 600); flash.position.set(0, 120, 0); scene.add(flash);

    // ── Ground ─────────────────────────────────────────────────────────────────
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600),
      new THREE.MeshStandardMaterial({ color: 0x0e0c06, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    scene.add(new THREE.GridHelper(500, 60, 0x0d0d1a, 0x0d0d1a));

    // ── Storm clouds ───────────────────────────────────────────────────────────
    for (let i = 0; i < 22; i++) {
      const cm = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.7, 0.15, 0.06 + Math.random() * 0.05),
        transparent: true, opacity: 0.8, depthWrite: false
      });
      const cl = new THREE.Mesh(new THREE.SphereGeometry(20 + Math.random() * 25, 7, 7), cm);
      cl.position.set((Math.random() - .5) * 400, 90 + Math.random() * 60, (Math.random() - .5) * 400);
      scene.add(cl);
    }

    // ── House ──────────────────────────────────────────────────────────────────
    const houseGroup = new THREE.Group();
    // Walls
    const walls = new THREE.Mesh(
      new THREE.BoxGeometry(14, 8, 11),
      new THREE.MeshStandardMaterial({ color: 0x9b8060, roughness: 0.9 })
    );
    walls.position.y = 4; walls.castShadow = true; walls.receiveShadow = true; houseGroup.add(walls);
    // Roof
    const roofMesh = new THREE.Mesh(
      new THREE.ConeGeometry(11, 6, 4),
      new THREE.MeshStandardMaterial({ color: 0x6b3a28, roughness: 0.8 })
    );
    roofMesh.position.y = 11; roofMesh.rotation.y = Math.PI / 4; roofMesh.castShadow = true; houseGroup.add(roofMesh);
    // Windows
    const winMat = new THREE.MeshStandardMaterial({ color: 0xffcc44, emissive: 0xff9900, emissiveIntensity: 0.4 });
    [[-4, 5, 5.6], [4, 5, 5.6], [0, 2.5, 5.6]].forEach(([x, y, z]) => {
      const w = new THREE.Mesh(new THREE.BoxGeometry(2, 1.8, 0.1), winMat);
      w.position.set(x, y, z); houseGroup.add(w);
    });
    scene.add(houseGroup);

    // ── ARRAYS MOUNTED ON HOUSE — pointing outward ────────────────────────────
    // 8 emitter panels: 4 on roof edges + 4 on upper wall corners, all facing outward
    const BEAM_LENGTH = 55;   // how far the acoustic beam travels
    const beamMeshes = [];
    const emitterMats = [];
    const emitterDots = [];

    // Define emitter positions & outward directions
    // All mounted on the house, firing outward radially
    const emitterConfigs = [];
    const NH = 12; // number of horizontal emitters around the house
    for (let i = 0; i < NH; i++) {
      const a = (i / NH) * Math.PI * 2;
      // Mount on the roof ridge, pointing outward + slightly upward
      emitterConfigs.push({
        pos: new THREE.Vector3(Math.cos(a) * 5.5, 12.5, Math.sin(a) * 4.5),
        dir: new THREE.Vector3(Math.cos(a), 0.15, Math.sin(a)).normalize(),
      });
    }
    // 4 upward emitters on roof peak
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      emitterConfigs.push({
        pos: new THREE.Vector3(Math.cos(a) * 1.5, 14.5, Math.sin(a) * 1.5),
        dir: new THREE.Vector3(Math.cos(a) * 0.5, 1, Math.sin(a) * 0.5).normalize(),
      });
    }

    emitterConfigs.forEach(({ pos, dir }) => {
      // Emitter dish (small panel on house)
      const em = new THREE.MeshStandardMaterial({
        color: 0x0a1a33, metalness: 0.95, roughness: 0.15,
        emissive: 0x003388, emissiveIntensity: 0.4
      });
      emitterMats.push(em);
      const dish = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 0.35), em);
      dish.position.copy(pos);
      // Orient dish to face outward
      const up = Math.abs(dir.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      dish.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      houseGroup.add(dish);

      // Emitter glow dots
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const dotMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 1 });
          emitterDots.push(dotMat);
          const dot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 5, 5), dotMat);
          // place in front of dish
          const right = new THREE.Vector3().crossVectors(dir, up).normalize();
          const localUp = new THREE.Vector3().crossVectors(right, dir).normalize();
          dot.position.copy(pos).addScaledVector(dir, 0.2).addScaledVector(right, dx * 0.5).addScaledVector(localUp, dy * 0.35);
          houseGroup.add(dot);
        }
      }

      // Beam cone: starts at house, expands outward
      const beamGeo = new THREE.CylinderGeometry(BEAM_LENGTH * 0.18, 0.5, BEAM_LENGTH, 10, 1, true);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff, transparent: true, opacity: 0.045,
        side: THREE.DoubleSide, depthWrite: false
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      // Position beam so its tip starts at emitter, expands outward
      beam.position.copy(pos).addScaledVector(dir, BEAM_LENGTH / 2);
      beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      beamMeshes.push(beam);
      houseGroup.add(beam);
    });

    // ── Dome rings (acoustic field boundary) ───────────────────────────────────
    const SHIELD_R = 45;
    const domeRings = [];
    for (let i = 0; i < 7; i++) {
      const h = i / 6;
      const r = SHIELD_R * Math.sqrt(Math.max(0, 1 - h * h * 0.6));
      const rm = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0, depthWrite: false });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.25, 8, 72), rm);
      ring.position.y = h * SHIELD_R * 0.55;
      ring.rotation.x = Math.PI / 2;
      scene.add(ring);
      domeRings.push(ring);
    }

    // ── Tornado ────────────────────────────────────────────────────────────────
    const tGroup = new THREE.Group();
    scene.add(tGroup);
    const tParts = [];
    for (let i = 0; i < 14; i++) {
      const p = i / 14;
      const tm = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.72 - p * 0.08, 0.35, 0.18 + p * 0.07),
        transparent: true, opacity: 0.13 + p * 0.10,
        side: THREE.DoubleSide, depthWrite: false
      });
      const tp = new THREE.Mesh(
        new THREE.CylinderGeometry((1.5 + p * 24) * 0.9, 1.5 + p * 24, 5.5, 14, 1, true), tm
      );
      tp.position.y = i * 5.5 + 2.75;
      tGroup.add(tp); tParts.push(tp);
    }

    // ── Debris particles ───────────────────────────────────────────────────────
    const N = 800;
    const pos = new Float32Array(N * 3);
    const vel = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    let tX = -220, tZ = 35;

    function resetP(i) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 28 + 1;
      pos[i*3]   = tX + Math.cos(a) * r;
      pos[i*3+1] = Math.random() * 60 + 1;
      pos[i*3+2] = tZ + Math.sin(a) * r;
      const sp = 0.3 + Math.random() * 0.5;
      vel[i*3]   = -Math.sin(a) * sp;
      vel[i*3+1] = (Math.random() - 0.5) * 0.15;
      vel[i*3+2] =  Math.cos(a) * sp;
      const b = 0.28 + Math.random() * 0.2;
      col[i*3] = b; col[i*3+1] = b * 0.55; col[i*3+2] = b * 0.12;
    }
    for (let i = 0; i < N; i++) resetP(i);

    const dGeo = new THREE.BufferGeometry();
    dGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    dGeo.setAttribute("color",    new THREE.BufferAttribute(col, 3));
    const dMat = new THREE.PointsMaterial({ size: 0.6, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false });
    scene.add(new THREE.Points(dGeo, dMat));

    // ── Input ──────────────────────────────────────────────────────────────────
    renderer.domElement.addEventListener("mousedown", e => { dragging = true; prevX = e.clientX; prevY = e.clientY; });
    window.addEventListener("mouseup", () => { dragging = false; });
    window.addEventListener("mousemove", e => {
      if (!dragging) return;
      theta -= (e.clientX - prevX) * 0.006;
      phi = Math.max(0.1, Math.min(1.45, phi + (e.clientY - prevY) * 0.006));
      prevX = e.clientX; prevY = e.clientY;
      updateCam();
    });
    renderer.domElement.addEventListener("wheel", e => {
      camR = Math.max(30, Math.min(220, camR + e.deltaY * 0.08));
      updateCam();
    });

    // ── Animation loop ─────────────────────────────────────────────────────────
    let frameId, t = 0, lTimer = 2;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const { power: pw, running: run, shieldActive: sa } = stateRef.current;
      if (!run) { renderer.render(scene, camera); return; }
      t += 0.016;

      // Move tornado
      tX += 0.20;
      if (tX > 220) tX = -220;
      tGroup.position.set(tX, 0, tZ);
      tGroup.rotation.y = t * 2.0;
      tGlow.position.set(tX, 28, tZ);
      tParts.forEach((p, i) => { const s = 1 + Math.sin(t * 3.5 + i * 0.6) * 0.07; p.scale.set(s, 1, s); });

      const dist = Math.sqrt(tX * tX + tZ * tZ);
      const threat = Math.max(0, 1 - dist / 140);
      const ss = sa ? pw / 100 : 0;
      let deflCnt = 0;

      // Debris physics
      for (let i = 0; i < N; i++) {
        const ix = i*3, iy = i*3+1, iz = i*3+2;
        const px = pos[ix], py = pos[iy], pz = pos[iz];

        // Tornado pull + spiral
        const dxt = tX - px, dzt = tZ - pz;
        const dt = Math.sqrt(dxt*dxt + dzt*dzt) + 0.01;
        const pull = Math.min(1, 24 / dt) * 0.26;
        vel[ix] += (dxt/dt) * pull - (dzt/dt) * pull * 0.7;
        vel[iz] += (dzt/dt) * pull + (dxt/dt) * pull * 0.7;
        vel[iy] += (Math.random() - 0.52) * 0.06;

        // Shield: push outward from house center
        const dr = Math.sqrt(px*px + pz*pz);
        if (ss > 0 && dr < SHIELD_R * 1.1 && py < 70 && dr > 0.01) {
          const sf = ss * 0.45 * Math.max(0, 1 - dr / (SHIELD_R * 1.15));
          vel[ix] += (px / dr) * sf;
          vel[iz] += (pz / dr) * sf;
          // upward component from the roof arrays
          vel[iy] += ss * 0.04;
          col[ix] = 0.04; col[iy] = 0.72; col[iz] = 1.0;
          deflCnt++;
        } else {
          const b = 0.28 + Math.random() * 0.18;
          col[ix] = b; col[iy] = b * 0.55; col[iz] = b * 0.12;
        }

        vel[ix] *= 0.96; vel[iy] *= 0.975; vel[iz] *= 0.96;
        pos[ix] += vel[ix]; pos[iy] += vel[iy]; pos[iz] += vel[iz];
        if (py < -2 || py > 100 || dt > 95) resetP(i);
      }
      dGeo.attributes.position.needsUpdate = true;
      dGeo.attributes.color.needsUpdate = true;

      // Shield visuals
      shieldGlow.intensity = ss * 4 * (1 + Math.sin(t * 4) * 0.12);
      domeRings.forEach((r, i) => {
        r.material.opacity = ss * (0.13 + Math.sin(t * 1.8 + i * 0.8) * 0.05);
      });
      beamMeshes.forEach((b, i) => {
        b.material.opacity = ss * (0.04 + threat * 0.10 + Math.sin(t * 3 + i) * 0.01);
      });
      emitterMats.forEach((m, i) => {
        m.emissiveIntensity = ss * (0.5 + Math.sin(t * 5 + i * 0.7) * 0.3);
      });
      emitterDots.forEach((d, i) => {
        d.emissiveIntensity = ss * (0.7 + Math.sin(t * 6 + i) * 0.3);
      });

      // Lightning
      lTimer -= 0.016;
      if (lTimer <= 0) {
        flash.intensity = 10 + Math.random() * 18;
        lTimer = 1.5 + Math.random() * 4.5;
        setTimeout(() => { flash.intensity = 0; }, 75);
      }

      if (!dragging) { theta += 0.0012; updateCam(); }

      setStats({
        deflected: deflCnt,
        windspeed: Math.round(260 + threat * 100),
        shieldPct: Math.round(ss * 100),
      });

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || 500;
      camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      try { container.removeChild(renderer.domElement); } catch(e) {}
    };
  }, [loaded]);

  return (
    <div style={{ width:"100%", height:"100vh", background:"#050210", display:"flex", flexDirection:"column", fontFamily:"'Courier New',monospace" }}>

      {/* Header */}
      <div style={{ padding:"10px 20px", borderBottom:"1px solid #180d30", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0, background:"#040112" }}>
        <div>
          <span style={{ color:"#00e5ff", fontSize:14, letterSpacing:3, fontWeight:700 }}>ACOUSTIC</span>
          <span style={{ color:"#8833ff", fontSize:14, letterSpacing:3, fontWeight:700 }}>SHIELD</span>
          <span style={{ color:"#1a0a33", fontSize:10, marginLeft:12, letterSpacing:2 }}>ARRAYS MONTADOS EN CASA · EMISIÓN RADIAL</span>
        </div>
        <div style={{ display:"flex", gap:24 }}>
          {[
            { label:"VIENTO",  value:`${stats.windspeed} km/h`, color:"#ff4060" },
            { label:"ESCUDO",  value:`${stats.shieldPct}%`,     color:"#00e5ff" },
            { label:"DEBRIS DESVIADO", value:stats.deflected,   color:"#ffb700" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign:"right" }}>
              <div style={{ color:"#1a0a33", fontSize:9, letterSpacing:2 }}>{label}</div>
              <div style={{ color, fontSize:15, fontWeight:700 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Viewport */}
      <div ref={mountRef} style={{ flex:1, position:"relative", cursor:"grab", overflow:"hidden" }}>
        {!loaded && (
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ color:"#00e5ff", fontFamily:"monospace", letterSpacing:4 }}>CARGANDO SIMULACIÓN...</span>
          </div>
        )}
        <div style={{ position:"absolute", top:14, right:14, background:"rgba(0,0,0,0.65)", border:`1px solid ${shieldActive?"#00e5ff":"#ff4060"}`, borderRadius:4, padding:"8px 16px", textAlign:"center" }}>
          <div style={{ color:shieldActive?"#00e5ff":"#ff4060", fontSize:9, letterSpacing:3 }}>ESCUDO</div>
          <div style={{ color:shieldActive?"#00e5ff":"#ff4060", fontSize:22, fontWeight:700 }}>{shieldActive?"ACTIVO":"INACTIVO"}</div>
        </div>

        {/* Diagram label */}
        <div style={{ position:"absolute", bottom:40, left:16, background:"rgba(0,0,0,0.5)", borderLeft:"2px solid #00e5ff", padding:"8px 12px" }}>
          <div style={{ color:"#00e5ff", fontSize:9, letterSpacing:2, marginBottom:4 }}>CONCEPTO</div>
          <div style={{ color:"#8877aa", fontSize:10, lineHeight:1.6 }}>
            Arrays en el tejado<br/>emiten haces radiales<br/>→ crean domo de presión
          </div>
        </div>

        <div style={{ position:"absolute", bottom:14, left:"50%", transform:"translateX(-50%)", color:"#180d30", fontSize:10, letterSpacing:3, pointerEvents:"none" }}>
          ARRASTRA · SCROLL ZOOM
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding:"12px 20px", borderTop:"1px solid #180d30", background:"#040112", display:"flex", gap:20, alignItems:"center", flexShrink:0, flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ color:"#1a0a33", fontSize:10, letterSpacing:2, minWidth:64 }}>POTENCIA</span>
          <input type="range" min="10" max="100" step="5" value={power}
            onChange={e => setPower(Number(e.target.value))}
            style={{ accentColor:"#00e5ff", width:130 }} />
          <span style={{ color:"#00e5ff", fontSize:14, fontWeight:700, minWidth:40 }}>{power}%</span>
        </div>

        <button onClick={() => setShieldActive(s => !s)} style={{
          background: shieldActive ? "rgba(0,229,255,0.08)" : "rgba(255,64,96,0.08)",
          color: shieldActive ? "#00e5ff" : "#ff4060",
          border: `1px solid ${shieldActive ? "#00e5ff" : "#ff4060"}`,
          borderRadius:3, padding:"7px 20px", fontFamily:"monospace",
          fontSize:11, letterSpacing:2, cursor:"pointer", fontWeight:700
        }}>
          {shieldActive ? "⬡ ESCUDO ON" : "⬡ ESCUDO OFF"}
        </button>

        <button onClick={() => setRunning(r => !r)} style={{
          background: running ? "rgba(255,64,96,0.08)" : "rgba(0,255,157,0.08)",
          color: running ? "#ff4060" : "#00ff9d",
          border: `1px solid ${running ? "#ff4060" : "#00ff9d"}`,
          borderRadius:3, padding:"7px 20px", fontFamily:"monospace",
          fontSize:11, letterSpacing:2, cursor:"pointer", fontWeight:700
        }}>
          {running ? "⏸ PAUSAR" : "▶ REANUDAR"}
        </button>

        <div style={{ marginLeft:"auto", display:"flex", gap:16, alignItems:"center" }}>
          {[
            { color:"#7a4a15", label:"debris tornado" },
            { color:"#00aaff", label:"desviado por escudo" },
            { color:"#00e5ff", label:"haces acústicos" },
          ].map(({ color, label }) => (
            <div key={label} style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:color }} />
              <span style={{ color:"#1a0a33", fontSize:10 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
