const languageNames: Record<string, string> = {
  javascript: "JavaScript",
  js: "JavaScript",
  typescript: "TypeScript",
  ts: "TypeScript",
  python: "Python",
  py: "Python",
  java: "Java",
  c: "C",
  cpp: "C++",
  csharp: "C#",
  cs: "C#",
  go: "Go",
  rust: "Rust",
  ruby: "Ruby",
  rb: "Ruby",
  php: "PHP",
  swift: "Swift",
  kotlin: "Kotlin",
  sql: "SQL",
  html: "HTML",
  xml: "XML",
  css: "CSS",
  scss: "SCSS",
  json: "JSON",
  yaml: "YAML",
  yml: "YAML",
  markdown: "Markdown",
  md: "Markdown",
  bash: "Bash",
  shell: "Shell",
  sh: "Shell",
  dockerfile: "Dockerfile",
  powershell: "PowerShell",
  ps1: "PowerShell",
  plaintext: "Plain Text",
  text: "Plain Text",
};

function getLanguageDisplayName(langClass?: string | null): string | null {
  if (!langClass) return null;
  const match = langClass.match(/language-(\w+)/i);
  if (!match) return null;
  const lang = match[1].toLowerCase();
  return languageNames[lang] || lang.charAt(0).toUpperCase() + lang.slice(1);
}

function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.top = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

const copyIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
const copiedIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

export async function setupCodeHighlight(container: HTMLElement | null) {
  if (!container || typeof window === "undefined") return;
  const blocks = container.querySelectorAll<HTMLElement>("pre code");
  if (!blocks.length) return;

  const hljs = (await import("highlight.js")).default;

  blocks.forEach((code) => {
    if (!code.dataset.highlighted) {
      hljs.highlightElement(code);
    }

    const pre = code.parentElement;
    if (pre && !pre.querySelector(".code-header")) {
      const header = document.createElement("div");
      header.className = "code-header";

      const langName = getLanguageDisplayName(code.className);
      const lang = document.createElement("span");
      lang.className = "code-lang";
      lang.textContent = langName || "";
      header.appendChild(lang);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "code-copy-btn";
      btn.setAttribute("aria-label", "复制代码");
      btn.innerHTML = copyIcon + "<span>复制</span>";

      btn.addEventListener("click", () => {
        const text = code.textContent || "";
        copyToClipboard(text).then(() => {
          btn.classList.add("copied");
          btn.innerHTML = copiedIcon + "<span>已复制!</span>";
          setTimeout(() => {
            btn.classList.remove("copied");
            btn.innerHTML = copyIcon + "<span>复制</span>";
          }, 2000);
        });
      });

      header.appendChild(btn);
      pre.insertBefore(header, pre.firstChild);
    }
  });
}
