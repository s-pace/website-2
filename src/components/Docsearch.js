import React, { Fragment, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Helmet from 'react-helmet';
import { Global, css } from '@emotion/core';
import { Link, navigate } from 'gatsby';
import { DocSearchButton, useDocSearchKeyboardEvents } from '@docsearch/react';
import '@docsearch/css';

let DocSearchModal = null;

const Hit = ({ hit, children }) => <Link to={hit.url}>{children}</Link>;

const docsearchCredentials = {
  appId: 'BH4D9OD16A',
  apiKey: 'd5fa05c4e33e776fbf2b8021cbc15b37',
  indexName: 'popper',
  searchParameters: {
    facetFilters: [
      `tags:${window.location.pathname.includes('v1') ? 'v1' : 'v2'}`,
    ],
  },
};

const colors = {
  brand: '#ff6b81',
  active: '#d2cbe4',
  hitActiveBg: '#c83b50',
  dark: '#2f263c',
  darker: '#1c1428',
  divider: '#44395d',
  black: '#1c1428',
  permalink: '#ffb6b3',
  header: '#b886fd',
  navButton: '#4edee5',
  starFill: '#ffe69d',
};

const DocSearch = () => {
  const searchButtonRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState(null);

  const importDocSearchModalIfNeeded = useCallback(() => {
    if (DocSearchModal) {
      return Promise.resolve();
    }
    return Promise.all([
      import('@docsearch/react/modal'),
      import('@docsearch/react/style/modal'),
    ]).then(([{ DocSearchModal: Modal }]) => {
      DocSearchModal = Modal;
    });
  }, []);

  const onOpen = useCallback(() => {
    importDocSearchModalIfNeeded().then(() => {
      setIsOpen(true);
    });
  }, [importDocSearchModalIfNeeded, setIsOpen]);

  const onClose = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  const onInput = useCallback(
    event => {
      importDocSearchModalIfNeeded().then(() => {
        setIsOpen(true);
        setInitialQuery(event.key);
      });
    },
    [importDocSearchModalIfNeeded, setIsOpen, setInitialQuery]
  );

  useDocSearchKeyboardEvents({
    isOpen,
    onOpen,
    onClose,
    onInput,
    searchButtonRef,
  });

  return (
    <Fragment>
      <Helmet>
        {/* This hints the browser that the website will load data from Algolia,
          and allows it to preconnect to the DocSearch cluster. It makes the first
          query faster, especially on mobile. */}
        <link
          rel="preconnect"
          href={`https://${docsearchCredentials.appId}-dsn.algolia.net`}
          crossOrigin
        />
      </Helmet>
      <Global
        styles={css`
          .DocSearch {
            a {
              border-bottom-style: none;
            }

            .DocSearch-Hit-icon {
              color: ${colors.permalink};
            }
            .DocSearch-Hit[aria-selected='true'] {
              a {
                background: ${colors.hitActiveBg};
              }
              .DocSearch-Hit-action-button:hover path,
              .DocSearch-Hit-action-button:focus path {
                fill: ${colors.starFill};
              }
            }
            .DocSearch-Hit-source,
            .DocSearch-Prefill {
              color: ${colors.header};
            }

            --docsearch-primary-color: ${colors.brand};
            --docsearch-highlight-color: ${colors.brand};

            --docsearch-modal-background: ${colors.dark};

            --docsearch-searchbox-shadow: inset 0 0 0 2px
              var(--docsearch-primary-color);

            --docsearch-hit-color: ${colors.active};
            --docsearch-hit-active-color: ${colors.active};
            --docsearch-hit-background: ${colors.darker};

            --docsearch-footer-background: ${colors.dark};
          }

          .DocSearch-Commands {
            --docsearch-muted-color: ${colors.navButton};
            --docsearch-key-gradient: linear-gradient(
              -26.5deg,
              ${colors.darker} 0%,
              ${colors.black} 100%
            );
          }

          .DocSearch-Button {
            margin: 10px 10px;
          }
        `}
      />
      <DocSearchButton
        onTouchStart={importDocSearchModalIfNeeded}
        onFocus={importDocSearchModalIfNeeded}
        onMouseOver={importDocSearchModalIfNeeded}
        onClick={onOpen}
        ref={searchButtonRef}
      />
      {DocSearchModal &&
        isOpen &&
        createPortal(
          <DocSearchModal
            initialScrollY={window.scrollY}
            initialQuery={initialQuery}
            onClose={onClose}
            navigator={{
              navigate({ suggestionUrl }) {
                navigate(suggestionUrl);
              },
            }}
            hitComponent={Hit}
            transformItems={items => {
              return items.map(item => {
                // We transform the absolute URL into a relative URL to
                // leverage Gatsby's preloading.
                const a = document.createElement('a');
                a.href = item.url;

                return {
                  ...item,
                  url: `${a.pathname}${a.hash}`,
                };
              });
            }}
            {...docsearchCredentials}
          />,
          document.body
        )}
    </Fragment>
  );
};

export default DocSearch;
