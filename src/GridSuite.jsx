/* @flow */
"use strict";

// Common Modules...
import React, { PropTypes } from 'react';

// Own Modules...
import GridCore from './GridCore.jsx';

// Local Fields...


// Beginning of Logic!
/**
 *
 */
class GridSuite extends React.Component {
  /**
   *
   * @param props {Object}
   * @param context {Object}
   */
  constructor (props: Object, context: Object): void {
    super(props, context);

    const templates = this._handlePropsChildrenAsTemplates(props.children);
    this.state = {
      templates: templates.templates
    };
  }

  componentWillMount () {
  }

  componentDidMount () {

  }

  componentWillReceiveProps (nextProps: Object, nextContext: Object) {

    this.setState({
      templates: this._handlePropsChildrenAsTemplates(nextProps.children)
    });
  }

  componentWillUpdate (nextProps: Object, nextState: Object) {

  }

  componentDidUpdate () {
  }

  componentWillUnmount () {

  }

  render (): React.Element {
    const { className, style } = this.props;

    const mergedClassNames = `grid-suite ${ className }`;
    const mergedStyles = {
        ...style
    };


    return (
        <div className={ mergedClassNames }
             style={ mergedStyles } >
        </div>
    );
  }

  /**
   *
   * @param children {Array<React.Element>}
   * @private
   */
  _handlePropsChildrenAsTemplates (children: Array<React.Element>): { grid: React.Element, templates: Array<React.Element> } {
      React.Children.forEach((child) => {
        switch (child.template) {
          case 'main':
          case null:
          case undefined:
            break;

          default:
        }
      });
  }
}

GridSuite.propTypes = {
  children: PropTypes.arrayOf(PropTypes.element),

  /**
   * Flag: GridItem Contents List
   */
  items: PropTypes.array.isRequired
};

GridSuite.defaultProps = {

};

GridSuite.displayName = "GridSuiteLayout";

export default GridSuite;