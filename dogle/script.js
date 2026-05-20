(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const revealItems = document.querySelectorAll(".reveal");
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    { threshold: 0.18 }
  );

  revealItems.forEach((item, index) => {
    item.style.setProperty("--delay", `${Math.min(index % 6, 5) * 55}ms`);
    revealObserver.observe(item);
  });

  const glowCards = document.querySelectorAll(".skill-card, .project-card, .info-card");
  glowCards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--mx", `${x}%`);
      card.style.setProperty("--my", `${y}%`);
    });
  });

  const phrases = [
    "React / Vue / ArkTS",
    "复杂业务系统落地",
    "组件库与工程化建设",
    "性能优化与质量治理",
    "数据可视化与多端应用",
  ];
  const typedText = document.getElementById("typed-text");
  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function typeLoop() {
    if (!typedText) return;
    const phrase = phrases[phraseIndex];
    typedText.textContent = phrase.slice(0, charIndex);

    if (reduceMotion) {
      typedText.textContent = phrases.join(" · ");
      return;
    }

    if (!deleting && charIndex < phrase.length) {
      charIndex += 1;
      window.setTimeout(typeLoop, 70);
      return;
    }

    if (!deleting && charIndex === phrase.length) {
      deleting = true;
      window.setTimeout(typeLoop, 1300);
      return;
    }

    if (deleting && charIndex > 0) {
      charIndex -= 1;
      window.setTimeout(typeLoop, 34);
      return;
    }

    deleting = false;
    phraseIndex = (phraseIndex + 1) % phrases.length;
    window.setTimeout(typeLoop, 240);
  }

  typeLoop();

  const canvas = document.getElementById("particle-canvas");
  const ctx = canvas ? canvas.getContext("2d") : null;
  const particles = [];
  let width = 0;
  let height = 0;
  let animationFrame = 0;
  let pointerX = 0;
  let pointerY = 0;

  function resizeCanvas() {
    if (!canvas || !ctx) return;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    particles.length = 0;
    const particleCount = width < 620 ? 34 : 76;
    for (let i = 0; i < particleCount; i += 1) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.42,
        vy: (Math.random() - 0.5) * 0.42,
        radius: Math.random() * 1.8 + 0.8,
      });
    }
  }

  function drawParticles() {
    if (!canvas || !ctx || reduceMotion) return;
    ctx.clearRect(0, 0, width, height);

    particles.forEach((particle, index) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < 0 || particle.x > width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > height) particle.vy *= -1;

      const dxPointer = particle.x - pointerX;
      const dyPointer = particle.y - pointerY;
      const pointerDistance = Math.hypot(dxPointer, dyPointer);
      if (pointerDistance < 140) {
        particle.x += dxPointer * 0.006;
        particle.y += dyPointer * 0.006;
      }

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(77, 231, 255, 0.7)";
      ctx.fill();

      for (let j = index + 1; j < particles.length; j += 1) {
        const other = particles[j];
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 118) {
          ctx.strokeStyle = `rgba(77, 231, 255, ${0.16 * (1 - distance / 118)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
        }
      }
    });

    animationFrame = window.requestAnimationFrame(drawParticles);
  }

  if (canvas && ctx && !reduceMotion) {
    resizeCanvas();
    drawParticles();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("pointermove", (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
    });
  }

  window.addEventListener("beforeunload", () => {
    if (animationFrame) {
      window.cancelAnimationFrame(animationFrame);
    }
  });
})();
