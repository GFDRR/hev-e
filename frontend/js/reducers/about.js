/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {ADD_ABOUT_CONTENT} = require('../actions/about');

function about(state = {}, action) {
    switch (action.type) {
        case ADD_ABOUT_CONTENT:
            return {...state, content: action.content};
        default:
            return state;
    }
}

module.exports = about;
