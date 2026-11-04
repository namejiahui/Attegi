/**
 * Content enhancement utilities for Ghost rich-text posts:
 * - Excerpt cleanup: strips directive tags like [!poem] from previews
 * - Toggle cards: handles open/close interaction and accessibility attributes
 * - Gallery cards: dynamically sets aspect-ratio based flex values
 * - Poem cards: parses > [!poem] blockquotes into structured poem cards
 */

const DIRECTIVE_PATTERN = /\[\/?!?[a-z0-9_-]+\]/gi;

/**
 * Strips directive markers (e.g. "[!poem]") from excerpt strings.
 */
export function cleanExcerpt(text?: string | null): string {
  if (!text) return "";
  return text.replace(DIRECTIVE_PATTERN, "").replace(/\s{2,}/g, " ").trim();
}

/**
 * Handles click events on Koenig toggle cards (.kg-toggle-heading).
 * Returns true if the click was handled.
 */
export function handleToggleClick(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const heading = target.closest<HTMLElement>(".kg-toggle-heading");
  if (!heading) return false;
  const card = heading.closest<HTMLElement>(".kg-toggle-card");
  if (!card) return false;

  const isClose = card.getAttribute("data-kg-toggle-state") === "close";
  const newState = isClose ? "open" : "close";
  card.setAttribute("data-kg-toggle-state", newState);
  heading.setAttribute("aria-expanded", String(isClose));
  return true;
}

/**
 * Initializes accessibility attributes on toggle cards inside container.
 */
export function setupToggleCards(container: HTMLElement): void {
  const cards = container.querySelectorAll<HTMLElement>(".kg-toggle-card");
  cards.forEach((card, index) => {
    const heading = card.querySelector<HTMLElement>(".kg-toggle-heading");
    const content = card.querySelector<HTMLElement>(".kg-toggle-content");
    if (!heading || !content) return;
    if (!content.id) {
      content.id = `kg-toggle-content-${index}`;
    }
    heading.setAttribute("aria-controls", content.id);
    const isOpen = card.getAttribute("data-kg-toggle-state") === "open";
    heading.setAttribute("aria-expanded", String(isOpen));
  });
}

/**
 * Sets proper aspect ratios for Ghost gallery images via flex.
 */
export function setupGalleryCards(container: HTMLElement): void {
  const images = container.querySelectorAll<HTMLImageElement>(".kg-gallery-image img");
  if (!images.length) return;

  images.forEach((img) => {
    const wrapper = img.closest<HTMLElement>(".kg-gallery-image");
    if (!wrapper) return;

    const applyRatio = () => {
      const width = parseFloat(img.getAttribute("width") || "") || img.naturalWidth;
      const height = parseFloat(img.getAttribute("height") || "") || img.naturalHeight;
      if (width > 0 && height > 0) {
        wrapper.style.flex = `${width / height} 1 0%`;
      }
    };

    if (img.complete && img.naturalWidth > 0) {
      applyRatio();
    } else {
      img.addEventListener("load", applyRatio, { once: true });
    }
  });
}

/**
 * Parses blockquotes formatted as `[!poem]` into styled poem cards.
 */
export function setupPoemCards(container: HTMLElement): void {
  const blockquotes = container.querySelectorAll<HTMLElement>("blockquote");
  blockquotes.forEach((blockquote) => {
    const rawText = blockquote.textContent || "";
    if (!/^\s*\[!poem\]/.test(rawText)) return;

    const lines: string[] = [];
    const paragraphs = blockquote.querySelectorAll("p");
    if (paragraphs.length > 0) {
      paragraphs.forEach((p) => {
        const text = p.textContent?.trim() || "";
        if (text) lines.push(text);
      });
    } else {
      const clone = blockquote.cloneNode(true) as HTMLElement;
      clone.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
      (clone.textContent || "").split(/\r?\n/).forEach((part) => {
        const text = part.trim();
        if (text) lines.push(text);
      });
    }

    if (lines.length === 0) return;

    const poemMatch = lines[0].match(/^\[!poem\](.*)$/);
    if (!poemMatch) return;

    const rawTitle = poemMatch[1].trim();
    const contentLines = lines.slice(1);
    let author = "";
    let verses = contentLines;

    const lastLine = contentLines[contentLines.length - 1];
    if (
      lastLine &&
      lastLine.length <= 40 &&
      (lastLine.startsWith("—") || lastLine.startsWith("--") || lastLine.startsWith("- "))
    ) {
      author = lastLine.replace(/^--/, "—").replace(/^- /, "— ");
      verses = contentLines.slice(0, contentLines.length - 1);
    }

    const centered = rawTitle.includes("[center]") || rawTitle.includes("[居中]");
    const plain = rawTitle.includes("[plain]") || rawTitle.includes("[非斜体]");
    const cleanTitle = rawTitle
      .replace(/\[center\]/gi, "")
      .replace(/\[居中\]/g, "")
      .replace(/\[plain\]/gi, "")
      .replace(/\[非斜体\]/g, "")
      .trim();

    const figure = document.createElement("figure");
    figure.className = `kg-poem-card${centered ? " kg-poem-centered" : ""}${plain ? " kg-poem-plain" : ""}`;

    if (cleanTitle) {
      const header = document.createElement("div");
      header.className = "kg-poem-header";
      const titleEl = document.createElement("p");
      titleEl.className = "kg-poem-title";
      titleEl.textContent = cleanTitle;
      header.appendChild(titleEl);
      figure.appendChild(header);

      const divider = document.createElement("div");
      divider.className = "kg-poem-divider";
      figure.appendChild(divider);
    }

    if (verses.length > 0) {
      const poemContent = document.createElement("blockquote");
      poemContent.className = "kg-poem-content";
      verses.forEach((verse) => {
        if (!verse) return;
        const lineEl = document.createElement("p");
        lineEl.className = "kg-poem-line";
        lineEl.textContent = verse;
        poemContent.appendChild(lineEl);
      });
      figure.appendChild(poemContent);
    }

    if (author) {
      const figcaption = document.createElement("figcaption");
      figcaption.className = "kg-poem-author";
      figcaption.textContent = author;
      figure.appendChild(figcaption);
    }

    blockquote.replaceWith(figure);
  });
}

/**
 * Detects if the cover image is bright and applies the `.light-cover` class
 * for contrast enhancement on the header title.
 * Best-effort only: works for same-origin images and fails gracefully on cross-origin/tainted canvases.
 */
export function setupCoverBrightness(header: HTMLElement): void {
  const coverImg = header.querySelector<HTMLImageElement>(".post-cover img");
  if (!coverImg) return;

  function analyzeBrightness(img: HTMLImageElement): void {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sampleHeight = Math.floor(img.naturalHeight * 0.4);
    const sampleY = img.naturalHeight - sampleHeight;
    const sampleWidth = Math.min(img.naturalWidth, 100);
    const scaledHeight = Math.min(sampleHeight, 60);

    canvas.width = sampleWidth;
    canvas.height = scaledHeight;

    try {
      ctx.drawImage(img, 0, sampleY, img.naturalWidth, sampleHeight, 0, 0, sampleWidth, scaledHeight);
      const imageData = ctx.getImageData(0, 0, sampleWidth, scaledHeight);
      const data = imageData.data;
      let totalBrightness = 0;
      const pixelCount = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        totalBrightness += (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      }

      if (totalBrightness / pixelCount > 160) {
        header.classList.add("light-cover");
      }
    } catch {
      // Best-effort only: cross-origin images taint canvas and fail silently.
    }
  }

  if (coverImg.complete && coverImg.naturalWidth > 0) {
    analyzeBrightness(coverImg);
  } else {
    coverImg.addEventListener("load", () => analyzeBrightness(coverImg), { once: true });
  }
}
