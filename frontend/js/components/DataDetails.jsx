
/*
 * Copyright 2018, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const React = require('react');
const PropTypes = require('prop-types');
const {Glyphicon} = require('react-bootstrap');
const ResizableModal = require('../../MapStore2/web/client/components/misc/ResizableModal');
const ContainerDimensions = require('react-container-dimensions').default;

class DataDetails extends React.Component {
    static propTypes = {
        relatedCards: PropTypes.array
    };

    static defaultProps = {
        relatedCards: [
            {
                title: 'Data',
                preview: <i className="fa fa-building fa-4x"></i>
            },
            {
                title: 'Data',
                preview: <i className="fa fa-building fa-4x"></i>
            },
            {
                title: 'Data',
                preview: <i className="fa fa-building fa-4x"></i>
            },
            {
                title: 'Data',
                preview: <i className="fa fa-building fa-4x"></i>
            },
            {
                title: 'Data',
                preview: <i className="fa fa-building fa-4x"></i>
            }
        ]
    };

    render() {
        return (
            <ContainerDimensions>
            { ({width}) =>
                <div style={{
                    position: 'relative',
                    width: width,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'}}>
                    <ResizableModal show>
                        {/**/}
                    </ResizableModal>
                    <div className="et-related-head">
                        <h4>Related data</h4>
                    </div>
                    <div className="et-related-list">
                        <div className="et-related-list-container">
                        {
                            this.props.relatedCards.map(card => {
                                return (
                                    <div className="ms-square-card">
                                        <div className="ms-square-card-container">
                                            <div className="ms-top-card">
                                                <h5>{card.title}</h5>
                                                <Glyphicon glyph="info-sign"/>
                                            </div>
                                            <div className="ms-preview-card">
                                                {card.preview}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        }
                        </div>
                    </div>
                </div>
            }
            </ContainerDimensions>
        );
    }
}

module.exports = DataDetails;
