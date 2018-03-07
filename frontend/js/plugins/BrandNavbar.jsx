
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
const { Navbar, Nav, NavItem, Glyphicon } = require('react-bootstrap');
const ContainerDimensions = require('react-container-dimensions').default;
const toopltip = require('../../MapStore2/web/client/components/misc/enhancers/tooltip');
const ImgT = toopltip(({getSrc, width, href, ...props}) => <a href={href}><img {...props} src={getSrc(width)}/></a>);
const NavItemT = toopltip(NavItem);

class BrandNavbar extends React.Component {
    static propTypes = {
        brandImages: PropTypes.array
    };

    static defaultProps = {
        brandImages: [
            {
                getSrc: width => width > 1024 ? '/static/dataexplorationtool/img/hev-e-extended-logo.svg' : '/static/dataexplorationtool/img/hev-e-logo.svg',
                alt: 'HEV-E',
                href: 'https://www.gfdrr.org/'
            },
            {
                getSrc: () => '/static/dataexplorationtool/img/gfdrr-logo.svg',
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
                        <Nav>
                            <NavItem href="#/about">
                                About
                            </NavItem>
                            <NavItemT
                                tooltip="Download collected data"
                                tooltipPosition="bottom">
                                <Glyphicon glyph="download"/>
                            </NavItemT>
                        </Nav>
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
    reducers: {}
};
