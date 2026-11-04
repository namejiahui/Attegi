import { MetaProvider, Title } from "@solidjs/meta";
import { Router, createAsync } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { ghost } from "./lib/ghost/index.js";
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

  return (
    <div class="viewport">
      <Header settings={settings()} />
      <section class="page-wrapper">
        <main id="main">
          <Suspense fallback={<div class="container" style={{ padding: "4rem 0" }}>加载中...</div>}>
            {props.children}
          </Suspense>
        </main>
        <Footer settings={settings()} />
      </section>
    </div>
  );
}

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <Title>Attegi Blog</Title>
          <Layout>{props.children}</Layout>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
