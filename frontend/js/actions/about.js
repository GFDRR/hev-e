/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const ADD_ABOUT_CONTENT = 'HEV-E:ADD_ABOUT_CONTENT';

function addAboutContent(content) {
    return {
        type: ADD_ABOUT_CONTENT,
        content
    };
}

module.exports = {
    ADD_ABOUT_CONTENT,
    addAboutContent
};
