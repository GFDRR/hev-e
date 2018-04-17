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
const {head} = require('lodash');
const {Grid, Nav, NavItem, Glyphicon} = require('react-bootstrap');
const ResizableModal = require('../../MapStore2/web/client/components/misc/ResizableModal');
const BorderLayout = require('../../MapStore2/web/client/components/layout/BorderLayout');
const Message = require('../../MapStore2/web/client/components/I18N/Message');
const loadingState = require('../../MapStore2/web/client/components/misc/enhancers/loadingState');
const {removeOrder, removeDownload, updateDownloadEmail, selectDownloadFormat, selectDownloadTab, downloadData, closeDownloads} = require('../actions/dataexploration');
const FilterPreview = require('../components/FilterPreview');
const {downloadEmailSelector, downloadFormatSelector, selectedDownloadTabSelector, ordersSelector, showDownloadsSelector, orderLoadingSelector} = require('../selectors/dataexploration');
const emptyState = require('../../MapStore2/web/client/components/misc/enhancers/emptyState');

const downloadSelector = createSelector([
    state => state.dataexploration && state.dataexploration.downloads,
    state => state.dataexploration && state.dataexploration.restoreDownloads,
    downloadEmailSelector,
    downloadFormatSelector,
    orderLoadingSelector
], (downloads, restoreDownloads, email, format, loading) => ({
    downloads,
    restoreDownloads,
    email,
    format,
    loading
}));

const connectDownload = connect(
    downloadSelector,
    {
        onUpdateEmail: updateDownloadEmail,
        onSelectType: selectDownloadFormat,
        onDownload: downloadData
    }
);

/*
const orderComponentSelector = createSelector([
    ordersSelector
], (orders) => ({
    orders
}));*/

const connectOrder = connect(
    () => ({}),
    {
        onRemove: removeOrder
    }
);

const Page = {
    download: {
        Head: connectDownload(require('./download/Head')),
        Body: connectDownload(loadingState(({loading}) => loading)(require('./download/Body'))),
        Column: ({download}) => (
            <div style={{order: -1}}>
                <FilterPreview
                    download={download}/>
            </div>)
    },
    order: {
        Head: connectOrder(require('./order/Head')),
        Body: connectOrder(emptyState(({orders=[]}) => orders.length === 0, {glyph: 'download', title: <Message msgId="heve.noMatchedDownloads"/>})(require('./order/Body')))
    }
};

class Download extends React.Component {
    static propTypes = {
        enabled: PropTypes.bool,
        onClose: PropTypes.func,
        onRemoveDownload: PropTypes.func,
        onSelectTab: PropTypes.func,
        downloadTab: PropTypes.string,
        orders: PropTypes.array,
        loading: PropTypes.bool
    };

    static defaultProps = {
        onClose: () => {},
        onRemoveDownload: () => {},
        onSelectTab: () => {},
        downloadTab: 'download',
        orders: []
    };

    state = {};

    componentWillUpdate(newProps) {
        if (this.props.orders.length > 0 && newProps.orders.length === 0) {
            this.props.onSelectTab('download');
        }
    }

    componentDidUpdate(newProps) {
        if (!this.props.enabled && newProps.enabled
            || this.props.downloadTab === 'download' && newProps.downloadTab === 'order') {
            this.setState({
                filterText: '',
                download: null
            });
        }
    }

    render() {
        const CurrentPage = Page[this.props.downloadTab];
        return (
            <span className="et-download-modal">
                <ResizableModal
                    size="lg"
                    title={<Glyphicon glyph="download"/>}
                    show={this.props.enabled}
                    clickOutEnabled={false}
                    onClose={() => this.props.onClose()}>
                    <BorderLayout
                        columns={CurrentPage.Column &&
                            <CurrentPage.Column
                                download={this.state.filterText || this.props.loading ? null : this.state.download}/>
                        }
                        header={[
                            <Grid fluid style={{width: '100%', padding: 0}}>
                                <Nav bsStyle="tabs" activeKey={this.props.downloadTab}>
                                    <NavItem eventKey="download" onClick={() => this.props.onSelectTab('download')}><Message msgId="heve.download"/></NavItem>
                                    <NavItem eventKey="order" disabled={this.props.orders.length === 0} onClick={() => this.props.onSelectTab('order')}><Message msgId="heve.order"/></NavItem>
                                </Nav>
                            </Grid>,
                            <CurrentPage.Head
                                filterText={this.state.filterText}
                                onUpdateFilter={filterText => this.setState({filterText})}
                                onRemoveDownload={value => {
                                    this.props.onRemoveDownload(value);
                                    this.setState({ download: null });
                                }}/>
                        ]}>
                        <CurrentPage.Body
                            orders={this.props.orders.filter(order => this.filterDownloads(order))}
                            download={this.state.download}
                            onFilter={item => this.filterDownloads(item)}
                            onSelectItem={download => this.setState({download})}
                            onRemoveDownload={value => {
                                this.props.onRemoveDownload(value);
                                this.setState({ download: null });
                            }}/>
                    </BorderLayout>
                </ResizableModal>
            </span>
        );
    }

    filterDownloads(item) {
        if (this.props.downloadTab === 'order') {
            return !this.state.filterText || (
                item.status && item.status.toLowerCase().indexOf(this.state.filterText.toLowerCase()) !== -1
                || head(item.order_items.filter(order => {
                    return order.layer.indexOf(this.state.filterText.toLowerCase()) !== -1
                    || order.status.indexOf(this.state.filterText.toLowerCase()) !== -1
                    || order.format.indexOf(this.state.filterText.toLowerCase()) !== -1;
                }))
            );
        }
        return !this.state.filterText || !item.properties || (item.properties
            && (item.properties.title && item.properties.title.toLowerCase().indexOf(this.state.filterText.toLowerCase()) !== -1
            || item.properties.description && item.properties.description.toLowerCase().indexOf(this.state.filterText.toLowerCase()) !== -1
            || item.properties.category && item.properties.category.toLowerCase().indexOf(this.state.filterText.toLowerCase()) !== -1)
        );
    }
}

const downloadPluginSelector = createSelector([
    showDownloadsSelector,
    selectedDownloadTabSelector,
    ordersSelector,
    orderLoadingSelector
], (enabled, downloadTab, orders, loading) => ({
    enabled,
    downloadTab,
    orders,
    loading
}));

const DownloadPlugin = connect(
    downloadPluginSelector,
    {
        onClose: closeDownloads,
        onRemoveDownload: removeDownload,
        onSelectTab: selectDownloadTab
    }
)(Download);

module.exports = {
    DownloadPlugin,
    reducers: {}
};
