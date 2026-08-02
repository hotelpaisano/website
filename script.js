const galleryTrack = document.querySelector(".gallery-track");
const galleryCaption = document.querySelector(".gallery-caption");
const galleryCaptionLayers = [...document.querySelectorAll(".gallery-caption__text")];
const galleryCards = [...document.querySelectorAll(".gallery-card")];
const hoverCapable = window.matchMedia("(hover: hover)");
const compactViewport = window.matchMedia("(max-width: 900px)");
let lastPointerType = null;
let activeCard = null;
let activeCaptionLayer = 0;
let switchingResetFrame = 0;
let enteringCard = null;
let enteringCleanupTimer = 0;
let returningCard = null;
let returningCleanupTimer = 0;
let mobileDragPointerId = null;
let mobileDragStartX = 0;
let mobileDragStartY = 0;
let mobileDragStartScrollLeft = 0;
let mobileDragDetected = false;
let suppressMobileClickUntil = 0;

function getHoverOriginX(card, event) {
  const cardRect = card.getBoundingClientRect();
  const x = Math.min(Math.max(event.clientX - cardRect.left, 0), cardRect.width);
  return `${x}px`;
}

function updateHoverOrigin(card, event) {
  if (returningCard === card) cancelReturningCard();
  card.style.setProperty("--hover-origin-x", getHoverOriginX(card, event));
}

function centerHoverOrigin(card) {
  card.style.setProperty("--hover-origin-x", "50%");
}

function cancelEnteringCard() {
  if (enteringCleanupTimer) {
    window.clearTimeout(enteringCleanupTimer);
    enteringCleanupTimer = 0;
  }

  if (enteringCard) {
    enteringCard.classList.remove("is-entering");
    enteringCard = null;
  }
}

function prepareEnteringCard(card) {
  cancelEnteringCard();
  centerHoverOrigin(card);
  enteringCard = card;
  card.classList.add("is-entering");
  void card.offsetWidth;
}

function scheduleEnteringCleanup(card) {
  enteringCleanupTimer = window.setTimeout(() => {
    card.classList.remove("is-entering");
    if (enteringCard === card) enteringCard = null;
    enteringCleanupTimer = 0;
  }, 460);
}

function cancelReturningCard() {
  if (returningCleanupTimer) {
    window.clearTimeout(returningCleanupTimer);
    returningCleanupTimer = 0;
  }

  if (returningCard) {
    returningCard.classList.remove("is-returning");
    returningCard = null;
  }
}

function prepareReturningCard(card) {
  cancelReturningCard();
  card.classList.add("is-returning");
  cancelEnteringCard();
  returningCard = card;
  void card.offsetWidth;
  centerHoverOrigin(card);
}

function scheduleReturningCleanup(card) {
  returningCleanupTimer = window.setTimeout(() => {
    card.classList.remove("is-returning");
    if (returningCard === card) returningCard = null;
    returningCleanupTimer = 0;
  }, 460);
}

function updateGalleryCaption(card) {
  const caption = card?.dataset.caption || "";

  if (!caption) {
    galleryCaption.classList.remove("is-visible");
    galleryCaptionLayers[activeCaptionLayer].classList.remove("is-current");
    galleryCaptionLayers[activeCaptionLayer].setAttribute("aria-hidden", "true");
    galleryCaption.setAttribute("aria-hidden", "true");
    return;
  }

  const nextLayer = activeCaptionLayer === 0 ? 1 : 0;
  const currentLayer = galleryCaptionLayers[activeCaptionLayer];
  const incomingLayer = galleryCaptionLayers[nextLayer];

  incomingLayer.textContent = caption;
  currentLayer.classList.remove("is-current");
  currentLayer.setAttribute("aria-hidden", "true");
  incomingLayer.classList.add("is-current");
  incomingLayer.setAttribute("aria-hidden", "false");
  activeCaptionLayer = nextLayer;
  galleryCaption.classList.add("is-visible");
  galleryCaption.setAttribute("aria-hidden", "false");
}

function setActiveCard(card, { entryOriginX = null } = {}) {
  if (activeCard === card) return;

  const previousCard = activeCard;
  const switching = Boolean(previousCard && card);
  const leaving = Boolean(previousCard && !card);
  const entering = Boolean(!previousCard && card && entryOriginX !== null);

  if (switchingResetFrame) {
    window.cancelAnimationFrame(switchingResetFrame);
    switchingResetFrame = 0;
  }

  if (switching) {
    galleryTrack.classList.add("is-switching");
    void galleryTrack.offsetWidth;
    cancelEnteringCard();
  } else {
    galleryTrack.classList.remove("is-switching");
  }

  if (card) cancelReturningCard();
  if (entering) prepareEnteringCard(card);
  if (leaving) prepareReturningCard(previousCard);

  activeCard = card;

  galleryCards.forEach((item) => {
    const active = item === card;
    if (!active) centerHoverOrigin(item);
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-expanded", String(active));
  });

  if (entering) card.style.setProperty("--hover-origin-x", entryOriginX);

  galleryTrack.classList.toggle("has-active", Boolean(card));
  updateGalleryCaption(card);

  if (switching) {
    void galleryTrack.offsetWidth;
    switchingResetFrame = window.requestAnimationFrame(() => {
      galleryTrack.classList.remove("is-switching");
      switchingResetFrame = 0;
    });
  }

  if (entering) scheduleEnteringCleanup(card);
  if (leaving) scheduleReturningCleanup(previousCard);
}

function canHoverGallery() {
  return hoverCapable.matches && !compactViewport.matches;
}

galleryCards.forEach((card) => {
  card.addEventListener("pointerdown", (event) => {
    lastPointerType = event.pointerType;
  });

  card.addEventListener("pointerenter", (event) => {
    if (!canHoverGallery()) return;

    if (activeCard) {
      updateHoverOrigin(card, event);
      setActiveCard(card);
    } else {
      setActiveCard(card, { entryOriginX: getHoverOriginX(card, event) });
    }
  });

  card.addEventListener("pointerleave", (event) => {
    const nextCard = event.relatedTarget?.closest?.(".gallery-card");
    if (nextCard && galleryCards.includes(nextCard)) return;
    if (event.relatedTarget?.nodeType && galleryTrack.contains(event.relatedTarget)) return;

    if (canHoverGallery()) setActiveCard(null);
  });

  card.addEventListener("focus", () => {
    if (!compactViewport.matches && lastPointerType !== "mouse" && lastPointerType !== "touch") {
      centerHoverOrigin(card);
      setActiveCard(card);
    }
  });

  card.addEventListener("blur", (event) => {
    if (!compactViewport.matches && !card.contains(event.relatedTarget)) setActiveCard(null);
  });

  card.addEventListener("click", (event) => {
    if (compactViewport.matches) {
      if (Date.now() < suppressMobileClickUntil) {
        event.preventDefault();
        suppressMobileClickUntil = 0;
        lastPointerType = null;
        return;
      }

      centerHoverOrigin(card);
      setActiveCard(card.classList.contains("is-active") ? null : card);
    } else if (hoverCapable.matches && lastPointerType === "mouse") {
      setActiveCard(card);
    } else {
      setActiveCard(card.classList.contains("is-active") ? null : card);
    }
    lastPointerType = null;
  });
});

galleryTrack.addEventListener("pointerdown", (event) => {
  if (!compactViewport.matches) return;

  mobileDragPointerId = event.pointerId;
  mobileDragStartX = event.clientX;
  mobileDragStartY = event.clientY;
  mobileDragStartScrollLeft = galleryTrack.scrollLeft;
  mobileDragDetected = false;
  suppressMobileClickUntil = 0;
});

galleryTrack.addEventListener("pointermove", (event) => {
  if (compactViewport.matches && event.pointerId === mobileDragPointerId) {
    const horizontalTravel = Math.abs(event.clientX - mobileDragStartX);
    const verticalTravel = Math.abs(event.clientY - mobileDragStartY);
    const scrollTravel = Math.abs(galleryTrack.scrollLeft - mobileDragStartScrollLeft);

    if (horizontalTravel > 8 || verticalTravel > 8 || scrollTravel > 4) {
      mobileDragDetected = true;
    }
  }

  if (!canHoverGallery()) return;

  const card = event.target?.closest?.(".gallery-card");
  if (card && galleryCards.includes(card)) {
    if (activeCard) {
      updateHoverOrigin(card, event);
      setActiveCard(card);
    } else {
      setActiveCard(card, { entryOriginX: getHoverOriginX(card, event) });
    }
  } else if (activeCard) {
    updateHoverOrigin(activeCard, event);
  }
});

function finishMobileDrag(event) {
  if (event.pointerId !== mobileDragPointerId) return;
  if (mobileDragDetected) suppressMobileClickUntil = Date.now() + 350;
  mobileDragPointerId = null;
}

galleryTrack.addEventListener("pointerup", finishMobileDrag);
galleryTrack.addEventListener("pointercancel", finishMobileDrag);

galleryTrack.addEventListener("scroll", () => {
  if (mobileDragPointerId !== null) mobileDragDetected = true;
});

galleryTrack.addEventListener("pointerleave", () => {
  if (canHoverGallery()) setActiveCard(null);
});

window.addEventListener("resize", () => {
  if (compactViewport.matches) setActiveCard(null);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setActiveCard(null);
  }
});

document.addEventListener("pointerdown", (event) => {
  if (compactViewport.matches && activeCard && !galleryTrack.contains(event.target)) {
    setActiveCard(null);
  }
});
