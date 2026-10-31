gsap.registerPlugin(ScrollTrigger);
// Restore scroll only on reload as it feels kinda wrong on back and frward navigation
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const docEl = document.documentElement;
const scrollCue = document.querySelector(".scroll-cue");
const isNarrowLayout = () => window.innerWidth <= 768;
const isOverviewFlowLayout = isNarrowLayout;
const isStackedLayout = isNarrowLayout;
const scrollPositionKey = "neural-networks-scroll-y";
const navigationEntry = performance.getEntriesByType("navigation")[0];
let restoredScrollY = 0;
try {
  const storedScrollY = Number(sessionStorage.getItem(scrollPositionKey));
  if (Number.isFinite(storedScrollY) && storedScrollY > 0) restoredScrollY = storedScrollY;
} catch (error) {
  console.warn("Could not read the saved scroll position:", error);
}
const restoreScrollOnReload = navigationEntry?.type === "reload" && restoredScrollY > 0;
if (restoreScrollOnReload && "scrollRestoration" in history) history.scrollRestoration = "manual";

let scrollPositionFrame = 0;
let scrollPositionTracking = false;
function persistScrollPosition(){
  scrollPositionFrame = 0;
  if (!scrollPositionTracking) return;
  try {
    sessionStorage.setItem(scrollPositionKey, String(window.scrollY || docEl.scrollTop));
  } catch (error) {
    console.warn("Could not save the scroll position:", error);
  }
}

function scheduleScrollPositionSave(){
  if (!scrollPositionFrame) scrollPositionFrame = requestAnimationFrame(persistScrollPosition);
}

window.addEventListener("scroll", scheduleScrollPositionSave, { passive: true });
window.addEventListener("pagehide", () => {
  if (scrollPositionFrame) cancelAnimationFrame(scrollPositionFrame);
  persistScrollPosition();
});

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
let responsiveAnimationsReady = false;
let previousOverviewFlowLayout = null;
let previousStackedLayout = null;
let responsiveResizeTimer = 0;

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
const wikipediaSvg = wikipediaLink.querySelector("svg");

gsap.set(".info__body", { autoAlpha: 0, y: 14 });
gsap.set(wikipediaLink, { autoAlpha: 0, y: 12, rotation: -12, transformOrigin: "50% 50%" });
gsap.set(wikipediaLabel, { opacity: 0, x: 8, yPercent: -50 });

const wikipediaLabelTween = gsap.to(wikipediaLabel, {
  opacity: 1,
  x: 0,
  duration: reduce ? 0 : 0.28,
  ease: "power2.out",
  paused: true
});

const wikipediaSvgTween = gsap.to(wikipediaSvg, {
  scale: 1.2,
  rotation: -6,
  filter: "drop-shadow(0 0 8px rgba(255,92,46,.5))",
  duration: reduce ? 0 : 0.35,
  ease: "power2.out",
  paused: true
});

const wikipediaLinkTween = gsap.to(wikipediaLink, {
  y: -3,
  color: "#ff5c2e",
  duration: reduce ? 0 : 0.3,
  ease: "power2.out",
  paused: true
});

function playWikiHover() {
  wikipediaLabelTween.play();
  wikipediaSvgTween.play();
  wikipediaLinkTween.play();
}

function reverseWikiHover() {
  wikipediaLabelTween.reverse();
  wikipediaSvgTween.reverse();
  wikipediaLinkTween.reverse();
}

wikipediaLink.addEventListener("mouseenter", playWikiHover);
wikipediaLink.addEventListener("mouseleave", reverseWikiHover);
wikipediaLink.addEventListener("focusin", playWikiHover);
wikipediaLink.addEventListener("focusout", event => {
  if (!wikipediaLink.contains(event.relatedTarget)) reverseWikiHover();
});

const logoRow = document.querySelector(".conclusion__logo-row");
if (logoRow) {
  const logos = logoRow.querySelectorAll(".conclusion__logo");
  const cross = logoRow.querySelector(".conclusion__cross");

  logos.forEach((logo, i) => {
    const img = logo.querySelector("img");
    const isLeft = i === 0;

    const hoverTl = gsap.timeline({ paused: true });

    hoverTl
      .to(logo, {
        y: -8,
        scale: 1.12,
        rotation: isLeft ? -6 : 6,
        duration: 0.45,
        ease: "power3.out"
      }, 0)
      .to(img, {
        filter: "drop-shadow(0 0 14px rgba(255,92,46,.55))",
        duration: 0.4,
        ease: "power2.out"
      }, 0)
      .to(logo, {
        y: -4,
        scale: 1.08,
        duration: 0.6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1
      }, 0.45);

    logo.addEventListener("mouseenter", () => {
      logo.classList.add("is-hovered");
      hoverTl.play();
    });

    logo.addEventListener("mouseleave", () => {
      logo.classList.remove("is-hovered");
      hoverTl.pause(0);
      gsap.to(logo, {
        y: 0,
        scale: 1,
        rotation: 0,
        duration: 0.5,
        ease: "power3.out"
      });
      gsap.to(img, {
        filter: "none",
        duration: 0.4,
        ease: "power2.out"
      });
    });
  });

  if (cross) {
    gsap.set(cross, { transformOrigin: "50% 50%" });
  }
}

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
  x: () => isNarrowLayout() ? 0 : window.innerWidth * 0.05 - heroTitle.getBoundingClientRect().left,
  y: () => isNarrowLayout() ? 0 : window.innerHeight / 2 - heroTitle.getBoundingClientRect().top - heroTitle.offsetHeight * 0.55 / 2,
  scale: () => isNarrowLayout() ? 1 : 0.55,
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
  const atPageEnd = window.scrollY + window.innerHeight >= docEl.scrollHeight - 1;
  if (atPageEnd) activeIndex = spyTargets.length - 1;
  else {
    spyTargets.forEach((target, index) => {
      if (target && target.getBoundingClientRect().top <= 1) activeIndex = index;
    });
  }
  setSpyActive(activeIndex);
}

spyLinks.forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    if (link.getAttribute("href") === "#overview" && isNarrowLayout()) {
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

const practicalSection = document.querySelector(".mnist-demo");
const detailsSection = document.querySelector(".details");
const detailsStage = detailsSection.querySelector(".details__stage");
const detailsCards = Array.from(detailsStage.querySelectorAll(".details__card"));
const detailsTransitions = detailsCards.length - 1;
let detailsTimeline;
let overviewTimeline;
let overviewCueTrigger;
let practicalTitleTimeline;
const mechanicsSection = document.querySelector(".mechanics");
const mechanicsStage = mechanicsSection.querySelector(".mechanics__stage");
const mechanicsCards = Array.from(mechanicsStage.querySelectorAll(".mechanics__card"));
const mechanicsTransitions = mechanicsCards.length - 1;
let mechanicsTimeline;
const applicationSection = document.querySelector(".application");
const conclusionSection = document.querySelector(".conclusion");
const applicationIntro = applicationSection.querySelector(".application__intro");
const applicationStage = applicationSection.querySelector(".application__stage");
const applicationCards = Array.from(applicationStage.querySelectorAll(".application__card"));
const applicationProgressLine = applicationStage.querySelector(".application__rail-progress");
const conclusionMarks = conclusionSection.querySelector(".conclusion__marks");
const conclusionClosingTitle = conclusionSection.querySelector(".conclusion__closing-title");
const conclusionLogo = conclusionSection.querySelector(".conclusion__logo");
let applicationIntroAnimation;
let applicationProgressAnimation;
let applicationCardAnimations = [];
let applicationTitleTimeline;
let conclusionTitleAnimation;

const overviewTitleX = () => heroTitle.offsetWidth / 2 - window.innerWidth * 0.45;
const overviewTitleYIn = () => heroTitle.offsetHeight * 0.225;
const overviewTitleYOut = () => heroTitle.offsetHeight / 2 - window.innerHeight * 0.44;

function initScroll(){
  if (overviewTimeline || reduce || isOverviewFlowLayout()) return;

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
  const infoRowGap = getComputedStyle(infoEl).rowGap;

  overviewTimeline = gsap.timeline({
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


  overviewTimeline.fromTo(heroTitle,
    { x: overviewTitleX, y: overviewTitleYIn, scale: 0.55 },
    { x: overviewTitleX, y: overviewTitleYOut, scale: 0.30, duration: 1, ease: "power1.inOut" },
    0
  );

  /*  the description slides from the right column to the centre as it looks so cool */
  overviewTimeline.fromTo(infoEl,
    {
      left:   () => getComputedStyle(infoEl).left,
      right:  () => getComputedStyle(infoEl).right,
      top:    () => getComputedStyle(infoEl).top,
      bottom: () => getComputedStyle(infoEl).bottom,
      rowGap: infoRowGap
    },
    {
      left: infoSide,
      right: infoSide,
      top: infoTop,
      bottom: infoTop,
      rowGap: () => infoRowGap,
      duration: 1
    },
    0
  );

  overviewCueTrigger = ScrollTrigger.create({
    trigger: scrollSpace,
    start: "bottom 10%",
    endTrigger: practicalSection,
    end: "top 85%",
    onEnter: () => setScrollCueVisible(true),
    onEnterBack: () => setScrollCueVisible(true),
    onLeave: () => setScrollCueVisible(false),
    onLeaveBack: () => setScrollCueVisible(false)
  });
}

function initPracticalTitleScroll(){
  if (practicalTitleTimeline || reduce || !practicalSection) return;
  if (isNarrowLayout()) return;
  const scrollTrigger = {
    trigger: practicalSection,
    start: "top bottom",
    end: "bottom top",
    invalidateOnRefresh: true
  };

  const cornerMarginX = () => Math.max(16, window.innerWidth * 0.03);
  const cornerMarginY = () => Math.max(14, window.innerHeight * 0.02);
  const cornerScale = () => Math.min(
    0.2,
    (window.innerWidth - cornerMarginX() * 2) * 0.34 / heroTitle.offsetWidth,
    Math.min(64, window.innerHeight * 0.075) / heroTitle.offsetHeight
  );
  const cornerX = () => cornerMarginX() - (window.innerWidth - heroTitle.offsetWidth) / 2;
  const cornerY = () => cornerMarginY() - (window.innerHeight - heroTitle.offsetHeight) / 2;

  practicalTitleTimeline = gsap.timeline({
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

function initApplicationScroll(){
  if (!applicationIntroAnimation && !reduce) {
    applicationIntroAnimation = gsap.from(applicationIntro.children, {
      y: 30,
      opacity: 0,
      duration: 0.8,
      stagger: 0.12,
      ease: "power2.out",
      scrollTrigger: {
        trigger: applicationIntro,
        start: "top 78%",
        toggleActions: "play none none reverse"
      }
    });
  }

  if (reduce || applicationCards.length === 0) return;

  if (!applicationProgressAnimation) {
    applicationProgressAnimation = gsap.fromTo(applicationProgressLine, {
      scaleY: 0,
      transformOrigin: "top center"
    }, {
      scaleY: 1,
      ease: "none",
      scrollTrigger: {
        trigger: applicationStage,
        start: "top 70%",
        end: "bottom 40%",
        scrub: true,
        invalidateOnRefresh: true
      }
    });
  }

  if (!applicationCardAnimations.length) {
    applicationCards.forEach(card => {
      applicationCardAnimations.push(gsap.from(card, {
        y: 28,
        opacity: 0,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: {
          trigger: card,
          start: "top 82%",
          toggleActions: "play none none reverse"
        }
      }));
    });
  }
}

function initApplicationTitleScroll(){
  if (applicationTitleTimeline || conclusionTitleAnimation) return;

  if (isNarrowLayout()) {
    if (reduce) return;
    conclusionTitleAnimation = gsap.fromTo(conclusionClosingTitle, {
      y: 24,
      autoAlpha: 0
    }, {
      y: 0,
      autoAlpha: 1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: conclusionMarks,
        start: "top 75%",
        end: "top 48%",
        scrub: 0.6,
        invalidateOnRefresh: true
      }
    });
    return;
  }

  if (reduce || !detailsTimeline || detailsTransitions < 1) return;

  const cornerMarginX = () => Math.max(12, window.innerWidth * 0.015);
  const cornerMarginY = () => Math.max(14, window.innerHeight * 0.02);
  const applicationContentRight = () => {
    const reservedSpace = Math.min(84, Math.max(32, window.innerWidth * 0.08));
    const introRight = (window.innerWidth + Math.min(window.innerWidth, 1000)) / 2 -
      window.innerWidth * 0.06 - reservedSpace;
    const cardsRight = (window.innerWidth + Math.min(window.innerWidth, 1200)) / 2 -
      window.innerWidth * 0.06 - reservedSpace;
    return Math.max(introRight, cardsRight);
  };
  const cornerScale = () => Math.min(
    0.16,
    (window.innerWidth - cornerMarginX() * 2) * 0.28 / heroTitle.offsetWidth,
    Math.min(44, window.innerHeight * 0.06) / heroTitle.offsetHeight,
    (window.innerWidth - cornerMarginX() - applicationContentRight() - 6) /
      (heroTitle.offsetWidth * 1.14)
  );
  const cornerX = () => window.innerWidth - cornerMarginX() -
    heroTitle.offsetWidth * cornerScale() -
    (window.innerWidth - heroTitle.offsetWidth) / 2;
  const cornerY = () => cornerMarginY() -
    (window.innerHeight - heroTitle.offsetHeight) / 2;

  applicationTitleTimeline = gsap.fromTo(heroTitle, {
    x: overviewTitleX,
    y: overviewTitleYOut,
    scale: 0.30
  }, {
    x: cornerX,
    y: cornerY,
    scale: cornerScale,
    ease: "power2.inOut",
    immediateRender: false,
    scrollTrigger: {
      trigger: detailsSection,
      start: () => detailsTimeline.scrollTrigger.end - window.innerHeight,
      end: () => detailsTimeline.scrollTrigger.end,
      scrub: 0.8,
      invalidateOnRefresh: true
    }
  });

  const closingScale = () => Math.min(
    0.26,
    (window.innerWidth - 48) / heroTitle.offsetWidth
  );
  const closingX = () =>
    window.innerWidth / 2 - heroTitle.offsetWidth * closingScale() / 2 -
    (window.innerWidth - heroTitle.offsetWidth) / 2;
  const closingY = () => {
    const logoHeight = conclusionLogo.getBoundingClientRect().height;
    const titleHeight = heroTitle.offsetHeight * closingScale();
    const gap = Math.max(20, Math.min(40, window.innerHeight * 0.04));
    const titleTop = window.innerHeight / 2 - logoHeight / 2 - gap - titleHeight;
    return titleTop - (window.innerHeight - heroTitle.offsetHeight) / 2;
  };

  conclusionTitleAnimation = gsap.fromTo(heroTitle, {
    x: cornerX,
    y: cornerY,
    scale: cornerScale,
    autoAlpha: 1
  }, {
    x: closingX,
    y: closingY,
    scale: closingScale,
    autoAlpha: 1,
    ease: "power2.inOut",
    immediateRender: false,
    scrollTrigger: {
      trigger: conclusionMarks,
      start: "top bottom",
      end: "bottom bottom",
      scrub: 0.8,
      invalidateOnRefresh: true
    }
  });
}

function initDetailsScroll(){
  if (detailsTimeline || reduce || isStackedLayout() || detailsCards.length < 2) return;

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

function initMechanicsScroll(){
  if (mechanicsTimeline || reduce || isStackedLayout() || mechanicsCards.length < 2) return;

  gsap.set(mechanicsCards, { autoAlpha: 0, xPercent: 14 });
  gsap.set(mechanicsCards[0], { autoAlpha: 1, xPercent: 0 });

  mechanicsTimeline = gsap.timeline({
    defaults: { ease: "power2.inOut" },
    scrollTrigger: {
      trigger: mechanicsSection,
      pin: mechanicsStage,
      pinSpacing: true,
      start: "top top",
      end: () => "+=" + Math.round(mechanicsTransitions * window.innerHeight),
      scrub: true,
      snap: {
        snapTo: progress => Math.round(progress * mechanicsTransitions) / mechanicsTransitions,
        duration: { min: 0.25, max: 0.5 },
        delay: 0.08,
        ease: "power2.out",
        inertia: false
      },
      anticipatePin: 1,
      invalidateOnRefresh: true
    }
  });

  for (let i = 1; i <= mechanicsTransitions; i++) {
    mechanicsTimeline
      .to(mechanicsCards[i - 1], {
        autoAlpha: 0,
        xPercent: -12,
        duration: 1
      }, i - 1)
      .fromTo(mechanicsCards[i], {
        autoAlpha: 0,
        xPercent: 14
      }, {
        autoAlpha: 1,
        xPercent: 0,
        duration: 1
      }, i - 1);
  }
}

function killScrollTimeline(timeline){
  if (!timeline) return;
  if (timeline.scrollTrigger) timeline.scrollTrigger.kill();
  timeline.kill();
}

function resetOverviewAnimations(){
  killScrollTimeline(applicationTitleTimeline);
  applicationTitleTimeline = null;
  killScrollTimeline(conclusionTitleAnimation);
  conclusionTitleAnimation = null;
  if (overviewCueTrigger) {
    overviewCueTrigger.kill();
    overviewCueTrigger = null;
  }
  killScrollTimeline(overviewTimeline);
  overviewTimeline = null;
  killScrollTimeline(practicalTitleTimeline);
  practicalTitleTimeline = null;
  gsap.set(heroTitle, { clearProps: "transform" });
  gsap.set(".info", { clearProps: "left,right,top,bottom,transform" });
  gsap.set([".info__lede", ".info__body", ".info__body > *"], {
    clearProps: "opacity,visibility,transform"
  });
  gsap.set(wikipediaLink, { clearProps: "opacity,visibility,transform" });
}

function resetSectionAnimations(){
  killScrollTimeline(detailsTimeline);
  detailsTimeline = null;
  gsap.set(detailsCards, { clearProps: "all" });

  killScrollTimeline(mechanicsTimeline);
  mechanicsTimeline = null;
  gsap.set(mechanicsCards, { clearProps: "all" });

  killScrollTimeline(applicationProgressAnimation);
  applicationProgressAnimation = null;
  applicationCardAnimations.forEach(killScrollTimeline);
  applicationCardAnimations = [];
  gsap.set(applicationCards, { clearProps: "opacity,transform" });
  gsap.set(applicationProgressLine, { clearProps: "transform" });
}

function placeHeroForDesktop(){
  const bounds = heroTitle.getBoundingClientRect();
  gsap.set(heroTitle, {
    x: window.innerWidth * 0.05 - bounds.left,
    y: window.innerHeight / 2 - bounds.top - heroTitle.offsetHeight * 0.55 / 2,
    scale: 0.55,
    transformOrigin: "top left"
  });
}

function configureResponsiveAnimations(){
  if (!responsiveAnimationsReady) return;

  const nextOverviewFlowLayout = isOverviewFlowLayout();
  const nextStackedLayout = isStackedLayout();

  if (previousOverviewFlowLayout !== null &&
      previousOverviewFlowLayout !== nextOverviewFlowLayout) {
    resetOverviewAnimations();
    if (nextOverviewFlowLayout) {
      setScrollCueVisible(true);
      if (isNarrowLayout()) gsap.set(heroTitle, { clearProps: "transform" });
      else placeHeroForDesktop();
    } else {
      setScrollCueVisible(false);
      placeHeroForDesktop();
    }
  }

  if (previousStackedLayout !== null &&
      previousStackedLayout !== nextStackedLayout) {
    resetSectionAnimations();
  }

  previousOverviewFlowLayout = nextOverviewFlowLayout;
  previousStackedLayout = nextStackedLayout;

  initScroll();
  initPracticalTitleScroll();
  initDetailsScroll();
  initMechanicsScroll();
  initApplicationScroll();
  initApplicationTitleScroll();

  requestAnimationFrame(() => {
    ScrollTrigger.refresh();
    spyUpdate();
    scheduleScrollbarUpdate();
  });
}

window.addEventListener("resize", () => {
  if (!responsiveAnimationsReady) return;
  window.clearTimeout(responsiveResizeTimer);
  responsiveResizeTimer = window.setTimeout(configureResponsiveAnimations, 160);
});

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
  scrollPositionTracking = true;
  docEl.classList.remove("is-locked");
  responsiveAnimationsReady = true;
  configureResponsiveAnimations();
  requestAnimationFrame(() => {
    if (restoreScrollOnReload) {
      const maxScroll = Math.max(0, docEl.scrollHeight - window.innerHeight);
      window.scrollTo(0, Math.min(restoredScrollY, maxScroll));
      ScrollTrigger.update();
      spyUpdate();
      scheduleScrollbarUpdate();
    }
  });

  if (reduce || isOverviewFlowLayout()) setScrollCueVisible(true);
  if (heroTitle.matches(":hover")) titleHover.play();
});

document.fonts.ready.then(() => {
  if (restoreScrollOnReload) {
    tl.progress(1);
  } else if (reduce) {
    tl.progress(1);
    gsap.set(heroTitle, { clearProps: "transform,filter" });
    docEl.classList.remove("is-locked");
  } else {
    tl.play();
  }
});