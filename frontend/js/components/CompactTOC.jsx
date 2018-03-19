/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const React = require('react');
const PropTypes = require('prop-types');
const {Grid, Row, Col, Glyphicon} = require('react-bootstrap');
const BorderLayout = require('../../MapStore2/web/client/components/layout/BorderLayout');

const localizeProps = require('../../MapStore2/web/client/components/misc/enhancers/localizedProps');
const Filter = localizeProps('filterPlaceholder')(require('../../MapStore2/web/client/components/misc/Filter'));
const tooltip = require('../../MapStore2/web/client/components/misc/enhancers/tooltip');
const emptyState = require('../../MapStore2/web/client/components/misc/enhancers/emptyState');
const Message = require('../../MapStore2/web/client/components/I18N/Message');
const GlyphiconT = tooltip(Glyphicon);

const draggableComponent = require('../enhancers/draggableComponent');
const draggableContainer = require('../enhancers/draggableContainer');
const SideCard = require('../../MapStore2/web/client/components/misc/cardgrids/SideCard');
const SideGrid = require('../../MapStore2/web/client/components/misc/cardgrids/SideGrid');
const DraggableSideCard = draggableComponent(SideCard);
const DraggableSideGrid = emptyState(({items=[]}) => items.length === 0, {glyph: '1-layer', title: <Message msgId="heve.noLayer"/>})(draggableContainer(SideGrid));
const Slider = require('react-nouislider');
const {isNil} = require('lodash');

class CompactTOC extends React.Component {

    static propTypes = {
        enabled: PropTypes.bool,
        onClose: PropTypes.func,
        layers: PropTypes.array,
        onUpdateNode: PropTypes.func,
        onRemove: PropTypes.func,
        onSort: PropTypes.func,
        onShowDetails: PropTypes.func,
        currentDetails: PropTypes.object
    };

    static defaultProps = {
        enabled: false,
        onClose: () => {},
        layers: [],
        onUpdateNode: () => {},
        onRemove: () => {},
        onSort: () => {},
        onShowDetails: () => {},
        currentDetails: null
    };

    state = {
        filterText: ''
    }

    render() {
        const isDraggable = !this.state.filterText && this.props.layers.length > 1;
        return this.props.enabled ? (
            <div key="et-compact-toc" className="et-compact-toc">
                <BorderLayout
                    header={
                        <Grid fluid style={{width: '100%'}}>
                            <Row>
                                <Col xs={12}>
                                    <Glyphicon
                                        className="et-close pull-right"
                                        glyph="1-close"
                                        onClick={() => this.props.onClose()}/>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={12}>
                                    <Filter
                                        filterText={this.state.filterText || ''}
                                        filterPlaceholder="heve.filterLayers"
                                        onFilter={filterText => {
                                            this.setState({
                                                filterText
                                            });
                                        }}/>
                                </Col>
                            </Row>
                            <br/>
                        </Grid>
                    }>
                    <DraggableSideGrid
                        isDraggable={isDraggable}
                        size="sm"
                        cardComponent={DraggableSideCard}
                        onSort={(currentPos, previousPos) => {
                            this.props.onSort(currentPos, previousPos);
                        }}
                        items={this.props.layers.filter(layer => !this.state.filterText || layer.title.toLowerCase().indexOf(this.state.filterText.toLocaleLowerCase()) !== -1).map(layer => ({
                            preview: <span>
                                {isDraggable && <GlyphiconT
                                    glyph="menu-hamburger"
                                    className="ms-grab"/>}
                                {!layer.loadingError ? (
                                    <GlyphiconT
                                    glyph={layer.visibility ? 'eye-open' : 'eye-close'}
                                    tooltipId={layer.visibility ? 'heve.hideLayer' : 'heve.showLayer'}
                                    className="text-center"
                                    onClick={e => {
                                        e.stopPropagation();
                                        this.props.onUpdateNode(layer.id, 'layers', {visibility: !layer.visibility});
                                    }}/>)
                                    : (
                                    <GlyphiconT
                                        glyph="exclamation-mark"
                                        tooltipId="heve.layerError"
                                        className="text-center text-danger"/>
                                    )}
                            </span>,
                            title: (<span>{layer.title}</span>),
                            className: `${layer.visibility ? '' : ' ms-card-hide'}${layer.loadingError ? ' ms-card-error' : ''}`,
                            tools: <span>
                                {layer.title === 'Urban Environment' && <GlyphiconT
                                    glyph="filter"
                                    className="text-hev-e-primary"
                                    tooltipId="heve.layerHasFilter"
                                    />}
                                {!layer.loading ? (
                                <GlyphiconT
                                    glyph="trash"
                                    tooltipId="heve.removeLayer"
                                    onClick={e => {
                                        e.stopPropagation();
                                        this.props.onRemove(layer.id);
                                    }}/>
                            ) : <div style={{width: 16, height: 16}}><div className="mapstore-small-size-loader" /></div>}
                            </span>,
                            onClick: () => {
                                if (layer.loadingError) {
                                    return null;
                                }
                                if (this.props.currentDetails && this.props.currentDetails.properties.name === layer.name) {
                                    this.props.onShowDetails(null);
                                } else {
                                    this.props.onShowDetails(layer.record);
                                }
                            },
                            dataId: layer.id,
                            selected: this.props.currentDetails && this.props.currentDetails.properties.name === layer.name || false,
                            body: !layer.loadingError ? (<div className="mapstore-slider" onClick={(e) => { e.stopPropagation(); }}>
                                <Slider
                                    disabled={!layer.visibility}
                                    start={[isNil(layer.opacity) ? 100 : layer.opacity * 100 ]}
                                    range={{min: 0, max: 100}}
                                    onChange={(value) => {
                                        this.props.onUpdateNode(layer.id, 'layers', {opacity: (value[0] / 100).toFixed(2)});
                                    }}/>
                            </div>) : null
                        }))}/>
                </BorderLayout>
            </div>
        ) : <div key="et-compact-toc" className="et-compact-toc" style={{width: 0}}/>;
    }
}

module.exports = CompactTOC;
