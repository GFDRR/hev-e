
/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const React = require('react');
const {compose, branch} = require('recompose');
const {DragSource: dragSource} = require('react-dnd');
const {DropTarget: dropTarget} = require('react-dnd');

const itemSource = {
    beginDrag: ({dataId, sortId}) => ({dataId, sortId})
};

const itemTarget = {
    drop: (props, monitor) => {
        const item = monitor.getItem();
        if (item.sortId !== props.sortId) {
            props.onSort({dataId: props.dataId, sortId: props.sortId}, {dataId: item.dataId, sortId: item.sortId});
        }
    }
};

const sourceCollect = (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
});

const targetCollect = (connect, monitor) => {
    const item = monitor.getItem();
    return {
        connectDropTarget: connect.dropTarget(),
        isOver: monitor.isOver(),
        dragId: item ? item.sortId : null
    };
};

module.exports = compose(
    dragSource('row', itemSource, sourceCollect),
    dropTarget('row', itemTarget, targetCollect),
    branch(
        ({isDraggable}) => isDraggable,
        Component => ({connectDragSource, connectDropTarget, isDragging, isOver, dragId, sortId, className = '', ...props}) => {
            return connectDragSource(connectDropTarget(
                <div>
                    {isOver && !isDragging && dragId > sortId && <div className={`ms-drag-over ${props.size ? ' ms-' + props.size : ''}`} />}
                    <Component {...props} className={className + `${isDragging ? ' ms-dragging' : isOver ? ' ms-over' : ''}`} isDragging={isDragging} isOver={isOver} />
                    {isOver && !isDragging && dragId < sortId && <div className={`ms-drag-over ${props.size ? ' ms-' + props.size : ''}`} />}
                </div>)
            );
        }
    )
);
