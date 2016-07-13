// @flow
import React, {PropTypes} from 'react';
import _ from 'lodash';
import {autoBindHandlers, bottom, cloneLayoutItem, compact, getLayoutItem, moveElement, switchElement,
  synchronizeLayoutWithChildren, validateLayout, calcXY, calcWH} from '../utils/GridUtils';
import GridItem from '../GridItem';

// Types
import type {ResizeEvent, DragEvent, Layout, LayoutItem} from '../utils/GridUtils';
type State = {
  activeDrag: ?LayoutItem,
  isMounted: boolean,
  isDragging: boolean,
  layout: Layout,
  oldDragItem: ?LayoutItem,
  oldResizeItem: ?LayoutItem
};

const noop = function() {};
// End Types

/**
 * A reactive, fluid grid layout with draggable, resizable components.
 */

export default class InnerGrid extends React.Component {

  state: State = {
    activeDrag: null,
    isMounted: false,
    layout: synchronizeLayoutWithChildren(this.props.layout, this.props.children,
      this.props.cols, this.props.verticalCompact, this.props.arrangeMode),
    oldDragItem: null,
    oldResizeItem: null
  };

  constructor (props: Object, context: ?Object): void {
  super(props, context);

  // Event Binding
  autoBindHandlers(this, [
      'onDragStart',
      'onDrag',
      'onDragStop',
      'onResizeStart',
      'onResize',
      'onResizeStop'
    ]);
  }

  componentDidMount () {
    // Call back with layout on mount. This should be done after correcting the layout width
    // to ensure we don't rerender with the wrong width.
    //this.props.onLayoutChange(this.state.layout);
    this.setState({ isMounted: true });
  }

  componentWillReceiveProps (nextProps: Object) {
    let newLayoutBase;
    // Allow parent to set layout directly.
    if (!_.isEqual(nextProps.layout, this.props.layout)) {
      newLayoutBase = nextProps.layout;
    }

    // If children change, also regenerate the layout. Use our state
    // as the base in case because it may be more up to date than
    // what is in props.
    else if (nextProps.children.length !== this.props.children.length) {
      newLayoutBase = this.state.layout;
    }

    // We need to regenerate the layout.
    if (newLayoutBase) {
      const newLayout = synchronizeLayoutWithChildren(newLayoutBase, nextProps.children,
        nextProps.cols, nextProps.verticalCompact, nextProps.arrangeMode);
      this.setState({layout: newLayout});
      this.props.onLayoutChange(newLayout);
    }
  }


  /**
   * Calculates a pixel value for the container.
   * @return {String} Container height in pixels.
   */
  containerHeight () {
    if (!this.props.autoSize) return;
    return bottom(this.state.layout) * (this.props.rowHeight + this.props.margin[1]) + this.props.margin[1] + 'px';
  }


  /**
   * When dragging starts
   * @param {String} i Id of the child
   * @param {Number} x X position of the move
   * @param {Number} y Y position of the move
   * @param {Event} e The mousedown event
   * @param {Element} node The current dragging DOM element
   */
  onDragStart (i:string, x:number, y:number, {e, node}: DragEvent) {
    const {layout} = this.state;
    var l = getLayoutItem(layout, i);
    if (!l) return;

    this.setState({oldDragItem: cloneLayoutItem(l)});

    // this.props.onDragStart(layout, l, l, null, e, node);
    this.props.onSuitDragStart(layout, l, l, null, e, node);
  }


  /**
   * Each drag movement create a new dragelement and move the element to the dragged location
   * @param {String} i Id of the child
   * @param {Number} x X position of the move
   * @param {Number} y Y position of the move
   * @param {Event} e The mousedown event
   * @param {Element} node The current dragging DOM element
   */
  onDrag (i:string, x:number, y:number, coordX, coordY, {e, node}: DragEvent) {
    const {oldDragItem} = this.state;

    let {layout} = this.state;
    var l = getLayoutItem(layout, i);
    if (!l) return;
    var placeholder;
    console.log('l', l);
    console.log('x:', x);
    console.log('y:', y);

    // Create placeholder (display only)
    if (!this.props.autoMove || this.props.switchMode) {
      var fakePosition = {};
      layout.some((l) => {
        // l is an item laying on the parent grid
        let isInRangeX = (x >= l.x) && (x < l.x + l.w);
        let isInRangeY = (y >= l.y) && (y < l.y + l.h);
        if (isInRangeX && isInRangeY && l.i != i) {
          fakePosition.x = l.x;
          fakePosition.y = l.y;
          fakePosition.w = l.w;
          fakePosition.h = l.h;
          fakePosition.i = l.i;
          return true;
        }
      });

      placeholder = {
        w: fakePosition.w || l.w,
        h: fakePosition.h || l.h,
        x: fakePosition.x >= 0 ? fakePosition.x : x,
        y: fakePosition.y >= 0 ? fakePosition.y : y,
        placeholder: true,
        i: fakePosition.i || i
      };
    }
    else {
      placeholder = {
        w: l.w,
        h: l.h,
        x: l.x,
        y: l.y,
        placeholder: true,
        i: i
      };

      // Move the element to the dragged location.
      layout = moveElement(layout, l, x, y, true /* isUserAction */);
    }

    //this.props.onDrag(layout, oldDragItem, l, placeholder, e, node);
    this.props.onSuitDrag(layout, oldDragItem, l, placeholder, e, node);

    this.setState({
      isDragging: true,
      layout: compact(layout, this.props.verticalCompact),
      activeDrag: placeholder
    });
  }


  /**
   * When dragging stops, figure out which position the element is closest to and update its x and y.
   * @param  {String} i Index of the child.
   * @param {Number} x X position of the move
   * @param {Number} y Y position of the move
   * @param {Event} e The mousedown event
   * @param {Element} node The current dragging DOM element
   */
  onDragStop (i:string, x:number, y:number, {e, node}: DragEvent) {
    const {oldDragItem} = this.state;
    let {layout} = this.state;
    let l = getLayoutItem(layout, i);
    if (!l) return;

    // Move the element here
    if (!this.props.switchMode) {
      layout = moveElement(layout, l, x, y, true /* isUserAction */);
    }
    else {
      if (this.state.activeDrag) {
        layout = switchElement(layout, l, x, y, oldDragItem, this.state.activeDrag);
      }
    }

    // this.props.onDragStop(layout, oldDragItem, l, null, e, node);
    this.props.onSuitDragStop(layout, oldDragItem, l, null, e, node);
    // console.log(oldDragItem);

    // Set state
    this.setState({
      isDragging: false,
      activeDrag: null,
      layout: compact(layout, this.props.verticalCompact), //draft로 Addit 이동시 standby List 압축 취소 방지
      oldDragItem: null
    });
    console.log('drag stop', layout);

    this.props.onLayoutChange(this.state.layout);
  }

  onResizeStart (i:string, w:number, h:number, {e, node}: ResizeEvent) {
    const {layout} = this.state;
    var l = getLayoutItem(layout, i);
    if (!l) return;

    this.setState({oldResizeItem: cloneLayoutItem(l)});

    this.props.onResizeStart(layout, l, l, null, e, node);
  }

  onResize (i:string, w:number, h:number, {e, node}: ResizeEvent) {
    const {layout, oldResizeItem} = this.state;
    var l = getLayoutItem(layout, i);
    if (!l) return;

    // Set new width and height.
    l.w = w;
    l.h = h;

    // Create placeholder element (display only)
    var placeholder = {
      w: w,
      h: h,
      x: l.x,
      y: l.y,
      static: true,
      i: i
    };

    this.props.onResize(layout, oldResizeItem, l, placeholder, e, node);

    // Re-compact the layout and set the drag placeholder.
    this.setState({
      layout: compact(layout, this.props.verticalCompact),
      activeDrag: placeholder
    });
  }

  onResizeStop (i:string, w:number, h:number, {e, node}: ResizeEvent) {
    const {layout, oldResizeItem} = this.state;
    var l = getLayoutItem(layout, i);
    l.moved = true;

    this.props.onResizeStop(layout, oldResizeItem, l, null, e, node);

    // Set state
    this.setState({
      activeDrag: null,
      layout: compact(layout, this.props.verticalCompact),
      oldResizeItem: null
    });

    this.props.onLayoutChange(this.state.layout);
  }


  /**
   * Create a placeholder object.
   * @return {Element} Placeholder div.
   */
  placeholder (): ?React.Element {
    const {activeDrag} = this.state;
    if (!activeDrag) return null;
    const {width, cols, margin, rowHeight, maxRows, useCSSTransforms} = this.props;

    // {...this.state.activeDrag} is pretty slow, actually
    return (
      <GridItem
        w={activeDrag.w}
        h={activeDrag.h}
        x={activeDrag.x}
        y={activeDrag.y}
        i={activeDrag.i}
        className="react-grid-placeholder"
        containerWidth={width}
        cols={cols}
        margin={margin}
        maxRows={maxRows}
        rowHeight={rowHeight}
        isDraggable={false}
        isResizable={false}
        useCSSTransforms={useCSSTransforms}>
        <div />
      </GridItem>
    );
  }

  /**
   * Given a grid item, set its style attributes & surround in a <Draggable>.
   * @param  {Element} child React element.
   * @return {Element}       Element wrapped in draggable and properly placed.
   */
  processGridItem (child: React.Element): ?React.Element {
    if (!child.key) return;
    const l = getLayoutItem(this.state.layout, child.key);
    if (!l) return null;
    const {width, cols, margin, rowHeight, maxRows, isDraggable, isResizable,
      useCSSTransforms, draggableCancel, draggableHandle} = this.props;

    // Parse 'static'. Any properties defined directly on the grid item will take precedence.
    const draggable = Boolean(!l.static && isDraggable && (l.isDraggable || l.isDraggable == null));
    const resizable = Boolean(!l.static && isResizable && (l.isResizable || l.isResizable == null));

    return (
      <GridItem
        containerWidth={width}
        cols={cols}
        margin={margin}
        maxRows={maxRows}
        rowHeight={rowHeight}
        cancel={draggableCancel}
        handle={draggableHandle}
        onDragStop={this.onDragStop}
        onDragStart={this.onDragStart}
        onDrag={this.onDrag}
        onResizeStart={this.onResizeStart}
        onResize={this.onResize}
        onResizeStop={this.onResizeStop}
        isDraggable={draggable}
        isResizable={resizable}
        useCSSTransforms={useCSSTransforms && this.state.isMounted}
        usePercentages={!this.state.isMounted}

        w={l.w}
        h={l.h}
        x={l.x}
        y={l.y}
        i={l.i}
        minH={l.minH}
        minW={l.minW}
        maxH={l.maxH}
        maxW={l.maxW}
        static={l.static}
      >
        {
          React.cloneElement(child, {

          })
        }
      </GridItem>
    );
  }

  processComponentRef (ref:Element) {
    console.log('processComponentRef: ' + ref);
    if (ref) {
      //let rect = ref.getBoundingClientRect();
      this.props.onLayoutResize(ref);
    }
  }

  render (): React.Element {
    const {className, style} = this.props;

    const mergedClassName = `react-grid-layout ${className} ${this.state.isDragging?'dragging':null}`;
    const mergedStyle = {
      height: this.containerHeight(),
      ...style
    };

    return (
      <div className={mergedClassName} style={mergedStyle} ref={(ref) => {
        if (ref) {
          this.props.onLayoutResize(ref);
        }
      }}>
        {
          React.Children.map(this.props.children, (child) => this.processGridItem(child))
        }
      </div>
    );
  }
}

InnerGrid.propTypes = {
  //
  // Basic props
  //
  className: PropTypes.string,
  style: PropTypes.object,

  // This can be set explicitly. If it is not set, it will automatically
  // be set to the container width. Note that resizes will *not* cause this to adjust.
  // If you need that behavior, use WidthProvider.
  width: PropTypes.number,

  // If true, the container height swells and contracts to fit contents
  autoSize: PropTypes.bool,
  // # of cols.
  cols: PropTypes.number,

  // A selector that will not be draggable.
  draggableCancel: PropTypes.string,
  // A selector for the draggable handler
  draggableHandle: PropTypes.string,

  // If true, the layout will compact vertically
  verticalCompact: PropTypes.bool,
  // If true, the layout will arrange itself !additor
  arrangeMode: PropTypes.bool,

  // layout is an array of object with the format:
  // {x: Number, y: Number, w: Number, h: Number, i: String}
  layout: function (props) {
    var layout = props.layout;
    // I hope you're setting the _grid property on the grid items
    if (layout === undefined) return;
    validateLayout(layout, 'layout');
  },

  //
  // Grid Dimensions
  //

  // Margin between items [x, y] in px
  margin: PropTypes.arrayOf(PropTypes.number),
  // Rows have a static height, but you can change this based on breakpoints if you like
  rowHeight: PropTypes.number,
  // Default Infinity, but you can specify a max here if you like.
  // Note that this isn't fully fleshed out and won't error if you specify a layout that
  // extends beyond the row capacity. It will, however, not allow users to drag/resize
  // an item past the barrier. They can push items beyond the barrier, though.
  // Intentionally not documented for this reason.
  maxRows: PropTypes.number,

  //
  // Flags
  //
  isDraggable: PropTypes.bool,
  isResizable: PropTypes.bool,
  // Use CSS transforms instead of top/left
  useCSSTransforms: PropTypes.bool,
  // auto move element by swjo
  autoMove: PropTypes.bool,
  // switch if drop the element by swjo
  switchMode: PropTypes.bool,

  //
  // Callbacks
  //

  // Callback so you can save the layout. Calls after each drag & resize stops.
  onLayoutChange: PropTypes.func,

  // Calls when drag starts. Callback is of the signature (layout, oldItem, newItem, placeholder, e).
  // All callbacks below have the same signature. 'start' and 'stop' callbacks omit the 'placeholder'.
  onDragStart: PropTypes.func,
  // Calls on each drag movement.
  onDrag: PropTypes.func,
  // Calls when drag is complete.
  onDragStop: PropTypes.func,
  //Calls when resize starts.
  onResizeStart: PropTypes.func,
  // Calls when resize movement happens.
  onResize: PropTypes.func,
  // Calls when resize is complete.
  onResizeStop: PropTypes.func,

  onLayoutResize: PropTypes.func,
  //
  // Other validations
  //

  // Children must not have duplicate keys.
  children: function (props, propName, _componentName) {
    PropTypes.node.apply(this, arguments);
    var children = props[propName];

    // Check children keys for duplicates. Throw if found.
    var keys = {};
    React.Children.forEach(children, function (child) {
      if (keys[child.key]) {
        throw new Error("Duplicate child key found! This will cause problems in ReactGrid.");
      }
      keys[child.key] = true;
    });
  }
};

InnerGrid.defaultProps = {
  autoSize: true,
  cols: 12,
  rowHeight: 150,
  maxRows: Infinity, // infinite vertical growth
  layout: [],
  margin: [10, 10],
  isDraggable: true,
  isResizable: true,
  useCSSTransforms: true,
  verticalCompact: false,
  autoMove: true,
  arrangeMode: false,
  switchMode: false,

  onLayoutChange: noop,
  onDragStart: noop,
  onDrag: noop,
  onDragStop: noop,
  onResizeStart: noop,
  onResize: noop,
  onResizeStop: noop,

  onLayoutResize: noop,
};
