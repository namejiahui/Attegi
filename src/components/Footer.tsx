import type { GhostSettings } from "../lib/ghost/types.js";
import ThemeToggle from "./ThemeToggle";
import { t } from "../lib/i18n";

interface FooterProps {
  settings?: GhostSettings;
}

export default function Footer(props: FooterProps) {
  const currentYear = new Date().getFullYear();
  const siteTitle = () => props.settings?.title || "Attegi";
  const siteUrl = () => props.settings?.url?.replace(/\/$/, "") || "";

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
            <a
              class="social-link"
              aria-label="RSS"
              href={`${siteUrl()}/rss/`}
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
