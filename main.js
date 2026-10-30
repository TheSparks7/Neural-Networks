gsap.registerPlugin(ScrollTrigger);

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const docEl = document.documentElement;
const scrollCue = document.querySelector(".scroll-cue");

const scrollbar = document.createElement("div");
scrollbar.className = "page-scrollbar";
scrollbar.setAttribute("role", "scrollbar");
scrollbar.setAttribute("aria-label", "Page scroll");
scrollbar.setAttribute("aria-orientation", "vertical");
scrollbar.setAttribute("aria-valuemin", "0");
scrollbar.setAttribute("aria-valuemax", "1000");
scrollbar.tabIndex = 0;
const scrollbarThumb = document.createElement("span");
scrollbarThumb.className = "page-scrollbar__thumb";
scrollbarThumb.setAttribute("aria-hidden", "true");
scrollbar.appendChild(scrollbarThumb);
document.body.appendChild(scrollbar);

let scrollbarFrame = 0;
let scrollbarDragOffset = 0;
let scrollbarDragging = false;

function updateScrollbar(){
  scrollbarFrame = 0;
  const scrollHeight = docEl.scrollHeight;
  const viewportHeight = window.innerHeight;
  const maxScroll = Math.max(0, scrollHeight - viewportHeight);
  scrollbar.hidden = maxScroll === 0;
  if (maxScroll === 0) return;

  const trackHeight = scrollbar.clientHeight;
  const thumbHeight = Math.min(trackHeight, Math.max(36, trackHeight * viewportHeight / scrollHeight));
  const maxThumbTop = trackHeight - thumbHeight;
  const scrollTop = Math.min(maxScroll, Math.max(0, window.scrollY || docEl.scrollTop));
  const progress = scrollTop / maxScroll;
  scrollbarThumb.style.height = `${thumbHeight}px`;
  scrollbarThumb.style.transform = `translate3d(0, ${progress * maxThumbTop}px, 0)`;
  scrollbar.setAttribute("aria-valuenow", String(Math.round(progress * 1000)));
}

function scheduleScrollbarUpdate(){
  if (!scrollbarFrame) scrollbarFrame = requestAnimationFrame(updateScrollbar);
}

function scrollFromScrollbar(clientY, behavior){
  const maxScroll = Math.max(0, docEl.scrollHeight - window.innerHeight);
  const maxThumbTop = scrollbar.clientHeight - scrollbarThumb.offsetHeight;
  if (maxScroll === 0 || maxThumbTop <= 0) return;
  const trackTop = scrollbar.getBoundingClientRect().top;
  const thumbTop = Math.min(maxThumbTop, Math.max(0, clientY - trackTop - scrollbarDragOffset));
  window.scrollTo({ top: thumbTop / maxThumbTop * maxScroll, behavior });
}

gsap.set(scrollCue, { autoAlpha: 0, y: 8 });

function setScrollCueVisible(visible){
  scrollCue.classList.toggle("is-visible", visible);
  gsap.to(scrollCue, {
    autoAlpha: visible ? 1 : 0,
    y: visible ? 0 : 8,
    duration: reduce ? 0 : 0.55,
    ease: "power2.out",
    overwrite: "auto"
  });
}

scrollbar.addEventListener("pointerdown", event => {
  if (scrollbar.hidden) return;
  const thumbRect = scrollbarThumb.getBoundingClientRect();
  scrollbarDragging = scrollbarThumb.contains(event.target);
  scrollbarDragOffset = scrollbarDragging ? event.clientY - thumbRect.top : scrollbarThumb.offsetHeight / 2;
  if (scrollbarDragging) {
    scrollbar.classList.add("is-dragging");
    scrollbar.setPointerCapture(event.pointerId);
  } else {
    scrollFromScrollbar(event.clientY, reduce ? "auto" : "smooth");
  }
  event.preventDefault();
});
scrollbar.addEventListener("pointermove", event => {
  if (scrollbarDragging) scrollFromScrollbar(event.clientY, "auto");
});
const stopScrollbarDrag = () => {
  scrollbarDragging = false;
  scrollbar.classList.remove("is-dragging");
};
scrollbar.addEventListener("pointerup", stopScrollbarDrag);
scrollbar.addEventListener("pointercancel", stopScrollbarDrag);
scrollbar.addEventListener("keydown", event => {
  const maxScroll = Math.max(0, docEl.scrollHeight - window.innerHeight);
  const currentScroll = window.scrollY || docEl.scrollTop;
  const pageStep = Math.max(1, window.innerHeight * 0.9);
  let destination;

  switch (event.key) {
    case "ArrowUp": destination = currentScroll - 40; break;
    case "ArrowDown": destination = currentScroll + 40; break;
    case "PageUp": destination = currentScroll - pageStep; break;
    case "PageDown": destination = currentScroll + pageStep; break;
    case "Home": destination = 0; break;
    case "End": destination = maxScroll; break;
    default: return;
  }

  event.preventDefault();
  window.scrollTo({ top: Math.min(maxScroll, Math.max(0, destination)), behavior: reduce ? "auto" : "smooth" });
});
window.addEventListener("scroll", scheduleScrollbarUpdate, { passive: true });
window.addEventListener("resize", scheduleScrollbarUpdate);
new ResizeObserver(scheduleScrollbarUpdate).observe(document.body);
scheduleScrollbarUpdate();

/* page is locked until the intro has finished, finally did it after so muc grinding */
docEl.classList.add("is-locked");

const NS = "http://www.w3.org/2000/svg";

const netNodes = [
  {x:200,y:180},{x:360,y:380},{x:160,y:560},
  {x:520,y:160},{x:560,y:560},{x:400,y:720},
  {x:800,y:140},{x:860,y:700},{x:720,y:800},
  {x:1120,y:190},{x:1180,y:560},{x:1040,y:740},
  {x:1420,y:240},{x:1460,y:520},{x:1320,y:720}
];
const netEdges = [
  [0,1],[0,3],[1,4],[1,2],[2,5],[3,6],[3,4],[4,7],[4,5],[5,8],
  [6,9],[7,9],[7,10],[8,10],[8,11],[9,12],[10,13],[10,11],[11,14],
  [12,13],[13,14]
];

const netSvg = document.createElementNS(NS, "svg");
netSvg.setAttribute("viewBox", "0 0 1600 900");
netSvg.setAttribute("preserveAspectRatio", "xMidYMid slice");

const edgeEls = [];
netEdges.forEach(([a, b]) => {
  const line = document.createElementNS(NS, "line");
  line.setAttribute("x1", netNodes[a].x);
  line.setAttribute("y1", netNodes[a].y);
  line.setAttribute("x2", netNodes[b].x);
  line.setAttribute("y2", netNodes[b].y);
  line.setAttribute("class", "intro-net-edge");
  netSvg.appendChild(line);
  edgeEls.push(line);
});

const nodeEls = [];
netNodes.forEach(n => {
  const c = document.createElementNS(NS, "circle");
  c.setAttribute("cx", n.x);
  c.setAttribute("cy", n.y);
  c.setAttribute("r", 3.5);
  c.setAttribute("class", "intro-net-node");
  netSvg.appendChild(c);
  nodeEls.push(c);
});

document.getElementById("introNet").appendChild(netSvg);

edgeEls.forEach(e => {
  const len = e.getTotalLength();
  e.style.strokeDasharray = len;
  e.style.strokeDashoffset = len;
});

gsap.set(nodeEls, { opacity: 0, scale: 0, transformOrigin: "50% 50%" });

let nodeDrift;
if (!reduce) {
  nodeDrift = gsap.to(nodeEls, {
    x: () => (Math.random() - 0.5) * 14,
    y: () => (Math.random() - 0.5) * 14,
    duration: 3.6,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
    stagger: { each: 0.18, from: "random" }
  });
}

const heroTitle = document.getElementById("heroTitle");
const heroLines = heroTitle.querySelectorAll(".hero-title__line");
const titleNet = heroTitle.querySelector(".title-net");
const titleHoverRule = heroTitle.querySelector(".title-hover-rule");
const titleNetEdgesGroup = titleNet.querySelector(".title-net-edges");
const titleNetNodesGroup = titleNet.querySelector(".title-net-nodes");
const titleNetLinks = [
  [0,1],[0,3],[1,4],[1,2],[2,5],[3,6],[4,7],
  [5,8],[6,9],[7,10],[8,11],[9,12],[10,13],[11,14]
];
const titleNetEdges = [];
titleNetLinks.forEach(([a, b]) => {
  const line = document.createElementNS(NS, "line");
  line.setAttribute("x1", netNodes[a].x);
  line.setAttribute("y1", netNodes[a].y);
  line.setAttribute("x2", netNodes[b].x);
  line.setAttribute("y2", netNodes[b].y);
  line.setAttribute("class", "title-net-edge");
  titleNetEdgesGroup.appendChild(line);
  titleNetEdges.push(line);
});
const titleNetNodes = [];
netNodes.forEach(node => {
  const circle = document.createElementNS(NS, "circle");
  circle.setAttribute("cx", node.x);
  circle.setAttribute("cy", node.y);
  circle.setAttribute("r", 3.5);
  circle.setAttribute("class", "title-net-node");
  titleNetNodesGroup.appendChild(circle);
  titleNetNodes.push(circle);
});
const glitchMap = document.getElementById("glitch-map");

function splitLine(el) {
  const text = el.dataset.text || el.textContent;
  el.textContent = "";
  const out = [];
  [...text].forEach(ch => {
    const span = document.createElement("span");
    span.className = "char";
    span.textContent = ch;
    el.appendChild(span);
    out.push(span);
  });
  return out;
}

const allChars = [];
heroLines.forEach(line => allChars.push(...splitLine(line)));

gsap.set(heroTitle, { transformOrigin: "top left", filter: "url(#glitch)" });
gsap.set(allChars, { opacity: 0, filter: "blur(10px)", y: 24 });
gsap.set(allChars, { transformOrigin: "50% 80%" });
gsap.set(titleNet, { autoAlpha: 0 });
gsap.set(titleNetNodes, { autoAlpha: 0, scale: 0, transformOrigin: "50% 50%" });
titleNetEdges.forEach(edge => {
  const length = edge.getTotalLength();
  edge.style.strokeDasharray = length;
  edge.style.strokeDashoffset = length;
});
const wikipediaLink = document.querySelector(".wikipedia-link");
const wikipediaLabel = wikipediaLink.querySelector(".wikipedia-label");
gsap.set(".info__body", { autoAlpha: 0, y: 14 });
gsap.set(wikipediaLink, { autoAlpha: 0, y: 12, rotation: -12, transformOrigin: "50% 50%" });
gsap.set(wikipediaLabel, { opacity: 0, x: 8, yPercent: -50 });
const wikipediaLabelTween = gsap.to(wikipediaLabel, {
  opacity: 1,
  x: 0,
  duration: reduce ? 0 : 0.3,
  ease: "power2.out",
  paused: true
});

wikipediaLink.addEventListener("mouseenter", () => wikipediaLabelTween.play());
wikipediaLink.addEventListener("mouseleave", () => wikipediaLabelTween.reverse());
wikipediaLink.addEventListener("focusin", () => wikipediaLabelTween.play());
wikipediaLink.addEventListener("focusout", event => {
  if (!wikipediaLink.contains(event.relatedTarget)) wikipediaLabelTween.reverse();
});

const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });

tl.to(".boot-overlay", { opacity: 0, duration: 0.5, ease: "power2.inOut" }, 0);

tl.to(".noise-overlay", { opacity: 0.55, duration: 0.05 }, 0.15);
tl.to(".noise-overlay", { opacity: 0.08, duration: 0.06 }, 0.26);
tl.to(".noise-overlay", { opacity: 0.65, duration: 0.05 }, 0.36);
tl.to(".noise-overlay", { opacity: 0.15, duration: 0.08 }, 0.46);
tl.to(".noise-overlay", { opacity: 0.5, duration: 0.06 }, 0.60);
tl.to(".noise-overlay", { opacity: 0.10, duration: 0.10 }, 0.72);
tl.to(".noise-overlay", { opacity: 0.03, duration: 1.1, ease: "power2.inOut" }, 1.55);
tl.set(".noise-overlay", { mixBlendMode: "overlay" }, 1.55);
tl.set(".noise-overlay", { opacity: 0, animation: "none" }, 2.65);

tl.to(glitchMap, { attr: { scale: 30 }, duration: 0.15 }, 0.2);
tl.to(glitchMap, { attr: { scale: 0 }, duration: 1.0, ease: "power2.out" }, 0.35);

tl.to(nodeEls, {
  opacity: 1,
  scale: 1,
  duration: 0.4,
  stagger: { each: 0.025, from: "random" },
  ease: "power2.out"
}, 0.4);

tl.to(edgeEls, {
  strokeDashoffset: 0,
  duration: 0.7,
  stagger: { each: 0.015, from: "start" },
  ease: "power1.out"
}, 0.75);

tl.to(nodeEls, {
  stroke: "#ff5c2e",
  fill: "rgba(255,92,46,.12)",
  duration: 0.18,
  stagger: { each: 0.03, from: "random" },
  yoyo: true,
  repeat: 1,
  ease: "power2.inOut"
}, 1.35);

tl.to(edgeEls, {
  stroke: "#ff5c2e",
  duration: 0.22,
  stagger: { each: 0.022, from: "start" },
  yoyo: true,
  repeat: 1,
  ease: "power2.inOut"
}, 1.55);

tl.fromTo(allChars,
  { opacity: 0, filter: "blur(10px)", y: 32 },
  {
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    duration: 0.8,
    stagger: { each: 0.045, from: "random" },
    ease: "power3.out"
  },
  1.6
);

tl.fromTo(heroTitle,
  { textShadow: "-4px 0 rgba(255,92,46,.7), 4px 0 rgba(80,180,255,.6)" },
  { textShadow: "0 0 rgba(255,92,46,0), 0 0 rgba(80,180,255,0)", duration: 1.4, ease: "power2.out" },
  1.6
);

tl.to([nodeEls, edgeEls], {
  opacity: 0,
  duration: 0.7,
  ease: "power2.inOut"
}, 2.35);

tl.call(() => {
  if (nodeDrift) nodeDrift.kill();
}, null, 3.05);

tl.set(heroTitle, { filter: "none" }, 2.5);

tl.to(heroTitle, {
  x: () => window.innerWidth <= 768 ? 0 : window.innerWidth * 0.05 - heroTitle.getBoundingClientRect().left,
  y: () => window.innerWidth <= 768 ? 0 : window.innerHeight / 2 - heroTitle.getBoundingClientRect().top - heroTitle.offsetHeight * 0.55 / 2,
  scale: () => window.innerWidth <= 768 ? 1 : 0.55,
  duration: 1.0,
  ease: "expo.inOut"
}, 2.5);

tl.to(titleNet, {
  autoAlpha: 1,
  duration: 0.35,
  ease: "power1.out"
}, 3.05);

tl.to(titleNetEdges, {
  strokeDashoffset: 0,
  duration: 0.65,
  stagger: { each: 0.025, from: "random" },
  ease: "power1.out"
}, 3.1);

tl.to(titleNetNodes, {
  autoAlpha: 0.8,
  scale: 1,
  duration: 0.35,
  stagger: { each: 0.02, from: "random" },
  ease: "back.out(1.7)"
}, 3.35);

tl.from(".info__lede", {
  x: 30,
  opacity: 0,
  duration: 0.8,
  ease: "power2.out"
}, 3.4);

tl.from(".info__body > *", {
  y: 24,
  opacity: 0,
  duration: 0.75,
  stagger: 0.14,
  ease: "power2.out"
}, 3.6);

tl.to(".info__body", {
  autoAlpha: 1,
  y: 0,
  duration: 0.55,
  ease: "power2.out"
}, ">");

tl.to(wikipediaLink, {
  autoAlpha: 1,
  y: 0,
  rotation: 0,
  duration: 0.55,
  ease: "back.out(1.7)"
}, ">");
const spyEl = document.getElementById("spy");
const spyItems = Array.from(spyEl.querySelectorAll(".spy__item"));
const spyLinks = spyItems.map(item => item.querySelector(".spy__link"));
const spyTargets = spyLinks.map(link => document.querySelector(link.getAttribute("href")));
let spyActive = -1;

function setSpyActive(index){
  if (index === spyActive) return;
  spyActive = index;
  spyItems.forEach((item, i) => {
    const on = i === index;
    item.classList.toggle("is-active", on);
    if (on) spyLinks[i].setAttribute("aria-current", "true");
    else spyLinks[i].removeAttribute("aria-current");
  });
}

function spyUpdate(){
  let activeIndex = 0;
  spyTargets.forEach((target, index) => {
    if (target && target.getBoundingClientRect().top <= 1) activeIndex = index;
  });
  setSpyActive(activeIndex);
}

spyLinks.forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    if (link.getAttribute("href") === "#overview" && window.innerWidth <= 768) {
  window.scrollTo({
    top: 0,
    behavior: reduce ? "auto" : "smooth"
  });
  return;
}
    target.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start"
    });
  });
});

window.addEventListener("scroll", spyUpdate, { passive: true });
window.addEventListener("resize", spyUpdate);
spyUpdate();

gsap.set(spyEl, { autoAlpha: 0, x: -14 });
tl.to(spyEl, { autoAlpha: 1, x: 0, duration: 0.7, ease: "power2.out" }, 3.9);

/* No Comments bruv */

let scrollBuilt = false;

const overviewTitleX = () => heroTitle.offsetWidth / 2 - window.innerWidth * 0.45;
const overviewTitleYIn = () => heroTitle.offsetHeight * 0.225;
const overviewTitleYOut = () => heroTitle.offsetHeight / 2 - window.innerHeight * 0.44;

function initScroll(){
  if (scrollBuilt || reduce) return;
  if (window.innerWidth <= 768) return;   /* mobile uses the normal document flow as the webste just breaks otherwise */
  scrollBuilt = true;

  const infoEl     = document.querySelector(".info");
  const infoLedeEl = document.querySelector(".info__lede");
  const infoBodyEl = document.querySelector(".info__body");
  const scrollSpace = document.querySelector(".scroll-space");
  const contentH = () => infoLedeEl.offsetHeight + infoBodyEl.offsetHeight + 40;
  /* the info keeps its authored width, it just gets re-centred */
  const infoWidth = () => Math.min(820, window.innerWidth * 0.54);
  const infoSide  = () => (window.innerWidth - infoWidth()) / 2;
  const infoTop   = () => Math.max(window.innerHeight * 0.045,
                                   (window.innerHeight - contentH()) / 2);

  const st = gsap.timeline({
    defaults: { ease: "power2.inOut" },
    scrollTrigger: {
      trigger: scrollSpace,
      start: "top top",
      end: () => "+=" + Math.round(window.innerHeight * 1.35),
      scrub: true,
      snap: {
        snapTo: progress => Math.round(progress),
        duration: { min: 0.25, max: 0.45 },
        delay: 0.1,
        ease: "power2.out",
        inertia: false
      },
      invalidateOnRefresh: true
    }
  });


  st.fromTo(heroTitle,
    { x: overviewTitleX, y: overviewTitleYIn, scale: 0.55 },
    { x: overviewTitleX, y: overviewTitleYOut, scale: 0.30, duration: 1, ease: "power1.inOut" },
    0
  );

  /*  the description slides from the right column to the centre as it looks so cool */
  st.fromTo(infoEl,
    {
      left:   () => window.innerWidth * 0.42,
      right:  () => window.innerWidth * 0.04,
      top:    () => window.innerHeight * 0.11,
      bottom: () => window.innerHeight * 0.08
    },
    {
      left: infoSide,
      right: infoSide,
      top: infoTop,
      bottom: infoTop,
      duration: 1
    },
    0
  );

  ScrollTrigger.create({
    trigger: scrollSpace,
    start: "bottom 10%",
    endTrigger: detailsSection,
    end: "top 85%",
    onEnter: () => setScrollCueVisible(true),
    onEnterBack: () => setScrollCueVisible(true),
    onLeave: () => setScrollCueVisible(false),
    onLeaveBack: () => setScrollCueVisible(false)
  });
}

function initPracticalTitleScroll(){
  const practicalSection = document.querySelector(".mnist-demo");
  if (reduce || !practicalSection) return;

  const isMobile = window.innerWidth <= 768;
  const scrollTrigger = {
    trigger: practicalSection,
    start: "top bottom",
    end: "bottom top",
    invalidateOnRefresh: true
  };

  if (isMobile) {
    return;
  }

  const cornerMarginX = () => Math.max(16, window.innerWidth * 0.03);
  const cornerMarginY = () => Math.max(14, window.innerHeight * 0.02);
  const cornerScale = () => Math.min(
    0.2,
    (window.innerWidth - cornerMarginX() * 2) * 0.34 / heroTitle.offsetWidth,
    Math.min(64, window.innerHeight * 0.075) / heroTitle.offsetHeight
  );
  const cornerX = () => cornerMarginX() - (window.innerWidth - heroTitle.offsetWidth) / 2;
  const cornerY = () => cornerMarginY() - (window.innerHeight - heroTitle.offsetHeight) / 2;

  const practicalTitleTimeline = gsap.timeline({
    scrollTrigger: {
      ...scrollTrigger,
      scrub: true
    }
  });

  practicalTitleTimeline.fromTo(heroTitle,
    {
      x: overviewTitleX,
      y: overviewTitleYOut,
      scale: 0.30
    },
    {
      x: cornerX,
      y: cornerY,
      scale: cornerScale,
      duration: 0.14,
      ease: "power2.inOut",
      immediateRender: false
    },
    0
  ).to(heroTitle, {
    x: overviewTitleX,
    y: overviewTitleYOut,
    scale: 0.30,
    duration: 0.12,
    ease: "power2.inOut"
  }, 0.88);
}

const detailsSection = document.querySelector(".details");
const detailsStage = detailsSection.querySelector(".details__stage");
const detailsCards = Array.from(detailsStage.querySelectorAll(".details__card"));
const detailsTransitions = detailsCards.length - 1;
let detailsTimeline;

function initDetailsScroll(){
  if (detailsTimeline || reduce || window.innerWidth <= 768 || detailsCards.length < 2) return;

  gsap.set(detailsCards, { autoAlpha: 0, yPercent: 14 });
  gsap.set(detailsCards[0], { autoAlpha: 1, yPercent: 0 });

  detailsTimeline = gsap.timeline({
    defaults: { ease: "power2.inOut" },
    scrollTrigger: {
      trigger: detailsSection,
      pin: detailsStage,
      pinSpacing: true,
      start: "top top",
      end: () => "+=" + Math.round(detailsTransitions * window.innerHeight),
      scrub: true,
      snap: {
        snapTo: progress => Math.round(progress * detailsTransitions) / detailsTransitions,
        duration: { min: 0.2, max: 0.45 },
        delay: 0.1,
        ease: "power2.out",
        inertia: false
      },
      anticipatePin: 1,
      invalidateOnRefresh: true
    }
  });

  for (let i = 1; i <= detailsTransitions; i++) {
    detailsTimeline
      .to(detailsCards[i - 1], {
        autoAlpha: 0,
        yPercent: -12,
        duration: 1
      }, i - 1)
      .fromTo(detailsCards[i], {
        autoAlpha: 0,
        yPercent: 14
      }, {
        autoAlpha: 1,
        yPercent: 0,
        duration: 1
      }, i - 1);
  }
}
const titleHover = gsap.timeline({ paused: true });
if (!reduce) {
  titleHover.to(allChars, {
    color: "#ff5c2e",
    y: -5,
    scale: 1.035,
    textShadow: "0 2px 12px rgba(255,92,46,.3)",
    duration: 0.3,
    stagger: { each: 0.018, from: "center" },
    ease: "power2.out"
  }, 0).to(titleHoverRule, {
    scaleX: 1,
    duration: 0.5,
    ease: "power2.out"
  }, 0);
}

const playTitleHover = () => {
  if (tl.progress() === 1) titleHover.play();
};
const reverseTitleHover = () => titleHover.reverse();

heroTitle.addEventListener("pointerenter", playTitleHover);
heroTitle.addEventListener("pointerleave", reverseTitleHover);
heroTitle.addEventListener("focusin", playTitleHover);
heroTitle.addEventListener("focusout", event => {
  if (!heroTitle.contains(event.relatedTarget)) reverseTitleHover();
});

tl.eventCallback("onComplete", () => {
  docEl.classList.remove("is-locked");
  initScroll();
  initDetailsScroll();
  initPracticalTitleScroll();
  requestAnimationFrame(() => ScrollTrigger.refresh());

  if (reduce || window.innerWidth <= 768) setScrollCueVisible(true);
  if (heroTitle.matches(":hover")) titleHover.play();
});

document.fonts.ready.then(() => {
  if (reduce) {
    tl.progress(1);
    gsap.set(heroTitle, { clearProps: "transform,filter" });
    docEl.classList.remove("is-locked");
  } else {
    tl.play();
  }
});