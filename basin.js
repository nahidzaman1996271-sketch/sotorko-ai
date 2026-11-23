const WIDTH = 640;
const HEIGHT = 306;
// Schematic, north up. The Surma enters from the east past Sylhet and flows west to Sunamganj;
// the Kushiyara runs south of it; Chattogram sits far to the south-east on the separate Karnaphuli.
const mainRiver = [[672, 104], [580, 118], [500, 106], [430, 122], [360, 100], [290, 113],
  [220, 94], [140, 110], [60, 88], [-32, 104]];
const tributaries = [
  [[672, 142], [590, 152], [500, 158], [400, 150], [300, 168], [200, 160], [100, 180], [-32, 172]],
  [[252, -24], [246, 26], [228, 60], [220, 94]],
  [[672, 178], [600, 196], [560, 206], [520, 214], [482, 246], [452, 290], [430, 334]],
];
const stationPositions = { sylhet: [430, 122], chattogram: [520, 214], sunamganj: [220, 94] };
const indicator = { Normal: '#3ccf91', Watch: '#f5b445', Severe: '#ff6b5b' };

// Sample the illustration's river paths for both strokes and moving flow markers.
function smooth(points) {
  const samples = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[Math.max(0, i - 1)];
    const b = points[i];
    const c = points[i + 1];
    const d = points[Math.min(points.length - 1, i + 2)];
    for (let step = 0; step < 16; step++) {
      const t = step / 16;
      samples.push(b.map((value, axis) => (
        value + 0.5 * ((c[axis] - a[axis]) * t
          + (2 * a[axis] - 5 * value + 4 * c[axis] - d[axis]) * t ** 2
          + (3 * value - a[axis] - 3 * c[axis] + d[axis]) * t ** 3)
      )));
    }
  }
  return [...samples, points.at(-1)];
}

const channels = [mainRiver, ...tributaries].map(smooth);
function trace(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  points.slice(1).forEach(point => ctx.lineTo(...point));
}

function drawTerrain(ctx) {
  const sky = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  sky.addColorStop(0, '#061a1f');
  sky.addColorStop(0.52, '#0b383d');
  sky.addColorStop(1, '#061a1f');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = '#bbefcb27';
  for (let x = 12; x < WIDTH; x += 20) {
    for (let y = 8; y < HEIGHT; y += 20) ctx.fillRect(x, y, 1, 1);
  }

  const contourGroups = [[130, 45, 1.55, 0.32], [360, 291, 1.3, 1.2], [584, 112, 1.52, 2.9]];
  contourGroups.forEach(([cx, cy, stretch, phase]) => {
    for (let radius = 21; radius < 154; radius += 8) {
      const points = Array.from({ length: 121 }, (_, index) => {
        const angle = 2 * Math.PI * index / 120;
        const wobble = 1 + 0.17 * Math.sin(angle * 3 + phase) + 0.07 * Math.sin(angle * 6 - phase + radius / 45);
        return [cx + Math.cos(angle) * radius * stretch * wobble, cy + Math.sin(angle) * radius * wobble];
      });
      trace(ctx, points);
      ctx.strokeStyle = radius % 3 === 0 ? '#b2ead33a' : '#9edabc23';
      ctx.lineWidth = 0.85;
      ctx.stroke();
    }
  });

  ctx.lineJoin = 'round';
  for (const [index, points] of channels.entries()) {
    trace(ctx, points);
    ctx.lineWidth = index === 0 ? 24 : 12;
    ctx.strokeStyle = '#073c36b8';
    ctx.stroke();
    ctx.lineWidth = index === 0 ? 8 : 3.5;
    ctx.strokeStyle = index === 0 ? '#31b9956b' : '#369a806d';
    ctx.stroke();
    ctx.lineWidth = index === 0 ? 2 : 1;
    ctx.strokeStyle = index === 0 ? '#74d9cdbc' : '#61b2b17a';
    ctx.stroke();
  }
}

export function createBasinGraphic(canvas, button, preference, areas) {
  const context = canvas.getContext('2d');
  if (!context) return { update() {}, paused: true };
  const terrain = document.createElement('canvas');
  terrain.width = WIDTH * 2;
  terrain.height = HEIGHT * 2;
  const ground = terrain.getContext('2d');
  ground.scale(2, 2);
  drawTerrain(ground);

  const stations = areas.map(area => ({ label: area.name.toUpperCase(), point: stationPositions[area.id] }));
  let locale = { language: 'en', pause: 'Pause motion', play: 'Play motion' };
  let status = stations.map(() => 'Normal');
  let visible = true;
  let manuallyPaused = false;
  let frame = 0;
  let last = 0;
  let elapsed = 0;
  const paused = () => manuallyPaused || preference.matches;

  function draw() {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const pixelsWide = Math.round(width * ratio);
    const pixelsHigh = Math.round(height * ratio);
    if (canvas.width !== pixelsWide || canvas.height !== pixelsHigh) {
      canvas.width = pixelsWide;
      canvas.height = pixelsHigh;
    }
    const scale = Math.min(Math.max(pixelsWide / WIDTH, pixelsHigh / HEIGHT), pixelsWide / 540);
    const left = (pixelsWide - WIDTH * scale) / 2;
    const top = (pixelsHigh - HEIGHT * scale) / 2;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = '#061a1f';
    context.fillRect(0, 0, pixelsWide, pixelsHigh);
    context.setTransform(scale, 0, 0, scale, left, top);
    context.drawImage(terrain, 0, 0, WIDTH, HEIGHT);

    channels.forEach((points, index) => {
      const count = index === 0 ? 7 : 3;
      for (let marker = 0; marker < count; marker++) {
        const progress = (elapsed / (index === 0 ? 11800 : 9500) + marker / count + index * 0.13) % 1;
        const [x, y] = points[Math.floor(progress * (points.length - 1))];
        context.fillStyle = index === 0 ? '#cafbe0' : '#a0e8cd';
        context.globalAlpha = 0.15 + Math.sin(progress * Math.PI) * 0.72;
        context.beginPath();
        context.arc(x, y, index === 0 ? 2.2 : 1.4, 0, 2 * Math.PI);
        context.fill();
      }
    });
    context.globalAlpha = 1;

    stations.forEach(({ point: [x, y], label }, index) => {
      const color = indicator[status[index]];
      const phase = paused() ? 0.36 : (elapsed / 2200 + index * 0.27) % 1;
      context.globalAlpha = (1 - phase) * 0.47;
      context.beginPath();
      context.arc(x, y, 7 + phase * 16, 0, 2 * Math.PI);
      context.strokeStyle = color;
      context.lineWidth = 1.5;
      context.stroke();
      context.globalAlpha = 1;
      context.fillStyle = '#10352c';
      context.beginPath();
      context.arc(x, y, 7.2, 0, 2 * Math.PI);
      context.fill();
      context.fillStyle = color;
      context.beginPath();
      context.arc(x, y, 4, 0, 2 * Math.PI);
      context.fill();
      context.font = `700 ${Math.max(10, 9 * ratio / scale)}px "Noto Sans Bengali", "Nirmala UI", "Segoe UI", sans-serif`;
      context.letterSpacing = locale.language === 'bn' ? '0px' : '1px';
      const labelWidth = context.measureText(label).width;
      const labelX = x > 450 ? x - 13 - labelWidth : x + 13;
      context.fillStyle = '#092e25df';
      context.fillRect(labelX - 5, y - 11, labelWidth + 10, 22);
      context.fillStyle = '#e5f7ed';
      context.textBaseline = 'middle';
      context.fillText(label, labelX, y);
    });
  }

  function animate(now) {
    if (now - last >= 30) {
      elapsed += last ? Math.min(60, now - last) : 0;
      last = now;
      draw();
    }
    frame = requestAnimationFrame(animate);
  }

  function sync() {
    cancelAnimationFrame(frame);
    last = 0;
    button.hidden = preference.matches;
    button.textContent = manuallyPaused ? locale.play : locale.pause;
    draw();
    if (visible && !paused()) frame = requestAnimationFrame(animate);
  }

  button.addEventListener('click', () => {
    manuallyPaused = !manuallyPaused;
    sync();
  });
  preference.addEventListener('change', sync);
  new ResizeObserver(draw).observe(canvas);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }).observe(canvas);
  sync();

  return {
    get paused() { return paused(); },
    update(severities, nextLocale) {
      status = severities;
      if (nextLocale) {
        locale = nextLocale;
        stations.forEach((station, index) => {
          station.label = locale.language === 'bn' ? locale.labels[index] : locale.labels[index].toUpperCase();
        });
        button.textContent = manuallyPaused ? locale.play : locale.pause;
      }
      draw();
    },
  };
}
