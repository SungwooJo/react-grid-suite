// @flow
import React, {PropTypes} from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import {autoBindHandlers, bottom, cloneLayout, createEmptySlot, cloneLayoutItem, compact, getLayoutItem, moveElement, switchElement,
  synchronizeLayoutWithChildren, validateLayout, calcXY, calcWH, orderingLayout} from './utils/GridUtils';
import GridItem from './GridItem';

// Types
import type {ResizeEvent, DragEvent, Layout, LayoutItem} from './utils/GridUtils';
type State = {
  activeDrag: ?LayoutItem,
  isMounted: boolean,
  isDragging: boolean,
  layout: Layout,
  oldDragItem: ?LayoutItem,
  oldResizeItem: ?LayoutItem
};
// End Types

// Local fields
const noop = () => {}; // no-operation
const propTypes = {
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

  // Choose vertical or hotizontal compaction
  compactType: PropTypes.oneOf(['vertical', 'horizontal']),

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
  innerGrids: PropTypes.array,

  addInnerGrid: PropTypes.func,
  setCurrentGrid: PropTypes.func,
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

  // Calls on blending.
  onBlendingItem: PropTypes.object,
  // Calls when blending-In happens.
  onBlendIn: PropTypes.func,
  // Calls when blending-Out happens.
  onBlendOut: PropTypes.func,

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
        throw new Error("Duplicate child key found! This will cause problems in GridCore.");
      }
      keys[child.key] = true;
    });
  }
};

const defaultProps = {
  autoSize: true,
  cols: 12,
  rowHeight: 150,
  maxRows: Infinity, // infinite vertical growth
  layout: [],
  margin: [10, 10],
  isDraggable: true,
  isResizable: true,
  useCSSTransforms: true,
  verticalCompact: true,
  autoMove: true,
  arrangeMode: false,
  switchMode: false,

  innerGrids: [],
  addInnerGrid: noop,
  setCurrentGrid: noop,

  onLayoutChange: noop,
  onDragStart: noop,
  onDrag: noop,
  onDragStop: noop,
  onResizeStart: noop,
  onResize: noop,
  onResizeStop: noop,

  onLayoutResize: noop,
  onBlendIn: noop,
  onBlendOut: noop
};

/**
 * A reactive, fluid grid layout with draggable, resizable components.
 */
export default class GridCore extends React.Component {

  state: State = {
    activeDrag: null,
    isMounted: false,
    layout: synchronizeLayoutWithChildren(this.props.layout, this.props.children, this.props.cols,
                                          // Legacy support for verticalCompact: false
                                          this.compactType(), this.props.arrangeMode),
    oldDragItem: null,
    oldResizeItem: null
  };

  constructor (props: Object): void { 
    super(props);

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
    if (!_.isEqual(nextProps.layout, this.props.layout || nextProps.compactType !== this.props.compactType)) {
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
      let newLayout = newLayoutBase;
      if (!nextProps.dragEvt) {
        newLayout = synchronizeLayoutWithChildren(newLayoutBase, nextProps.children,
          nextProps.cols, this.compactType(nextProps), nextProps.arrangeMode);
      }

      this.setState({layout: newLayout});
      this.props.onLayoutChange(newLayout);
    }

    // console.log(this.props.currentGrid);
    // console.log(this);
    /*if (this.props.nativeGrid && this.props.currentGrid && this.props.currentGrid.props.className === "additor-grid-manager") {
      debugger;
      const bi = nextProps.belowItem;
      const layout = cloneLayout(nextProps.layout);
      const slotedLayout = createEmptySlot(layout, bi.x, bi.y, this.props.cols);
      slotedLayout.push(bi);

      this.setState({layout: slotedLayout});
    }*/
    // console.log(nextProps.dragEvt);
    // console.log(nextProps.belowItem);
  }

  /**
   * Calculates a pixel value for the container.
   * @return {String} Container height in pixels.
   */
  containerHeight() {
    if (!this.props.autoSize) return;
    return bottom(this.state.layout) * (this.props.rowHeight + this.props.margin[1]) + this.props.margin[1] + 'px';
  }

  compactType(props): CompactType {
    if (!props) props = this.props;
    return props.verticalCompact === false ? null : props.compactType;
  }

  /**
   * When dragging starts
   * @param {String} i Id of the child
   * @param {Number} x X position of the move
   * @param {Number} y Y position of the move
   * @param {Event} e The mousedown event
   * @param {Element} node The current dragging DOM element
   */
  onDragStart(i:string, x:number, y:number, {e, node}: DragEvent) {
    const {layout} = this.state;
    var l = getLayoutItem(layout, i);
    if (!l) return;

    this.setState({oldDragItem: cloneLayoutItem(l)});

    this.props.onDragStart(layout, l, l, null, e, node);
  }

  /**
   * Each drag movement create a new dragelement and move the element to the dragged location
   * @param {String} i Id of the child
   * @param {Number} x X position of the move
   * @param {Number} y Y position of the move
   * @param {Event} e The mousedown event
   * @param {Element} node The current dragging DOM element
   */
  onDrag(i:string, x:number, y:number, coordX, coordY, {e, node}: DragEvent) {
    const {oldDragItem} = this.state;

    let {layout} = this.state;
    const {cols} = this.props;
    const l = getLayoutItem(layout, i);
    // const l = belowItem;
    if (!l) return;
    let placeholder;

    // console.log(oldDragItem);
    // console.log(x);
    // console.log(y);
    // console.log('x:', coordX - l.x);
    // console.log('y:', coordY - l.y);
    //const isMergeArea = !l.ig && (Math.abs(coordX - l.x) < 1.2) && (Math.abs(coordY - l.y) < 1.2);
    const isMergeArea = (l.w === 1) && (Math.abs(coordX - l.x) < 1.2) && (Math.abs(coordY - l.y) < 1.2);
    // const isMergeArea = false;

    // Create placeholder (display only)
    if (isMergeArea) {
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

          //console.log(e);
          //console.log(node);
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

    } else {
      placeholder = {
        w: l.w,
        h: l.h,
        x: l.x,
        y: l.y,
        placeholder: true,
        i: i
      };

      // Move the element to the dragged location.
      //layout = moveElement(layout, l, x, y, true /* isUserAction */);
      layout = moveElement(layout, l, x, y, true /* isUserAction */, this.compactType(), cols);
    }

    this.props.onDrag(layout, oldDragItem, l, placeholder, e, node);

    this.setState({
      isDragging: true,
      layout: compact(layout, this.compactType(), cols),
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
  onDragStop(i:string, x:number, y:number, {e, node}: DragEvent) {
    const {oldDragItem} = this.state;
    let {layout} = this.state;
    const {cols} = this.props;
    let l = getLayoutItem(layout, i);
    if (!l) return;

    // Move the element here
    if (!this.props.switchMode) {
      layout = moveElement(layout, l, x, y, true /* isUserAction */, this.compactType(), cols);
    }
    else {
      if (this.state.activeDrag) {
        layout = switchElement(layout, l, x, y, oldDragItem, this.state.activeDrag);
      }
    }

    /*if (this.state.activeDrag.i !== i) {
     this.props.mergeItems(i, this.state.activeDrag.i);
     console.log('merge!');
     }*/

    this.props.onDragStop(layout, oldDragItem, l, null, e, node);
    // console.log(oldDragItem);

    // Set state
    this.setState({
      isDragging: false,
      activeDrag: null,
      // layout: compact(layout, this.compactType(), cols),
      oldDragItem: null
    });
    // console.log('drag stop', layout);

    this.props.onLayoutChange(this.state.layout);
  }

  onResizeStart(i:string, w:number, h:number, {e, node}: ResizeEvent) {
    const {layout} = this.state;
    var l = getLayoutItem(layout, i);
    if (!l) return;

    this.setState({oldResizeItem: cloneLayoutItem(l)});

    this.props.onResizeStart(layout, l, l, null, e, node);
  }

  onResize(i:string, w:number, h:number, {e, node}: ResizeEvent) {
    const {layout, oldResizeItem} = this.state;
    const {cols} = this.props;
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
      layout: compact(layout, this.compactType(), cols),
      activeDrag: placeholder
    });
  }

  onResizeStop (i:string, w:number, h:number, {e, node}: ResizeEvent) {
    const {layout, oldResizeItem} = this.state;
    const {cols} = this.props;
    var l = getLayoutItem(layout, i);
    l.moved = true;

    this.props.onResizeStop(layout, oldResizeItem, l, null, e, node);

    // Set state
    this.setState({
      activeDrag: null,
      layout: compact(layout, this.compactType(), cols),
      oldResizeItem: null
    });

    this.props.onLayoutChange(layout);
  }

  /**
   * Given a grid item, set its style attributes & surround in a <Draggable>.
   * @param  {Element} child React element.
   * @return {Element}       Element wrapped in draggable and properly placed.
   */
  processGridItem(child: React.Element): ?React.Element {
    if (!child.key) return;
    const l = getLayoutItem(this.state.layout, child.key);
    if (!l) return null;
    const { width, cols, margin, rowHeight, maxRows, isDraggable, isResizable, belowItem,
      useCSSTransforms, draggableCancel, draggableHandle, generateGridCard, onDragStart, onDrag, onDragStop } = this.props;

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
        generateGridCard={generateGridCard}

        onDragStop={this.onDragStop}
        onDragStart={this.onDragStart}
        onDrag={this.onDrag}
        onResizeStart={this.onResizeStart}
        onResize={this.onResize}
        onResizeStop={this.onResizeStop}

        belowItem={belowItem}
        onSuiteDragStart={onDragStart}
        onSuiteDrag={onDrag}
        onSuiteDragStop={onDragStop}

        isDraggable={draggable}
        isResizable={resizable}
        useCSSTransforms={useCSSTransforms && this.state.isMounted}
        usePercentages={!this.state.isMounted}

        w={l.w}
        h={l.h}
        x={l.x}
        y={l.y}
        i={l.i}
        isInnerGrid={l.ig}
        innerGriditems={l.igItems}
        innerGridLayout={l.igLayout}
        addInnerGrid={this.props.addInnerGrid}

        minH={l.minH}
        minW={l.minW}
        maxH={l.maxH}
        maxW={l.maxW}
        static={l.static}
      >
        {
          React.cloneElement(child, {})
        }
      </GridItem>
    );
  }

  render():React.Element {
    const {className, style} = this.props;

    const mergedClassName = `react-grid-layout ${className} ${this.state.isDragging ? 'dragging' : null}`;
    const mergedStyle = {
      height: this.containerHeight(),
      ...style
    };

    return (
      <div className={mergedClassName} style={mergedStyle} ref={ (ref) => {

    if (ref) {
      //let rect = ref.getBoundingClientRect();
      this.props.onLayoutResize(ref);
    }
        } }>
        {
          React.Children.map(this.props.children, (child) => this.processGridItem(child))
        }
      </div>
    );
  }
}
// TODO publish internal ReactClass displayName transform

GridCore.propTypes = propTypes;
GridCore.defaultProps = defaultProps;
