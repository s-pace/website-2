import React, { Fragment, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Helmet from 'react-helmet';
import { Link, navigate } from 'gatsby';
import { DocSearchButton, useDocSearchKeyboardEvents } from '@docsearch/react';
import '@docsearch/css';

let DocSearchModal = null;

const Hit = ({ hit, children }) => <Link to={hit.url}>{children}</Link>;

const DocSearch = () => {
  const docsearchCredentials = {
    appId: 'BH4D9OD16A',
    apiKey: 'd5fa05c4e33e776fbf2b8021cbc15b37',
    indexName: 'popper',
    algoliaOptions: { facetFilters: ['tags:v2'] },
  };
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

      <DocSearchButton
        style={{
          margin: '0 10px',
        }}
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
