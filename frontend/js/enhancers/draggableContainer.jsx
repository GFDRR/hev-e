
/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const React = require('react');
const dragDropContext = require('react-dnd').DragDropContext;
const html5Backend = require('react-dnd-html5-backend');
const {compose, branch} = require('recompose');

module.exports = compose(
    dragDropContext(html5Backend),
    branch(
        ({isDraggable}) => isDraggable,
        Component => ({onSort, isDraggable, items, ...props}) => {
            const draggableItems = items.map((item, sortId) => ({...item, onSort, isDraggable, sortId, key: sortId}));
            return <Component {...props} items={draggableItems}/>;
        }
    )
);
