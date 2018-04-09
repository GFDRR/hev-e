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
const {Grid, Row, Col, Form, FormGroup, FormControl: FormControlB, InputGroup} = require('react-bootstrap');
const ResizableModal = require('../../MapStore2/web/client/components/misc/ResizableModal');
const localizeProps = require('../../MapStore2/web/client/components/misc/enhancers/localizedProps');
const Filter = localizeProps('filterPlaceholder')(require('../../MapStore2/web/client/components/misc/Filter'));
const FormControl = localizeProps('placeholder')(FormControlB);
const BorderLayout = require('../../MapStore2/web/client/components/layout/BorderLayout');
const Message = require('../../MapStore2/web/client/components/I18N/Message');
const emptyState = require('../../MapStore2/web/client/components/misc/enhancers/emptyState');
const SideGrid = emptyState(({items=[]}) => items.length === 0, {glyph: 'download', title: <Message msgId="heve.noMatchedDownloads"/>})(require('../../MapStore2/web/client/components/misc/cardgrids/SideGrid'));
const Toolbar = require('../../MapStore2/web/client/components/misc/toolbar/Toolbar');
const {setControlProperty} = require('../../MapStore2/web/client/actions/controls');
const {removeDownload, updateDownloadEmail} = require('../actions/dataexploration');
const FilterPreview = require('../components/FilterPreview');
const {downloadEmailSelector} = require('../selectors/dataexploration');

const validateEmail = email => email && /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/.test(String(email).toLowerCase());

class Download extends React.Component {
    static propTypes = {
        enabled: PropTypes.bool,
        downloadOptions: PropTypes.array,
        downloads: PropTypes.array,
        onClose: PropTypes.func,
        onRemoveDownload: PropTypes.func,
        restoreDownloads: PropTypes.array,
        onUpdateEmail: PropTypes.func,
        email: PropTypes.string
    };

    static defaultProps = {
        downloads: [],
        downloadOptions: [{
            value: 'shapefile',
            label: 'shapefile'
        }, {
            value: 'geopackage',
            label: 'geopackage'
        }],
        onClose: () => {},
        onRemoveDownload: () => {},
        onUpdateEmail: () => {},
        email: ''
    };

    state = {};

    componentDidUpdate(newProps) {
        if (!this.props.enabled && newProps.enabled) {
            this.setState({
                filterText: '',
                download: null
            });
        }
    }

    render() {
        return (
            <span className="et-download-modal">
                <ResizableModal
                    size="lg"
                    title={<h4>Download data</h4>}
                    show={this.props.enabled}
                    clickOutEnabled={false}
                    onClose={() => this.props.onClose()}>
                    <BorderLayout
                        columns={
                            <div style={{order: -1}}>
                                <FilterPreview
                                    download={this.state.filterText ? null : this.state.download}/>
                            </div>
                        }
                        header={
                            <Grid className="et-download-head" fluid style={{width: '100%'}}>
                                <Row>
                                    <Col xs={12}>
                                        <Filter
                                            filterText={this.state.filterText || ''}
                                            filterPlaceholder="heve.textSearchPlaceholder"
                                            disabled={!this.props.downloads || this.props.downloads.length === 0}
                                            onFilter={filterText => {
                                                this.setState({
                                                    filterText
                                                });
                                            }}/>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col xs={12}>
                                        <Form inline>
                                            <FormGroup
                                                validationState={validateEmail(this.props.email) ? 'success' : ''}
                                                className="mapstore-filter"
                                                style={{width: '100%'}}>
                                                <InputGroup>
                                                    <FormControl
                                                        disabled={!this.props.downloads || this.props.downloads.length === 0}
                                                        placeholder="heve.email"
                                                        value={this.props.email}
                                                        type="text"
                                                        onChange={e => {
                                                            this.props.onUpdateEmail(e.target.value);
                                                        }}/>
                                                    <InputGroup.Addon>@</InputGroup.Addon>
                                                </InputGroup>
                                            </FormGroup>
                                        </Form>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col xs={12}>
                                        <Form inline>
                                            <FormGroup controlId="formInlineName" className="pull-left">
                                                <Toolbar
                                                    btnDefaultProps={
                                                        {
                                                            className: 'square-button-md no-border',
                                                            onClick: e => {
                                                                e.stopPropagation();
                                                            }
                                                        }
                                                    }
                                                    buttons={
                                                        [
                                                            {
                                                                glyph: 'undo',
                                                                tooltipId: 'heve.restoreLastChanges',
                                                                visible: !!this.props.restoreDownloads,
                                                                onClick: e => {
                                                                    e.stopPropagation();
                                                                    this.props.onRemoveDownload('restore');
                                                                }
                                                            }
                                                        ]
                                                    }/>
                                            </FormGroup>
                                            <FormGroup controlId="formInlineName" className="pull-right">
                                                <span><Message msgId="heve.downloadFormat" />: </span>{' '}
                                                <FormControl
                                                    disabled={!this.props.downloads || this.props.downloads.length === 0}
                                                    componentClass="select"
                                                    onChange={() => {}}>
                                                {this.props.downloadOptions.map(option => (<option value={option.value}><Message msgId={'heve.' + option.label} /></option>))}
                                                </FormControl>{' '}
                                                <Toolbar
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
                                                                tooltipId: 'heve.removeAll',
                                                                disabled: !this.props.downloads || this.props.downloads.length === 0,
                                                                onClick: () => {
                                                                    this.props.onRemoveDownload('all');
                                                                    this.setState({
                                                                        download: null
                                                                    });
                                                                }
                                                            },
                                                            {
                                                                glyph: 'download',
                                                                tooltipId: 'heve.downloadAll',
                                                                disabled: !this.props.downloads || this.props.downloads.length === 0,
                                                                onClick: () => {}
                                                            }
                                                        ]
                                                    }/>
                                            </FormGroup>
                                        </Form>
                                    </Col>
                                </Row>
                            </Grid>
                        }>
                        <SideGrid
                            items={this.props.downloads.filter((item) => this.filterDownloads(item)).map(item => ({
                                preview: <i className={'fa fa-4x text-center fa-' + item.icon}/>,
                                title: item.properties && item.properties.title && <span>{item.properties.title}</span>,
                                description: item.properties && item.properties.description && <span>{item.properties.description}</span>,
                                caption: item.properties && item.properties.category && <span>{item.properties.category}</span>,
                                selected: this.state.download && this.state.download.id === item.id,
                                onClick: () => {
                                    this.setState({
                                        download: this.state.download && item.id === this.state.download.id ? null : {...item}
                                    });
                                },
                                tools: (<Toolbar
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
                                                    this.props.onRemoveDownload(item.downloadId);
                                                    this.setState({
                                                        download: null
                                                    });
                                                }
                                            },
                                            {
                                                glyph: 'download',
                                                tooltipId: 'heve.download',
                                                onClick: e => {
                                                    e.stopPropagation();
                                                    this.props.onRemoveDownload('restore');
                                                }
                                            }
                                        ]
                                    }/>)
                            }))}/>
                    </BorderLayout>
                </ResizableModal>
            </span>
        );
    }

    filterDownloads(item) {
        return !this.state.filterText || !item.properties || (item.properties
            && (item.properties.title && item.properties.title.toLowerCase().indexOf(this.state.filterText.toLowerCase()) !== -1
            || item.properties.description && item.properties.description.toLowerCase().indexOf(this.state.filterText.toLowerCase()) !== -1
            || item.properties.category && item.properties.category.toLowerCase().indexOf(this.state.filterText.toLowerCase()) !== -1)
        );
    }
}

const downloadSelector = createSelector([
    state => state.controls && state.controls.downloadData && state.controls.downloadData.enabled,
    state => state.dataexploration && state.dataexploration.downloads,
    state => state.dataexploration && state.dataexploration.restoreDownloads,
    downloadEmailSelector
], (enabled, downloads, restoreDownloads, email) => ({
    enabled,
    downloads,
    restoreDownloads,
    email
}));

const DownloadPlugin = connect(
    downloadSelector,
    {
        onClose: setControlProperty.bind(null, 'downloadData', 'enabled', false),
        onRemoveDownload: removeDownload,
        onUpdateEmail: updateDownloadEmail
    }
)(Download);

module.exports = {
    DownloadPlugin,
    reducers: {}
};
