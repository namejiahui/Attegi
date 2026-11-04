import { createSignal, onMount, onCleanup } from "solid-js";
import { t } from "../lib/i18n";

export default function BackToTop() {
  const [isVisible, setIsVisible] = createSignal(false);
  const [progress, setProgress] = createSignal(0);

  const radius = 20;
  const circumference = 2 * Math.PI * radius; // ~125.66

  onMount(() => {
    const handleScroll = () => {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;

      setIsVisible(scrollY > 240);

      if (docHeight > 0) {
        const pct = Math.max(0, Math.min(1, scrollY / docHeight));
        setProgress(pct);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    onCleanup(() => {
      window.removeEventListener("scroll", handleScroll);
    });
  });

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  const strokeDashoffset = () => circumference * (1 - progress());

  return (
    <button
      type="button"
      class={`back-to-top ${isVisible() ? "is-visible" : ""}`}
      onClick={scrollToTop}
      aria-label={t("Back to top") || "返回顶部"}
    >
      <svg class="progress-ring" viewBox="0 0 48 48" aria-hidden="true">
        <circle class="progress-ring__bg" cx="24" cy="24" r={radius} />
        <circle
          class="progress-ring__progress"
          cx="24"
          cy="24"
          r={radius}
          stroke-dasharray={`${circumference} ${circumference}`}
          stroke-dashoffset={strokeDashoffset()}
        />
      </svg>
      <svg
        class="back-to-top__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
}
