/*
 * Copyright 2017, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


const loadMore = require('../../../MapStore2/web/client/components/misc/enhancers/infiniteScroll/loadMore');

const {compose, defaultProps} = require('recompose');
const withScrollSpy = require('../../../MapStore2/web/client/components/misc/enhancers/infiniteScroll/withScrollSpy');

/**
 * Add infinite scroll functionality to a component.
 *
 * To do that you must provide the following parameters:
 * @param {function} loadPage         A function that returns an observable that emits props with at least `{items: [items of the page], total: 100}`
 * @param {object} scrollSpyOptions  Options for the `withInfiniteScroll` enhancer
 * @return {HOC}                  The HOC to apply
 */
module.exports = ({
    loadPage,
    scrollSpyOptions,
    hasMore,
    loadStreamOptions
}) => compose(
        loadMore(loadPage),
        defaultProps({
            hasMore
        }),
        withScrollSpy(scrollSpyOptions, loadStreamOptions)

);
