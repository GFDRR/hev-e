
/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const React = require('react');
// const assign = require('object-assign');
// const PropTypes = require('prop-types');
// const { Navbar, Nav, NavItem, Glyphicon } = require('react-bootstrap');

const CompactCatalog = require('../../MapStore2/web/client/components/catalog/CompactCatalog');
/*const {selectedCatalogSelector} = require('../../MapStore2/web/client/selectors/catalog');
const {connect} = require('react-redux');
const {createSelector} = require('reselect');
const {compose, branch} = require('recompose');
const Catalog = compose(
    branch(
       ({catalog} = {}) => !catalog,
       connect(createSelector(selectedCatalogSelector, catalog => ({catalog})))
    ),
)(CompactCatalog);*/


class DataCatalog extends React.Component {
    static propTypes = {

    };

    static defaultProps = {

    };

    render() {
        return (
            <CompactCatalog
            catalog= {{
                "url": "/geoserver/csw",
                "type": "csw",
                "title": "Demo CSW Service",
                "autoload": true
              }}/>
        );
    }
}

// <Catalog services={catalogServices} selected={selected} catalog={catalog} onRecordSelected={r => setSelected(r)} />

module.exports = DataCatalog;
