import { Show } from "solid-js";
import type { GhostSettings } from "../lib/ghost/types.js";
import ThemeToggle from "./ThemeToggle";
import { t } from "../lib/i18n";

interface FooterProps {
  settings?: GhostSettings;
}

export default function Footer(props: FooterProps) {
  const currentYear = new Date().getFullYear();
  const siteTitle = () => props.settings?.title || "Attegi";

  const resolveSocialUrl = (type: string, raw?: string | null) => {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
    if (type === "twitter") return `https://twitter.com/${trimmed.replace(/^@/, "")}`;
    if (type === "facebook") return `https://facebook.com/${trimmed.replace(/^@/, "")}`;
    return trimmed;
  };

  const s = () => (props.settings || {}) as any;

  const twitterUrl = () => resolveSocialUrl("twitter", s().twitter);
  const facebookUrl = () => resolveSocialUrl("facebook", s().facebook);
  const githubUrl = () => s().github_url || null;
  const blueskyUrl = () => resolveSocialUrl("bluesky", s().bluesky || s().bluesky_url);
  const telegramUrl = () => s().telegram_url || null;
  const discordUrl = () => s().discord_url || null;
  const instagramUrl = () => resolveSocialUrl("instagram", s().instagram || s().instagram_url);
  const linkedinUrl = () => resolveSocialUrl("linkedin", s().linkedin);
  const youtubeUrl = () => resolveSocialUrl("youtube", s().youtube);
  const threadsUrl = () => resolveSocialUrl("threads", s().threads);
  const mastodonUrl = () => resolveSocialUrl("mastodon", s().mastodon);

  return (
    <footer class="nav-footer">
      <div class="footer-main">
        <div class="footer-left">
          <span class="footer-copyright">
            &copy; {currentYear} {siteTitle()}
          </span>
          <span class="footer-credits">
            {t("Published with")}{" "}
            <a href="https://ghost.org" target="_blank" rel="noopener noreferrer">
              Ghost
            </a>{" "}
            &{" "}
            <a href="https://github.com/bunizao/attegi" target="_blank" rel="noopener noreferrer">
              Attegi
            </a>
          </span>
        </div>

        <div class="footer-right">
          <div class="footer-social">
            {/* Twitter / X */}
            <Show when={twitterUrl()}>
              <a
                class="social-link"
                aria-label="X"
                title="X"
                href={twitterUrl()!}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i class="icon icon-x" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                  </svg>
                </i>
              </a>
            </Show>

            {/* Facebook */}
            <Show when={facebookUrl()}>
              <a
                class="social-link"
                aria-label="Facebook"
                title="Facebook"
                href={facebookUrl()!}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i class="icon icon-facebook" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </i>
              </a>
            </Show>

            {/* GitHub */}
            <Show when={githubUrl()}>
              <a
                class="social-link"
                aria-label="GitHub"
                title="GitHub"
                href={githubUrl()!}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i class="icon icon-github" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                </i>
              </a>
            </Show>

            {/* Bluesky */}
            <Show when={blueskyUrl()}>
              <a
                class="social-link"
                aria-label="Bluesky"
                title="Bluesky"
                href={blueskyUrl()!}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i class="icon icon-bluesky" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.601 6.486.717 2.67 3.28 3.574 5.68 3.296-4.645.826-5.452 2.924-3.065 5.19 1.187 1.127 2.22 1.822 3.098 2.086 1.55.467 3.258.181 4.333-.818.082-.076.165-.16.248-.25a.39.39 0 0 1 .21-.12.39.39 0 0 1 .21.12c.083.09.166.174.248.25 1.075.999 2.783 1.285 4.333.818.878-.264 1.911-.959 3.098-2.086 2.387-2.266 1.58-4.364-3.065-5.19 2.4.278 4.963-.627 5.68-3.296.223-.837.601-5.796.601-6.486 0-.688-.139-1.86-.902-2.203-.659-.299-1.664-.621-4.3 1.24C14.046 4.747 11.087 8.686 12 10.8z" />
                  </svg>
                </i>
              </a>
            </Show>

            {/* Telegram */}
            <Show when={telegramUrl()}>
              <a
                class="social-link"
                aria-label="Telegram"
                title="Telegram"
                href={telegramUrl()!}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i class="icon icon-telegram" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                </i>
              </a>
            </Show>

            {/* Discord */}
            <Show when={discordUrl()}>
              <a
                class="social-link"
                aria-label="Discord"
                title="Discord"
                href={discordUrl()!}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i class="icon icon-discord" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </i>
              </a>
            </Show>

            {/* Instagram */}
            <Show when={instagramUrl()}>
              <a
                class="social-link"
                aria-label="Instagram"
                title="Instagram"
                href={instagramUrl()!}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i class="icon icon-instagram" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </i>
              </a>
            </Show>

            {/* LinkedIn */}
            <Show when={linkedinUrl()}>
              <a
                class="social-link"
                aria-label="LinkedIn"
                title="LinkedIn"
                href={linkedinUrl()!}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i class="icon icon-linkedin" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </i>
              </a>
            </Show>

            {/* YouTube */}
            <Show when={youtubeUrl()}>
              <a
                class="social-link"
                aria-label="YouTube"
                title="YouTube"
                href={youtubeUrl()!}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i class="icon icon-youtube" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </i>
              </a>
            </Show>

            {/* Threads */}
            <Show when={threadsUrl()}>
              <a
                class="social-link"
                aria-label="Threads"
                title="Threads"
                href={threadsUrl()!}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i class="icon icon-threads" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.82 14.394c-.23.636-.576 1.205-1.036 1.696-.867.925-2.052 1.435-3.336 1.435-1.472 0-2.735-.618-3.557-1.74-.805-1.097-1.125-2.61-1.125-4.498 0-1.884.32-3.398 1.125-4.496.822-1.123 2.085-1.741 3.557-1.741 1.472 0 2.735.618 3.557 1.741.545.744.869 1.688.995 2.802h-2.112c-.105-.63-.332-1.144-.683-1.528-.444-.486-1.054-.746-1.757-.746-.864 0-1.549.379-1.983 1.096-.453.748-.683 1.836-.683 3.232 0 1.398.23 2.485.683 3.234.434.717 1.119 1.096 1.983 1.096.703 0 1.313-.26 1.757-.746.351-.384.578-.898.683-1.528H12v-1.956h5.82v1.678z" />
                  </svg>
                </i>
              </a>
            </Show>

            {/* Mastodon */}
            <Show when={mastodonUrl()}>
              <a
                class="social-link"
                aria-label="Mastodon"
                title="Mastodon"
                href={mastodonUrl()!}
                target="_blank"
                rel="noopener noreferrer"
              >
                <i class="icon icon-mastodon" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.244 15.58.125 12.006.125c-3.574 0-5.504.119-5.958.184C3.36.703 1.094 2.735.743 5.313.385 7.953.25 10.742.25 12.012c0 1.27.135 4.059.493 6.699.351 2.578 2.617 4.61 5.305 5.004.819.119 1.777.16 2.83.16 1.487 0 2.803-.09 3.827-.27v-2.316c-.927.184-1.97.234-3.09.234-1.894 0-2.486-.46-2.593-1.42l-.04-.37c1.782.463 3.59.574 5.368.574 1.734 0 3.498-.108 5.25-.562 2.75-.707 3.39-3.09 3.486-5.127.098-2.074.195-4.863.195-7.707 0-.008-.002-.016-.003-.024zm-4.737 9.875h-2.527v-6.52c0-1.637-.695-2.47-2.083-2.47-1.536 0-2.304.993-2.304 2.977v3.746H9.102V9.175c0-1.984-.768-2.977-2.304-2.977-1.388 0-2.083.833-2.083 2.47v6.52H2.188V8.906c0-1.637.418-2.936 1.254-3.896.836-.961 1.93-1.448 3.28-1.448 1.56 0 2.74.598 3.537 1.794L12 8.016l1.74-2.66c.798-1.196 1.978-1.794 3.538-1.794 1.35 0 2.444.487 3.28 1.448.836.96 1.254 2.259 1.254 3.896v6.282z" />
                  </svg>
                </i>
              </a>
            </Show>

            {/* RSS Feed (Native endpoint) */}
            <a
              class="social-link"
              aria-label="RSS"
              href="/rss/"
              title="RSS"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i class="icon icon-rss" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.199 24C19.199 13.467 10.533 4.8 0 4.8V0c13.165 0 24 10.835 24 24h-4.801zM3.291 17.415c1.814 0 3.293 1.479 3.293 3.295 0 1.813-1.485 3.29-3.301 3.29C1.47 24 0 22.526 0 20.71s1.475-3.294 3.291-3.295zM15.909 24h-4.665c0-6.169-5.075-11.245-11.244-11.245V8.09c8.727 0 15.909 7.184 15.909 15.91z" />
                </svg>
              </i>
            </a>
          </div>

          <span class="footer-divider" />

          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
