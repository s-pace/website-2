import React, { Fragment, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Helmet from 'react-helmet';
import { Global, css } from '@emotion/core';
import { Link, navigate } from 'gatsby';
import { DocSearchButton, useDocSearchKeyboardEvents } from '@docsearch/react';

let DocSearchModal = null;

const Hit = ({ hit, children }) => <Link to={hit.url}>{children}</Link>;

const docsearchCredentials = {
  appId: 'BH4D9OD16A',
  apiKey: 'd5fa05c4e33e776fbf2b8021cbc15b37',
  indexName: 'popper',
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
          :root {
            a {
              border-bottom-style: none;
            }

            --docsearch-primary-color: #ff6b81;
            --docsearch-text-color: rgb(245, 246, 247);
            --docsearch-container-background: rgba(9, 10, 17, 0.8);
            --docsearch-modal-background: #281e36;
            --docsearch-modal-shadow: inset 1px 1px 0 0 rgb(44, 46, 64),
              0 3px 8px 0 rgb(0, 3, 9);
            --docsearch-searchbox-background: rgb(9, 10, 17);
            --docsearch-searchbox-focus-background: #000;
            --docsearch-hit-color: rgb(190, 195, 201);
            --docsearch-hit-shadow: none;
            --docsearch-hit-background: rgb(9, 10, 17);
            --docsearch-key-gradient: linear-gradient(
              -26.5deg,
              rgb(114 86 111) 0%,
              rgb(65 46 80) 100%
            );
            --docsearch-key-shadow: inset 0 -2px 0 0 rgb(81 31 82),
              inset 0 0 1px 1px rgb(125 81 111), 0 2px 2px 0 rgba(3, 4, 9, 0.3);
            --docsearch-footer-background: #2f263c;
            --docsearch-footer-shadow: inset 0 1px 0 0 rgba(73, 76, 106, 0.5),
              0 -4px 8px 0 rgba(0, 0, 0, 0.2);
            --docsearch-logo-color: #fff;
            --docsearch-muted-color: rgb(127, 132, 151);
            --docsearch-key-shadow: inset 0 -2px 0 0 rgb(40, 45, 85),
              inset 0 0 1px 1px rgb(81, 87, 125), 0 2px 2px 0 rgba(3, 4, 9, 0.3);
            --docsearch-footer-background: #2f263c;
            --docsearch-footer-shadow: inset 0 1px 0 0 rgba(73, 76, 106, 0.5),
              0 -4px 8px 0 rgba(0, 0, 0, 0.2);
            --docsearch-logo-color: rgb(255, 255, 255);
            --docsearch-muted-color: rgb(127, 132, 151);

            .DocSearch-Button {
              margin: 10px 10px;
              height: 39px;
            }

            .DocSearch-Button-Placeholder {
              width: 100%;
              text-align: left;
            }
            .DocSearch-Button {
              --docsearch-searchbox-background: rgb(235, 237, 240);
              --docsearch-searchbox-focus-background: #fff;
              --docsearch-text-color: rgb(28, 30, 33);
              --docsearch-muted-color: rgb(150, 159, 175);
              --docsearch-key-gradient: linear-gradient(
                -225deg,
                rgb(213, 219, 228) 0%,
                rgb(248, 248, 248) 100%
              );
              --docsearch-searchbox-shadow: 0 0 0 4px rgba(0, 0, 0, 0.3);
              --docsearch-key-shadow: inset 0 -2px 0 0 rgb(205, 205, 230),
                inset 0 0 1px 1px #fff, 0 1px 2px 1px rgba(30, 35, 90, 0.4);
            }

            @media (max-width: 750px) {
              .DocSearch-Button-KeySeparator,
              .DocSearch-Button-Key {
                display: flex;
              }

              .DocSearch-Button-Placeholder {
                display: flex;
              }
            }
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
            searchParameters={{
              facetFilters: [
                `tags:${
                  document.location.pathname.includes('v1') ? 'v1' : 'v2'
                }`,
              ],
            }}
          />,
          document.body
        )}
    </Fragment>
  );
};

export default DocSearch;
