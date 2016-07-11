/* @flow */
"use strict";

// Common Modules...
import React, { PropTypes } from 'react';

// Own Modules...


// Local Fields...


// Beginning of Logic!

class SuiteBlender extends React.Component {
  /**
   *
   * @param props {Object}
   * @param context {Object}
   */
  constructor (props: Object, context: Object) {
    super(props, context);

    this.state = {

    };

    this._adjustLayoutSize = this._adjustLayoutSize.bind(this);
  }

  componentWillMount () {

  }

  componentDidMount () {

    this._adjustLayoutSize();
  }

  componentWillReceiveProps (nextProps: Object, nextContext: Object) {

  }

  componentWillUpdate (nextProps: Object, nextState: Object) {

  }

  componentDidUpdate () {

    this._adjustLayoutSize();
  }

  componentWillUnmount () {

  }

  render (): React.Element {

  }

  /**
   *
   */
  _adjustLayoutSize () {

  }
}

SuiteBlender.propTypes = {

};

SuiteBlender.defaultProps = {

};

SuiteBlender.displayName = "SuiteBlenderLayout";

export default SuiteBlender;