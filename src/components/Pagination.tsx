import { Show } from "solid-js";
import { A } from "@solidjs/router";
import type { GhostPagination } from "../lib/ghost/types.js";

interface PaginationProps {
  pagination?: GhostPagination;
  basePath?: string;
}

export default function Pagination(props: PaginationProps) {
  const p = () => props.pagination;
  const base = () => props.basePath || "";

  const prevUrl = () => {
    if (!p()?.prev) return null;
    return p()!.prev === 1 ? (base() ? `${base()}/` : "/") : `${base()}/page/${p()!.prev}/`;
  };

  const nextUrl = () => {
    if (!p()?.next) return null;
    return `${base()}/page/${p()!.next}/`;
  };

  return (
    <Show when={p() && p()!.pages > 1}>
      <nav class="pagination" aria-label="分页导航">
        <div class="inner">
          <div class="box pagination-box">
            <Show when={p()?.prev}>
              <A title="较新的文章" class="pagination-prev" href={prevUrl()!}>
                <i class="icon icon-arrow-left" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 12H5" />
                    <path d="m12 19-7-7 7-7" />
                  </svg>
                </i>
                <span class="pagination-label">较新的文章</span>
              </A>
            </Show>

            <span class="pagination-info">
              第 {p()!.page} 页，共 {p()!.pages} 页
            </span>

            <Show when={p()?.next}>
              <A title="较早的文章" class="pagination-next" href={nextUrl()!}>
                <span class="pagination-label">较早的文章</span>
                <i class="icon icon-arrow-right" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </i>
              </A>
            </Show>
          </div>
        </div>
      </nav>
    </Show>
  );
}
