/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const React = require('react');
const PropTypes = require('prop-types');
const {connect} = require('react-redux');
const {createSelector} = require('reselect');
const {SearchPlugin, epics, reducers} = require('../../MapStore2/web/client/plugins/Search');
const assign = require('object-assign');

class Search extends React.Component {
    static propTypes = {
        selectedData: PropTypes.bool
    };

    static defaultProps = {
        selectedData: false
    };

    render() {
        const center = this.props.selectedData ? ' et-center' : ' et-top-left';
        return (
            <div className={'et-search-bar' + center}>
                <SearchPlugin {...this.props}/>
            </div>
        );
    }
}

const searchSelector = createSelector([
    state => state.controls && state.controls.dataExplorer.enabled
], (selectedData) => ({
    selectedData: !selectedData
}));

const SearchBar = connect(searchSelector)(Search);

module.exports = {
    SearchPlugin: assign(SearchBar, {
        BrandNavbar: {
            name: 'search',
            priority: 1
        }
    }),
    reducers,
    epics
};
