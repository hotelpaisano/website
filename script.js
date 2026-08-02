const galleryTrack = document.querySelector(".gallery-track");
const galleryCaption = document.querySelector(".gallery-caption");
const galleryCaptionLayers = [...document.querySelectorAll(".gallery-caption__text")];
const galleryCards = [...document.querySelectorAll(".gallery-card")];
const galleryItems = [...document.querySelectorAll(".gallery-item")];
const hoverCapable = window.matchMedia("(hover: hover)");
const compactViewport = window.matchMedia("(max-width: 900px)");
let lastPointerType = null;
let activeCard = null;
let activeCaptionLayer = 0;
let mobileDragPointerId = null;
let mobileDragStartX = 0;
let mobileDragStartY = 0;
let mobileDragStartScrollLeft = 0;
let mobileDragDetected = false;
let suppressMobileClickUntil = 0;

function getHoverOriginX(card, event) {
  const cardRect = card.getBoundingClientRect();
  return `${event.clientX - cardRect.left}px`;
}

function updateHoverOrigin(card, event) {
  card.style.setProperty("--hover-origin-x", getHoverOriginX(card, event));
}

function centerHoverOrigin(card) {
  card.style.setProperty("--hover-origin-x", "50%");
}

function getCardAtPointer(event) {
  const trackRect = galleryTrack.getBoundingClientRect();
  const pointerX = event.clientX;

  if (pointerX < trackRect.left || pointerX > trackRect.right) {
    return null;
  }

  const itemRects = galleryItems.map((item, index) => ({
    card: galleryCards[index],
    rect: item.getBoundingClientRect()
  }));
  const firstRect = itemRects[0]?.rect;
  const lastRect = itemRects.at(-1)?.rect;

  if (!firstRect || !lastRect || pointerX < firstRect.left || pointerX > lastRect.right) {
    return null;
  }

  if (activeCard) {
    const activeIndex = galleryCards.indexOf(activeCard);
    const activeRect = activeCard.getBoundingClientRect();
    const previousRect = galleryCards[activeIndex - 1]?.getBoundingClientRect();
    const nextRect = galleryCards[activeIndex + 1]?.getBoundingClientRect();
    const inPreviousGap = previousRect && pointerX > previousRect.right && pointerX < activeRect.left;
    const inNextGap = nextRect && pointerX > activeRect.right && pointerX < nextRect.left;

    if (inPreviousGap || inNextGap) return activeCard;
  }

  return itemRects.find(({ rect }) => pointerX >= rect.left && pointerX <= rect.right)?.card || null;
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

function setActiveCard(card) {
  if (activeCard === card) return;

  activeCard = card;

  galleryCards.forEach((item) => {
    const active = item === card;
    if (!active) centerHoverOrigin(item);
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-expanded", String(active));
  });

  galleryTrack.classList.toggle("has-active", Boolean(card));
  updateGalleryCaption(card);
}

function canHoverGallery() {
  return hoverCapable.matches && !compactViewport.matches;
}

function syncDesktopGalleryHover(event) {
  if (!canHoverGallery()) return;

  const card = getCardAtPointer(event);
  if (!card) return;

  updateHoverOrigin(card, event);
  setActiveCard(card);
}

galleryCards.forEach((card) => {
  card.addEventListener("pointerdown", (event) => {
    lastPointerType = event.pointerType;
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
      centerHoverOrigin(card);
      setActiveCard(card.classList.contains("is-active") ? null : card);
    }
    lastPointerType = null;
  });
});

galleryTrack.addEventListener("pointerenter", syncDesktopGalleryHover);

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

  syncDesktopGalleryHover(event);
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
  setActiveCard(null);
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
