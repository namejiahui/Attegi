import { createSignal, createEffect, onCleanup, Show, For } from "solid-js";
import { Dialog } from "@kobalte/core/dialog";

export interface LightboxImage {
  src: string;
  alt?: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onIndexChange?: (newIndex: number) => void;
}

export default function ImageLightbox(props: ImageLightboxProps) {
  const [index, setIndex] = createSignal(props.currentIndex);

  // Sync external index changes
  createEffect(() => {
    setIndex(props.currentIndex);
  });

  const total = () => props.images.length;
  const current = () => props.images[index()] || { src: "", alt: "" };

  const prev = () => {
    if (total() <= 1) return;
    const newIdx = (index() - 1 + total()) % total();
    setIndex(newIdx);
    props.onIndexChange?.(newIdx);
  };

  const next = () => {
    if (total() <= 1) return;
    const newIdx = (index() + 1) % total();
    setIndex(newIdx);
    props.onIndexChange?.(newIdx);
  };

  // Keyboard navigation (Escape is handled natively by Kobalte Dialog)
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!props.isOpen) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    }
  };

  createEffect(() => {
    if (props.isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      onCleanup(() => window.removeEventListener("keydown", handleKeyDown));
    }
  });

  // Touch gesture support for mobile swiping
  let touchStartX = 0;
  let touchStartY = 0;

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const deltaY = e.changedTouches[0].clientY - touchStartY;
    // Only trigger if horizontal swipe is dominant and exceeds 45px
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 45) {
      if (deltaX > 0) {
        prev();
      } else {
        next();
      }
    }
  };

  return (
    <Dialog
      open={props.isOpen}
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay class="lightbox-overlay" />
        <Dialog.Content
          class="lightbox-content"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => {
            // Close if user clicked the backdrop empty space
            if (e.target === e.currentTarget) {
              props.onClose();
            }
          }}
        >
          {/* Close button */}
          <Dialog.CloseButton class="lightbox-close" aria-label="关闭预览">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Dialog.CloseButton>

          {/* Previous button */}
          <Show when={total() > 1}>
            <button
              type="button"
              class="lightbox-btn-prev"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                prev();
              }}
              aria-label="上一张图片"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          </Show>

          {/* Next button */}
          <Show when={total() > 1}>
            <button
              type="button"
              class="lightbox-btn-next"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                next();
              }}
              aria-label="下一张图片"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </Show>

          {/* Centered Image Figure */}
          <figure class="lightbox-figure" onClick={(e) => e.stopPropagation()}>
            <img
              class="lightbox-image"
              src={current().src}
              alt={current().alt || "Preview image"}
            />
            <Show when={current().alt}>
              <figcaption class="lightbox-caption">{current().alt}</figcaption>
            </Show>
          </figure>

          {/* Multi-image counter */}
          <Show when={total() > 1}>
            <div class="lightbox-counter">
              {index() + 1} / {total()}
            </div>
          </Show>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
