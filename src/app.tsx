import { MetaProvider, Title, Style, Link } from "@solidjs/meta";
import { Router, createAsync, useLocation } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense, Show, createEffect } from "solid-js";
import Header from "./components/Header";
import FloatNav from "./components/FloatNav";
import Footer from "./components/Footer";
import BackToTop from "./components/BackToTop";
import { ghost } from "./lib/ghost/index.js";
import { locale, changeLocale, getActiveLocale } from "./lib/i18n";
import "./css/style.css";

const fetchSettings = async () => {
  "use server";
  try {
    return await ghost.settings.browse();
  } catch (err) {
    console.error("Failed to fetch Ghost settings:", err);
    return undefined;
  }
};

function Layout(props: { children?: any }) {
  const settings = createAsync(() => fetchSettings());
  const location = useLocation();

  createEffect(() => {
    const cur = getActiveLocale(location.pathname);
    if (locale() !== cur.code) {
      changeLocale(cur.code);
    }
  });

  return (
    <div class="viewport">
      <Show when={settings()?.accent_color}>
        <Style>{`:root { --ghost-accent-color: ${settings()!.accent_color}; }`}</Style>
      </Show>
      <Show when={settings()?.icon}>
        <Link rel="icon" href={settings()!.icon!} />
      </Show>
      <Show when={settings()?.codeinjection_head}>
        <div innerHTML={settings()!.codeinjection_head!} style={{ display: "none" }} />
      </Show>
      <Header settings={settings()} />
      <FloatNav settings={settings()} />
      <section class="page-wrapper">
        <main id="main">
          <Suspense fallback={<div class="container app-loading-state">加载中...</div>}>
            {props.children}
          </Suspense>
        </main>
        <Footer settings={settings()} />
        <BackToTop />
      </section>
      <Show when={settings()?.codeinjection_foot}>
        <div innerHTML={settings()!.codeinjection_foot!} style={{ display: "none" }} />
      </Show>
    </div>
  );
}

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <Title>Attegi Blog</Title>
          <Suspense>
            <Layout>{props.children}</Layout>
          </Suspense>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
