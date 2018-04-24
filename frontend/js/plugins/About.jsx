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
const {Grid, Row, Col} = require('react-bootstrap');
const {contentSelector} = require('../selectors/about');
const ReactMarkdown = require('react-markdown');

class About extends React.Component {
    static propTypes = {
        content: PropTypes.node
    };

    render() {
        return (
            <Grid>
                <Row>
                    <Col xs={12}>
                        <ReactMarkdown source={this.props.content}/>
                    </Col>
                </Row>
            </Grid>
        );
    }
}


const selector = createSelector([
    contentSelector
], (content) => ({
    content
}));

const AboutPlugin = connect(selector)(About);

module.exports = {
    AboutPlugin,
    reducers: {
        about: require('../reducers/about')
    },
    epics: require('../epics/about')
};
