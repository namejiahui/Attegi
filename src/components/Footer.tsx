import type { GhostSettings } from "../lib/ghost/types.js";

interface FooterProps {
  settings?: GhostSettings;
}

export default function Footer(props: FooterProps) {
  const currentYear = new Date().getFullYear();
  const siteTitle = () => props.settings?.title || "bblog";

  return (
    <footer class="nav-footer">
      <div class="footer-main">
        <div class="footer-left">
          <span class="footer-copyright">
            &copy; {currentYear} {siteTitle()}
          </span>
          <span class="footer-credits">
            Published with{" "}
            <a href="https://ghost.org" target="_blank" rel="noopener noreferrer">
              Ghost
            </a>{" "}
            &{" "}
            <a href="https://github.com/bunizao/attegi" target="_blank" rel="noopener noreferrer">
              Attegi
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
