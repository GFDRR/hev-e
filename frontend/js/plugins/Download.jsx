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
const {Grid, Nav, NavItem, Glyphicon, Row, Col} = require('react-bootstrap');
const ResizableModal = require('../../MapStore2/web/client/components/misc/ResizableModal');
const BorderLayout = require('../../MapStore2/web/client/components/layout/BorderLayout');
const Message = require('../../MapStore2/web/client/components/I18N/Message');
const loadingState = require('../../MapStore2/web/client/components/misc/enhancers/loadingState');
const {removeOrder, removeDownload, updateDownloadEmail, selectDownloadFormat, selectDownloadTab, downloadData, closeDownloads, selectDownload} = require('../actions/dataexploration');
const FilterPreview = require('../components/FilterPreview');
const {downloadEmailSelector, downloadFormatSelector, selectedDownloadTabSelector, ordersSelector, showDownloadsSelector, orderLoadingSelector, downaloadSelector} = require('../selectors/dataexploration');
const emptyState = require('../../MapStore2/web/client/components/misc/enhancers/emptyState');
const SideGrid = require('../../MapStore2/web/client/components/misc/cardgrids/SideGrid');
const Toolbar = require('../../MapStore2/web/client/components/misc/toolbar/Toolbar');

const tooltip = require('../../MapStore2/web/client/components/misc/enhancers/tooltip');
const SpanT = tooltip(({children, ...props}) => <span {...props}>{children}</span>);

const getDownloads = downloads => {
    const vulnerabilities = downloads.filter(download => download.dataset === 'vulnerabilities');
    const others = downloads.filter(download => download.dataset !== 'vulnerabilities');
    const vulnerabilitiesDownload = vulnerabilities.length > 0 && {
        availableFormats: vulnerabilities[0].availableFormats,
        title: 'Vulnerabilities download list',
        description: 'All vulnerabilities will be stored in a single file',
        caption: 'click to display vulnerabilities download list',
        icon: 'fa-cog',
        vulnerabilities
    };
    return vulnerabilitiesDownload ? [...others, vulnerabilitiesDownload] : [...others];
};

const downloadSelector = createSelector([
    state => state.dataexploration && state.dataexploration.downloads,
    state => state.dataexploration && state.dataexploration.restoreDownloads,
    downloadEmailSelector,
    downloadFormatSelector,
    orderLoadingSelector
], (downloads, restoreDownloads, email, format, loading) => ({
    downloads: getDownloads(downloads),
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
}));
*/

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
        Column: ({download, onRemoveDownload = () => {}}) => (
            <div style={{order: -1}}>
                {download && !download.vulnerabilities && <FilterPreview
                    download={download}/>}
                {download && download.vulnerabilities &&
                    <div className="et-filter">
                        <Grid fluid>
                            <Row>
                                <Col xs={12}>
                                    <h4><Message msgId="heve.vulnerabilitiesList"/></h4>
                                </Col>
                            </Row>
                        </Grid>
                        <Grid fluid>
                            <SideGrid
                                size="sm"
                                items={
                                    download.vulnerabilities.map(item => ({
                                        className: 'et-no-selectable',
                                        title: <SpanT tooltip={item.title} style={{pointerEvents: 'auto', cursor: 'default'}}>{item.title}</SpanT>,
                                        preview: item.icon && <i className={'fa text-center ' + item.icon}/> || <i className="fa text-center fa-cog"/>,
                                        tools: <Toolbar
                                            btnDefaultProps={
                                                {
                                                    className: 'square-button-md',
                                                    bsStyle: 'primary'
                                                }
                                            }
                                            buttons={
                                                [
                                                    {
                                                        glyph: 'trash',
                                                        tooltipId: 'heve.removeDownload',
                                                        onClick: e => {
                                                            e.stopPropagation();
                                                            onRemoveDownload(item.downloadId);
                                                        }
                                                    }
                                                ]
                                            }/>
                                    }))
                                }/>
                        </Grid>
                    </div>
                }
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
        loading: PropTypes.bool,
        download: PropTypes.object,
        onSelectItem: PropTypes.func,
        filterKeys: PropTypes.array
    };

    static defaultProps = {
        onClose: () => {},
        onRemoveDownload: () => {},
        onSelectTab: () => {},
        downloadTab: 'download',
        orders: [],
        download: null,
        onSelectItem: () => {},
        filterKeys: ['title', 'description', 'caption', 'type']
    };

    state = {};

    componentWillUpdate(newProps) {
        if (this.props.orders.length > 0 && newProps.orders.length === 0) {
            this.props.onSelectTab('download');
        }
        if (this.props.download && newProps.download
        && this.props.download.vulnerabilities && newProps.download.vulnerabilities
        && this.props.download.vulnerabilities.length > 0 && newProps.download.vulnerabilities.length === 0) {
            this.props.onSelectItem(null);
        }
    }

    componentDidUpdate(newProps) {
        if (!this.props.enabled && newProps.enabled
            || this.props.downloadTab === 'download' && newProps.downloadTab === 'order') {
            this.setState({filterText: ''});
            this.props.onSelectItem(null);
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
                                download={this.state.filterText || this.props.loading ? null : this.props.download}
                                onRemoveDownload={this.props.onRemoveDownload}/>
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
                                    this.props.onSelectItem(null);
                                }}/>
                        ]}>
                        <CurrentPage.Body
                            orders={this.props.orders.filter(order => this.filterDownloads(order))}
                            download={this.props.download}
                            onFilter={item => this.filterDownloads(item)}
                            onSelectItem={download => this.props.onSelectItem(download)}
                            onRemoveDownload={value => {
                                this.props.onRemoveDownload(value);
                                this.props.onSelectItem(null);
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
                    return order.layer && order.layer.indexOf(this.state.filterText.toLowerCase()) !== -1
                    || order.status && order.status.indexOf(this.state.filterText.toLowerCase()) !== -1
                    || order.format && order.format.indexOf(this.state.filterText.toLowerCase()) !== -1;
                }))
            );
        }
        return !this.state.filterText || head(this.props.filterKeys.filter(key => item[key] && item[key].indexOf && item[key].indexOf(this.state.filterText.toLowerCase()) !== -1));
    }
}

const downloadPluginSelector = createSelector([
    showDownloadsSelector,
    selectedDownloadTabSelector,
    ordersSelector,
    orderLoadingSelector,
    downaloadSelector
], (enabled, downloadTab, orders, loading, download) => ({
    enabled,
    downloadTab,
    orders,
    loading,
    download
}));

const DownloadPlugin = connect(
    downloadPluginSelector,
    {
        onClose: closeDownloads,
        onRemoveDownload: removeDownload,
        onSelectTab: selectDownloadTab,
        onSelectItem: selectDownload
    }
)(Download);

module.exports = {
    DownloadPlugin,
    reducers: {}
};
