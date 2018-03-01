
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
// const {connect} = require('react-redux');

class BrandNavbar extends React.Component {
    static propTypes = {
        brandImages: PropTypes.array
    };

    static defaultProps = {
        brandImages: [
            {
                src: '/static/dataexplorationtool/img/gfdrr-logo.svg'
            },
            {
                src: '/static/dataexplorationtool/img/wb-logo.svg'
            }
        ]
    };

    render() {
        return (
            <Navbar className="et-brand-navbar">
                <Navbar.Header>
                    <Navbar.Brand>
                        {this.props.brandImages.map(image => {
                            return <img {...image}/>;
                        })}
                        <a>Data Exploration Tool</a>
                    </Navbar.Brand>
                </Navbar.Header>
                <Nav>
                    <NavItem>
                        About
                    </NavItem>
                    <NavItem>
                        <Glyphicon glyph="download"/>
                    </NavItem>
                </Nav>
            </Navbar>
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
