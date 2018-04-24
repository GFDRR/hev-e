
/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const React = require('react');
const PropTypes = require('prop-types');
const { Navbar, Nav, NavItem } = require('react-bootstrap');
const ContainerDimensions = require('react-container-dimensions').default;
const toopltip = require('../../MapStore2/web/client/components/misc/enhancers/tooltip');
const ImgT = toopltip(({getSrc, width, href, inverse, ...props}) => <a href={href} target="_blank"><img {...props} src={getSrc({width, inverse})}/></a>);
const Message = require('../../MapStore2/web/client/components/I18N/Message');
const {head} = require('lodash');

class BrandNavbar extends React.Component {
    static propTypes = {
        brandImages: PropTypes.array,
        inverse: PropTypes.bool,
        items: PropTypes.array,
        links: PropTypes.array
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
        links: []
    };

    getPluginByName = name => {
        return this.props.items && head(this.props.items.filter(item => item.plugin && item.name === name)) || null;
    }

    render() {
        const inverseStr = this.props.inverse ? '-inverse' : '';
        const Search = this.getPluginByName('search');
        const DownloadsCounter = this.getPluginByName('downloads-counter');
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
                        <Navbar.Toggle />
                    </Navbar.Header>
                    <Navbar.Collapse>
                        {width >= 767 && Search && <Navbar.Form pullRight>
                            <Search.plugin pluginCfg={Search.cfg} key={Search.name} items={Search.items || []}/>
                        </Navbar.Form>}
                        <Nav pullRight>
                            {DownloadsCounter && <DownloadsCounter.plugin pluginCfg={DownloadsCounter.cfg} key={DownloadsCounter.name} items={DownloadsCounter.items || []}/>}
                            {this.props.links && this.props.links.map((link, idx) => (
                                <NavItem key={idx} href={link.href}>
                                    <Message msgId={link.msgId}/>
                                </NavItem>
                            ))}
                        </Nav>
                        {width < 767 && Search && <Navbar.Form pullRight>
                            <Search.plugin pluginCfg={Search.cfg} key={Search.name} items={Search.items || []}/>
                        </Navbar.Form>}
                    </Navbar.Collapse>
                </Navbar>
            )}
            </ContainerDimensions>
        );
    }
}

module.exports = {
    BrandNavbarPlugin: BrandNavbar
};
