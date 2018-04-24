
/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const React = require('react');
const PropTypes = require('prop-types');
const { Navbar, Nav, NavItem, Glyphicon } = require('react-bootstrap');
const ContainerDimensions = require('react-container-dimensions').default;
const toopltip = require('../../MapStore2/web/client/components/misc/enhancers/tooltip');
const ImgT = toopltip(({getSrc, width, href, inverse, ...props}) => <a href={href} target="_blank"><img {...props} src={getSrc({width, inverse})}/></a>);
const NavItemT = toopltip(NavItem);
const {connect} = require('react-redux');
const {createSelector} = require('reselect');
const {SearchPlugin, epics, reducers} = require('../../MapStore2/web/client/plugins/Search');
const Message = require('../../MapStore2/web/client/components/I18N/Message');
const {openDownloads} = require('../actions/dataexploration');
const {ordersSelector} = require('../selectors/dataexploration');
const {isEqual} = require('lodash');

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

class BrandNavbar extends React.Component {
    static propTypes = {
        brandImages: PropTypes.array,
        inverse: PropTypes.bool,
        onShowDownload: PropTypes.func,
        downloads: PropTypes.array,
        orders: PropTypes.array
    };

    static defaultProps = {
        brandImages: [
            {
                getSrc: ({width, inverse = ''}) => width > 1092 ? '/static/dataexplorationtool/img/gfdrr-logo' + inverse + '.svg' : '/static/dataexplorationtool/img/favicon' + inverse + '.svg',
                tooltip: 'Global Facility for Disaster Reduction and Recovery',
                tooltipPosition: 'bottom',
                alt: 'GFDRR',
                href: 'https://www.gfdrr.org/'
            },
            {
                getSrc: ({inverse = ''}) => '/static/dataexplorationtool/img/DfID-logo' + inverse + '.svg',
                tooltip: 'Department for International Development',
                alt: 'DfDID',
                tooltipPosition: 'bottom',
                href: 'https://www.gov.uk/government/organisations/department-for-international-development'
            },
            {
                getSrc: ({width, inverse = ''}) => width > 1092 ? '/static/dataexplorationtool/img/hev-e-extended-logo' + inverse + '.svg' : '/static/dataexplorationtool/img/hev-e-logo.svg',
                alt: 'HEV-E'
            }
        ],
        inverse: true,
        onToggleDownload: () => {},
        downloads: [],
        orders: []
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
        const inverseStr = this.props.inverse ? '-inverse' : '';
        const downloadEnabled = this.props.downloads.length > 0 || this.props.orders.length > 0;
        return (
            <ContainerDimensions>
            {({width}) => (
                <Navbar className="et-brand-navbar" inverse={this.props.inverse}>
                    <Navbar.Header>
                        <Navbar.Brand>
                            {this.props.brandImages.map(image => {
                                return <ImgT inverse={inverseStr} width={width} {...image}/>;
                            })}
                        </Navbar.Brand>
                        <Navbar.Toggle pullRight />
                    </Navbar.Header>
                    <Navbar.Collapse>
                        {width >= 767 && <Navbar.Form pullRight>
                            <SearchBar />
                        </Navbar.Form>}
                        <Nav pullRight>
                            <NavItemT
                                tooltipId={downloadEnabled ? 'heve.collectedData' : 'heve.noCollectedData'}
                                tooltipPosition="bottom"
                                onClick={() => downloadEnabled ? this.props.onShowDownload() : null}>
                                    {this.state.className !== ' et-animation' && this.props.downloads.length > 0 && <div style={{
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
                            <NavItem href="#/about">
                                <Message msgId="heve.about"/>
                            </NavItem>
                        </Nav>
                        {width < 767 && <Navbar.Form pullRight>
                            <SearchBar />
                        </Navbar.Form>}
                    </Navbar.Collapse>
                </Navbar>
            )}
            </ContainerDimensions>
        );
    }
}

const brandNavbarSelector = createSelector([
    state => state.dataexploration && state.dataexploration.downloads,
    ordersSelector
], (downloads, orders) => ({
    downloads,
    orders
}));

const BrandNavbarPlugin = connect(
    brandNavbarSelector,
    {
        onShowDownload: openDownloads
    }
)(BrandNavbar);

module.exports = {
    BrandNavbarPlugin,
    reducers,
    epics
};
