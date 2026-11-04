// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";
import { getActiveLocale, setLocale } from "./lib/i18n";

const themeBootstrapScript = `
(function(){
  try {
    var d = document.documentElement;
    var s = localStorage.getItem('attegi_theme') || 'system';
    var m = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = s === 'dark' || (s !== 'light' && m);
    d.classList.remove('theme-dark', 'theme-light', 'theme-system');
    d.classList.add(dark ? 'theme-dark' : 'theme-light');
    if (s === 'system') d.classList.add('theme-system');
  } catch(e) {}
})();
`;

export default createHandler((context) => {
  const pathname = new URL(context.request.url).pathname;
  const currentLocale = getActiveLocale(pathname);
  setLocale(currentLocale.code);
  return (
    <StartServer
      document={({ assets, children, scripts }) => (
        <html lang={currentLocale.code}>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)" />
            <meta name="theme-color" content="#1D1F21" media="(prefers-color-scheme: dark)" />
            <link rel="icon" href="/favicon.ico" />
            <link rel="alternate" type="application/rss+xml" title="RSS" href="/rss/" />
            <script innerHTML={themeBootstrapScript} />
            {assets}
          </head>
          <body>
            <div id="app">{children}</div>
            {scripts}
          </body>
        </html>
      )}
    />
  );
});
