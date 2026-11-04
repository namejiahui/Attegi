interface ShareButtonsProps {
  title: string;
  url: string;
}

export default function ShareButtons(props: ShareButtonsProps) {
  const encodedTitle = () => encodeURIComponent(props.title);
  const encodedUrl = () => encodeURIComponent(props.url);

  const openPopup = (e: MouseEvent, width: number, height: number) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLAnchorElement;
    if (typeof window !== "undefined") {
      window.open(
        target.href,
        "share-popup",
        `width=${width},height=${height},menubar=no,toolbar=no,status=no`
      );
    }
  };

  return (
    <div class="post-share js-share-default">
      <span class="post-info-label">分享</span>
      <a
        title="Twitter"
        aria-label="Twitter"
        class="twitter js-share-popup"
        href={`https://twitter.com/share?text=${encodedTitle()}&url=${encodedUrl()}`}
        onClick={(e) => openPopup(e, 550, 235)}
      >
        <span class="icon icon-x" aria-hidden="true">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
          </svg>
        </span>
      </a>
      <a
        title="Facebook"
        aria-label="Facebook"
        class="facebook js-share-popup"
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl()}`}
        onClick={(e) => openPopup(e, 580, 296)}
      >
        <span class="icon icon-facebook" aria-hidden="true">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </span>
      </a>
      <a
        title="LinkedIn"
        aria-label="LinkedIn"
        class="linkedin js-share-popup"
        href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl()}&title=${encodedTitle()}`}
        onClick={(e) => openPopup(e, 930, 720)}
      >
        <span class="icon icon-linkedin" aria-hidden="true">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        </span>
      </a>
      <a
        title="邮箱"
        aria-label="邮箱"
        class="email"
        href={`mailto:?subject=${encodedTitle()}&body=${encodedUrl()}`}
      >
        <span class="icon icon-mail" aria-hidden="true">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
          </svg>
        </span>
      </a>
    </div>
  );
}
