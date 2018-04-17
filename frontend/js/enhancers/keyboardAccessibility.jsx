/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const React = require('react');
const {compose, branch} = require('recompose');

module.exports = compose(
    branch(
        ({accessible = true}) => accessible,
        Component => ({className = '', onKeyDown, ...props}) => {
            return (<Component className={className + ' ms-keyboard-focus'} role="button" tabIndex="0" {...props} onKeyDown={(e) => e.keyCode === 13 ? onKeyDown() : null}/>);
        }
    )
);
