////////////////////////////////
// Showcase section scrolling //
////////////////////////////////

let showcaseElement;
let scrollingRight = true;
let positionCumulativeError = 0;
const autoScrollSpeed = 20; // px/sec
const manualScrollSpeed = 1000;
const bounceMargin = 5; // px

let mouseRelativePositionX = null

let lastFrameDate = null;
let deltaTime = 0.0; // seconds

function start() {
  console.log("starting");

  showcaseElement = document.querySelector("section.showcase");

  console.log(showcaseElement);
  
  lastFrameDate = new Date();
  window.requestAnimationFrame(update);

  showcaseElement.addEventListener("mousemove", onMouseMove);
  showcaseElement.addEventListener("mouseenter", onMouseEnter);
  showcaseElement.addEventListener("mouseleave", onMouseLeave);
}

function onMouseMove(e) {
  mouseRelativePositionX = e.clientX / showcaseElement.clientWidth
}

function onMouseEnter(e) {
  mouseRelativePositionX = e.clientX / showcaseElement.clientWidth
}

function onMouseLeave(e) {
  mouseRelativePositionX = null
}

function update() {
  const now = new Date();
  deltaTime = (now - lastFrameDate) / 1000; // ms to seconds

  if (mouseRelativePositionX != null) {
    if (showcaseElement.clientWidth > 950 /* breakpoint mobile */) {
      // desktop only
      animateCursorIn();
    }
  } else {
    animateCursorOut();
  }

  lastFrameDate = now;
  window.requestAnimationFrame(update);
}

function animateCursorOut() {
  const position = showcaseElement.scrollLeft;

  // bounce right
  if (position + showcaseElement.clientWidth + bounceMargin
    >= showcaseElement.scrollWidth
  ) {
    scrollingRight = false;
  }

  // bounce left
  if (position - bounceMargin <= 0) {
    scrollingRight = true;
  }

  // scroll
  const sign = scrollingRight ? 1 : -1;
  scrollAtSpeed(sign * autoScrollSpeed);
}

function animateCursorIn() {
  if (mouseRelativePositionX <= 0.25) {
    scrollAtSpeed(lerp(
      -manualScrollSpeed,
      0,
      mouseRelativePositionX / 0.25
    ))
  }

  if (mouseRelativePositionX >= 0.75) {
    scrollAtSpeed(lerp(
      0,
      manualScrollSpeed,
      (mouseRelativePositionX - 0.75) / 0.25
    ))
  }
}

function lerp(a, b, t) {
  return (1 - t) * a + t * b;
}

function scrollAtSpeed(speed) {
  const position = showcaseElement.scrollLeft;
  let newPositionFloat = position + speed * deltaTime + positionCumulativeError;
  let newPositionInt = Math.floor(newPositionFloat);
  positionCumulativeError = newPositionFloat - newPositionInt;
  showcaseElement.scrollTo(newPositionInt, 0);
}

window.addEventListener("load", start);
