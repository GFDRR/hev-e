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
const assign = require('object-assign');
const {NavItem, Glyphicon } = require('react-bootstrap');
const toopltip = require('../../MapStore2/web/client/components/misc/enhancers/tooltip');
const NavItemT = toopltip(NavItem);
const {ordersSelector, downloadsSelector} = require('../selectors/dataexploration');
const {openDownloads} = require('../actions/dataexploration');
const {isEqual} = require('lodash');

class DownloadsCounter extends React.Component {
    static propTypes = {
        downloads: PropTypes.array,
        orders: PropTypes.array,
        onShowDownload: PropTypes.func
    };

    static defaultProps = {
        downloads: [],
        orders: [],
        onShowDownload: () => {}
    };

    state = {
        className: ''
    };

    componentWillUpdate(newProps) {
        if (newProps.downloads && this.props.downloads && newProps.downloads.length > 0
            && (newProps.downloads.length > this.props.downloads.length || !isEqual(newProps.downloads, this.props.downloads))) {
            this.setState({
                className: ' et-animation'
            });
            setTimeout(() => {
                this.setState({
                    className: ' et-no-animation'
                });
            }, 500);
        }
    }

    render() {
        const downloadEnabled = this.props.downloads && this.props.downloads.length > 0 || this.props.orders && this.props.orders.length > 0;
        return (
            <NavItemT
                tooltipId={downloadEnabled ? 'heve.collectedData' : 'heve.noCollectedData'}
                tooltipPosition="bottom"
                onClick={() => downloadEnabled ? this.props.onShowDownload() : null}>
                    {this.state.className !== ' et-animation' && this.props.downloads && this.props.downloads.length > 0 && <div style={{
                        position: 'absolute',
                        right: 4,
                        top: 24,
                        padding: '0 4px',
                        fontSize: 10,
                        color: '#fff',
                        height: 14,
                        display: 'flex',
                        zIndex: 1
                    }}>
                        <span style={{margin: 'auto'}}>{this.props.downloads.length}</span>
                    </div>}
                <Glyphicon
                    className={downloadEnabled ? 'text-hev-e-primary text-hev-e-primary-hover' + this.state.className : 'text-disabled'}
                    glyph="download"/>
            </NavItemT>
        );
    }
}

const downloadCounterSelector = createSelector([
    downloadsSelector,
    ordersSelector
], (downloads, orders) => ({
    downloads,
    orders
}));

const DownloadsCounterPlugin = connect(downloadCounterSelector, {
    onShowDownload: openDownloads
})(DownloadsCounter);

module.exports = {
    DownloadsCounterPlugin: assign(DownloadsCounterPlugin, {
        BrandNavbar: {
            name: 'downloads-counter',
            priority: 1
        }
    })
};
