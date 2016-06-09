/* @flow */
"use strict";

// Common Modules...
import React, { PropTypes } from 'react';
import { DraggableCore } from 'react-draggable';
import { Resizable } from 'react-resizable';

// Own Modules...

// Local Fields...


// Beginning of Logic!
/**
 *
 */
class GridItem extends React.Component {
  /**
   *
   * @param props {Object}
   * @param context {Object}
   */
  constructor (props: Object, context: Object) {
    super(props, context);

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
    const { x, y, w, h } = this.props;

    const child = React.Children.only(this.props.children);
    let wrapped = React.cloneElement(child, {

    });

    const coordinate = this._calculateCoordinate();
    if (this.props.isResizable) {
      wrapped = this.wrapResizableUp(wrapped, coordinate);
    }
    if (this.props.isDraggable) {
      wrapped = this.wrapDraggableUp(wrapped);
    }
    return wrapped;
  }

  /**
   *
   * @param child {React.Element}
   * @param coordinate {Object}
   * @returns {React.Element}
   */
  wrapResizableUp (child: React.Element, coordinate: Object): React.Element {
    const {x, cols, minW, minH, maxW, maxH } = this.props;

    const maxWidth = this._calculateCoordinate(0, 0, cols-x, 0).width;
    const minCoordinate = this._calculateCoordinate(0, 0, minW, minH);
    const maxCoordinate = this._calculateCoordinate(0, 0, maxW, maxH);

    return (
      <Resizable
        width={ coordinate.width }
        height={ coordinate.height }
        minContraints={ [minCoordinate.width, minCoordinate.height] }
        maxConstraints={ [Math.min(maxWidth, maxCoordinate.width), Math.min(maxCoordinate.height, Infinity)] }
        onResizeStart={ this.onResizeHandler('onResizeStart') }
        onResize={ this.onResizeHandler('onResizing') }
        onResizeStop={ this.onResizeHandler('onResizeFinish') } >
        { child }
      </Resizable>
    );
  }

  /**
   *
   * @param child {React.Element}
   * @returns {React.Element}
   */
  wrapDraggableUp (child: React.Element): React.Element {
    return (
        <DraggableCore
            handle={ this.props.handleSelector }
            cancel={ this.props.cancelSelector }
            onStart={ this.onDragHandler('onDragStart') }
            onDrag={ this.onDragHandler('onDragging') }
            onStop={ this.onDragHandler('onDragFinish') } >
          { child }
        </DraggableCore>
    );
  }

  /**
   *
   * @param callbackName {string}
   * @returns {Function}
   * @private
   */
  onDragHandler (callbackName: string): Function {
    return (evt: Event, { node, position }: { node: HTMLElement, position: Object }) => {
      const callback = this.props[callbackName];
      if (callback) {
        const { id } = this.props;
        const { dragging } = this.state;

        let newPos: { top: number, left: number } = null;
        switch (callbackName) {
          case 'onDragStart':
            const parentRect = node.offsetParent.getBoundingClientRect();
            const clientRect = node.getBoundingClientRect();
            newPos = {
              left: clientRect.left - parentRect.left,
              top: clientRect.top - parentRect.top
            };
            this.setState({
              dragging: newPos
            });
            break;
          case 'onDragging':
            if (dragging) {
              newPos = {
                left: dragging.left + position.deltaX,
                top: dragging.top + position.deltaY
              };
            }
            this.setState({
              dragging: newPos
            });
            break;
          case 'onDragFinish':
            if (dragging) {
              newPos = {
                left: dragging.left,
                top: dragging.top
              };
            }
            this.setState({
              dragging: null
            });
            break;
          default:
            throw new Error('GridItem_onDragHandler called with invalid callback name: ' + callbackName);
        }
        const { x, y } = this._calculatePositionXY(newPos.top, newPos.left);
        callback(id, x, y, { evt, node, newPos });
      }
    };
  }

  /**
   *
   * @param callbackName {string}
   * @returns {Function}
   */
  onResizeHandler (callbackName: string): Function {
    return (evt: Event, { element, size }: { element: HTMLElement, size: Object }) => {
      const callback = this.props[callbackName];
      if (callback) {
        const { id, cols, x, maxW, minW, maxH, minH } = this.props;

        let { w, h } = this._calculateSizeWH(size.width, size.height);
        w = Math.max(Math.min(w, cols-x), 1);
        w = Math.max(Math.min(w, maxW), minW);
        h = Math.max(Math.min(w, maxH), minH);

        this.setState({
          resizing: (callbackName === 'onResizeFinish')? null : size
        });
        callback(id, w, h, { evt, element, size });
      }
    };
  }

  /**
   *
   * @param x {number}
   * @param y {number}
   * @param w {number}
   * @param h {number}
   * @param state {Object}
   * @private
   */
  _calculateCoordinate (x: number, y: number, w: number, h: number, state: Object) {

  }

  /**
   *
   * @param top {number} Top position relative to parent (px)
   * @param left {number} Left position relative to parent (px)
   * @private
   */
  _calculatePositionXY (top: number, left: number): { x: number, y: number } {

  }

  /**
   * @param width {number} Width (px)
   * @param height {number} Height (px)
   * @private
   */
  _calculateSizeWH (width: number, height: number): { w: number, h: number } {

  }
}

GridItem.propTypes = {
  /**
   * ClassName
   */
  className: PropTypes.string,
  /*
   * Children: Must be only a single element
   */
  children: PropTypes.element,

  /**
   * ID
   */
  id: PropTypes.string.isRequired,
  /**
   * X position
   */
  x: PropTypes.number.isRequired,
  /**
   * Y position
   */
  y: PropTypes.number.isRequired,
  /**
   * Width
   */
  w: PropTypes.number.isRequired,
  /**
   * Height
   */
  h: PropTypes.number.isRequired,

  /**
   * Selector for draggable handle
   */
  handleSelector: PropTypes.string,
  /**
   * Selector for draggable cancel (see react-draggable)
   */
  cancelSelector: PropTypes.string,


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
   * Flag: Static
   */
  isStatic: PropTypes.static,


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
  onResizeFinish: PropTypes.func
};

GridItem.defaultProps = {

};

GridItem.displayName = "GridItemLayout";

export default GridItem;