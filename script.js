const galleryTrack = document.querySelector(".gallery-track");
const galleryStage = document.querySelector(".gallery-stage");
const galleryCards = [...document.querySelectorAll(".gallery-card")];
const hoverCapable = window.matchMedia("(hover: hover)");
const compactViewport = window.matchMedia("(max-width: 900px)");
let lastPointerType = null;
let hoverSuppressedCard = null;

const galleryPreview = document.createElement("span");
galleryPreview.className = "gallery-preview";
galleryPreview.setAttribute("aria-hidden", "true");
galleryPreview.innerHTML = `
  <span class="gallery-preview__media">
    <img alt="" />
  </span>
`;
galleryStage.append(galleryPreview);

function updateGalleryPreview(card = galleryCards.find((item) => item.classList.contains("is-active"))) {
  if (!card || compactViewport.matches) {
    galleryPreview.classList.remove("is-visible");
    return;
  }

  const stageRect = galleryStage.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  const zoom = Number.parseFloat(getComputedStyle(card.closest(".gallery-item")).getPropertyValue("--zoom")) || 1;
  const width = cardRect.width * zoom;
  const height = cardRect.height * zoom;
  const image = card.querySelector("img");
  const previewImage = galleryPreview.querySelector("img");

  previewImage.src = image.currentSrc || image.src;
  galleryPreview.style.width = `${width}px`;
  galleryPreview.style.height = `${height}px`;
  const cardCenterX = cardRect.left - stageRect.left + cardRect.width / 2;
  const cardCenterY = cardRect.top - stageRect.top + cardRect.height / 2;
  galleryPreview.style.left = `${cardCenterX - width / 2}px`;
  galleryPreview.style.top = `${cardCenterY - height / 2}px`;
  galleryPreview.classList.add("is-visible");
}

function setActiveCard(card) {
  galleryCards.forEach((item) => {
    const active = item === card;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-expanded", String(active));
  });

  galleryTrack.classList.toggle("has-active", Boolean(card));
  updateGalleryPreview(card);
}

galleryCards.forEach((card) => {
  card.addEventListener("pointerdown", (event) => {
    lastPointerType = event.pointerType;
  });

  card.addEventListener("pointerenter", () => {
    card.removeAttribute("data-hover-suppressed");
    hoverSuppressedCard = null;
    if (hoverCapable.matches && !compactViewport.matches) setActiveCard(card);
  });

  card.addEventListener("pointerleave", () => {
    card.removeAttribute("data-hover-suppressed");
    if (hoverSuppressedCard === card) hoverSuppressedCard = null;
    if (hoverCapable.matches && !compactViewport.matches) setActiveCard(null);
  });

  card.addEventListener("focus", () => {
    if (!compactViewport.matches && lastPointerType !== "mouse" && lastPointerType !== "touch") {
      setActiveCard(card);
    }
  });

  card.addEventListener("blur", (event) => {
    if (!compactViewport.matches && !card.contains(event.relatedTarget)) setActiveCard(null);
  });

  card.addEventListener("click", () => {
    if (compactViewport.matches) {
      setActiveCard(null);
    } else if (hoverCapable.matches && lastPointerType === "mouse") {
      setActiveCard(card);
    } else {
      setActiveCard(card.classList.contains("is-active") ? null : card);
    }
    lastPointerType = null;
  });
});

galleryTrack.addEventListener("scroll", () => updateGalleryPreview(), { passive: true });
window.addEventListener("resize", () => {
  if (compactViewport.matches) setActiveCard(null);
  else updateGalleryPreview();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    hoverSuppressedCard = galleryCards.find((card) => card.classList.contains("is-active"));
    hoverSuppressedCard?.setAttribute("data-hover-suppressed", "true");
    setActiveCard(null);
  }
});
