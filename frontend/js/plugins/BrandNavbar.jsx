
/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const React = require('react');
const assign = require('object-assign');
const PropTypes = require('prop-types');
const { Navbar, Nav, NavItem /*, Glyphicon*/ } = require('react-bootstrap');
const ContainerDimensions = require('react-container-dimensions').default;
const toopltip = require('../../MapStore2/web/client/components/misc/enhancers/tooltip');
const ImgT = toopltip(({getSrc, width, href, ...props}) => <a href={href} target="_blank"><img {...props} src={getSrc(width)}/></a>);
// const NavItemT = toopltip(NavItem);
const {connect} = require('react-redux');
const {createSelector} = require('reselect');
const {SearchPlugin, epics, reducers} = require('../../MapStore2/web/client/plugins/Search');

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
        brandImages: PropTypes.array
    };

    static defaultProps = {
        brandImages: [
            {
                getSrc: width => width > 1092 ? '/static/dataexplorationtool/img/gfdrr-logo.svg' : '/static/dataexplorationtool/img/favicon.svg',
                tooltip: 'Global Facility for Disaster Reduction and Recovery',
                tooltipPosition: 'bottom',
                alt: 'GFDRR',
                href: 'https://www.gfdrr.org/'
            },
            {
                getSrc: () => '/static/dataexplorationtool/img/DfID-logo.svg',
                tooltip: 'Department for International Development',
                alt: 'DfDID',
                tooltipPosition: 'bottom',
                href: 'https://www.gov.uk/government/organisations/department-for-international-development'
            },
            {
                getSrc: width => width > 1092 ? '/static/dataexplorationtool/img/hev-e-extended-logo.svg' : '/static/dataexplorationtool/img/hev-e-logo.svg',
                alt: 'HEV-E'
            }
        ]
    };

    render() {
        return (
            <ContainerDimensions>
            {({width}) => (
                <Navbar className="et-brand-navbar">
                    <Navbar.Header>
                        <Navbar.Brand>
                            {this.props.brandImages.map(image => {
                                return <ImgT width={width} {...image}/>;
                            })}
                        </Navbar.Brand>
                        <Navbar.Toggle pullRight />
                    </Navbar.Header>
                    <Navbar.Collapse>
                        {width >= 767 && <Navbar.Form pullRight>
                            <SearchBar />
                        </Navbar.Form>}
                        <Nav pullRight>
                            <NavItem href="#/about">
                                About
                            </NavItem>
                            <NavItem href="#/support">
                                Support
                            </NavItem>
                            {/*<NavItem>
                                <SearchBar />
                            </NavItem>*/}
                            {/*<NavItemT
                                tooltip="Download collected data"
                                tooltipPosition="bottom">
                                <Glyphicon glyph="download"/>
                            </NavItemT>*/}
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

module.exports = {
    BrandNavbarPlugin: assign(
        BrandNavbar,
        {
            OmniBar: {
                name: 'brand',
                position: 1,
                tool: true,
                priority: 1
            }
        }
    ),
    reducers,
    epics
};
