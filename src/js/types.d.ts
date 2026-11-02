export {};

declare global {
  interface Window {
    hljs?: {
      configure: (options: Record<string, unknown>) => void;
      highlightElement: (element: Element) => void;
    };
    tocbot?: {
      init: (options: Record<string, unknown>) => void;
      destroy: () => void;
      refresh: () => void;
    };
  }

  const tocbot: {
    init: (options: Record<string, unknown>) => void;
    destroy: () => void;
    refresh: () => void;
  } | undefined;
}
