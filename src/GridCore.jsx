/* @flow */
"use strict";

// Common Modules...
import _ from 'lodash';
import React, { PropTypes } from 'react';

// Own Modules...
import GridItem from './GridItem.jsx';
import { bindHandlers } from 'utils/GridUtils';

// Local Fields...
const noop = function () {
  // no-operations
};


// Beginning of Logic!!
/**
 *
 */
class GridCore extends React.Component {
  /**
   *
   * @param props {Object}
   * @param context {Object}
   */
  constructor (props: Object, context: Object) {
    super(props, context);

    this.state = {
      matrix: null
    };

    bindHandlers(this, [
      'onDragStart',
      'onDragging',
      'onDragFinish',
      'onResizeStart',
      'onResizing',
      'onResizeFinish',
      'onItemPush',
      'onItemPull'
    ]);
  }

  componentWillMount () {

  }

  componentDidMount () {

  }

  componentWillReceiveProps (nextProps: Object, nextContext: Object) {

  }

  componentWillUpdate (nextProps: Object, nextState: Object) {

  }

  componentDidUpdate () {

  }

  componentWillUnmount () {

  }

  render (): React.Element {
    const { className, style } = this.props;
    const mergedStyle = {

        ...style
    };


    return (
        <div className={ `grid-suite ${className}` }
             style={ mergedStyle } >
          { this._drawGridItems(this.props.itemContents) }
          { this._drawPlaceholder() }
        </div>
    );
  }

  /**
   *
   * @param itemContents {Array<React.Element>}
   * @returns {Array<GridItem>}
   * @private
   */
  _drawGridItems (itemContents: Array<React.Element>): Array<GridItem>  {
    return React.Children.map(itemContents, (itemContent: React.Element): GridItem => {
      return (
        <GridItem >
          { itemContent }
        </GridItem>
      );
    });
  }

  /**
   * @returns {GridItem || null}
   * @private
   */
  _drawPlaceholder (): React.Element {
    const {} = this.state;

    return (
      <GridItem >

      </GridItem>
    );
  }

  /**
   *
   * @param i {string} ID of GridItem
   * @param x {number} X position of drag movement
   * @param y {number} Y position of drag movement
   * @param event {Object} Drag Event
   */
  onDragStart (id: string, x: number, y: number, event: Object) {

    this.props.onDragStart();
  }

  /**
   *
   * @param id {string} ID of GridItem
   * @param x {number} X position of drag movement
   * @param y {number} Y position of drag movement
   * @param event {Object} Drag Event
   */
  onDragging (id: string, x: number, y: number, event: Object) {

    this.props.onDragging();
  }

  /**
   *
   * @param id {string} ID of GridItem
   * @param x {number} X position of drag movement
   * @param y {number} Y position of drag movement
   * @param event {Object} Drag Event
   */
  onDragFinish (id: string, x: number, y: number, event: Object) {

    this.props.onDragFinish();
  }

  /**
   *
   * @param id {string} ID of GridItem
   * @param w {number} width of resize movement
   * @param h {number} height of resize movement
   * @param event {Object} Resize Event
   */
  onResizeStart (id: string, w: number, h: number, event: Object) {

    this.props.onResizeStart();
  }

  /**
   *
   * @param id {string} ID of GridItem
   * @param w {number} width of resize movement
   * @param h {number} height of resize movement
   * @param event {Object} Resize Event
   */
  onResizing (id: string, w: number, h: number, event: Object) {

    this.props.onResizing();
  }

  /**
   *
   * @param id {string} ID of GridItem
   * @param w {number} width of resize movement
   * @param h {number} height of resize movement
   * @param event {Object} Resize Event
   */
  onResizeFinish (id: string, w: number, h: number, event: Object) {

    this.props.onResizeFinish();
  }

  /**
   *
   * @param item {Object} item that pushed-in
   */
  onItemPush (item: Object) {

    this.props.onItemPush(item);
  }

  /**
   *
   * @param item {Object} item that pulled-out
   */
  onItemPull (item: Object) {

    this.props.onItemPull(item);
  }
}

GridCore.propTypes = {
  /**
   * ClassName
   */
  className: PropTypes.string,
  /**
   * Style Object
   */
  style: PropTypes.object,
  /**
   * Grid Width (px)
   */
  width: PropTypes.number,
  /**
   * Grid Cols
   */
  cols: PropTypes.number,
  /**
   * Grid Template
   */
  template: PropTypes.string,

  /**
   * GridItemContents
   */
  itemContents: PropTypes.arrayOf(PropTypes.node),

  /**
   * Flag: Draggable
   */
  isDraggable: PropTypes.bool,
  /**
   * Flag: Resizable
   */
  isResizable: PropTypes.bool,
  /**
   * Flag: Animation Enable
   */
  isAnimationEnabled: PropTypes.bool,
  /**
   * Flag: Responsive Mode
   */
  responsive: PropTypes.boolean,
  /**
   * Flag: Arrangement Algorithm
   */
  arrangement: PropTypes.oneOf([PropTypes.string, PropTypes.func]),

  /**
   * Callback: when drag starts
   */
  onDragStart: PropTypes.func,
  /**
   * Callback: on each drag movement
   */
  onDragging: PropTypes.func,
  /**
   * Callback: when drag is finished
   */
  onDragFinish: PropTypes.func,
  /**
   * Callback: when resize starts
   */
  onResizeStart: PropTypes.func,
  /**
   * Callback: on each resize movement
   */
  onResizing: PropTypes.func,
  /**
   * Callback: when resize is finished
   */
  onResizeFinish: PropTypes.func,
  /**
   * Callback: when an item is pushed-in
   */
  onItemPush: PropTypes.func,
  /**
   * Callback: when an item is pulled-out
   */
  onItemPull: PropTypes.func
};

GridCore.defaultProps = {
  itemContents: [],

  isDraggable: true,
  isResizable: false,
  isAnimationEnabled: true,

  arrangement: 'auto',
  responsive: false,

  onDragStart: noop,
  onDragging: noop,
  onDragFinish: noop,
  onResizeStart: noop,
  onResizing: noop,
  onResizeFinish: noop,
  onItemPush: noop,
  onItemPull: noop
};

GridCore.displayName = "GridCoreLayout";

export default GridCore;