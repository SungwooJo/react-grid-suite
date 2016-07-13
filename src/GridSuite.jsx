/* @flow */
"use strict";

// Common Modules...
import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { autoBindHandlers, calcXY } from './utils/GridUtils';
import { createInnerGrid } from './utils/InnerGridUtils';

// Own Modules...
import GridPlaceholder from './GridPlaceholder.jsx';
import GridCore from './GridCore.jsx';


// Local Fields...
const noop = () => {};


// Prop settings...
const propTypes = {
  // The width of this component.
  // Required in this propTypes stanza because generateInitialState() will fail without it.
  width: React.PropTypes.number.isRequired,

  // Callback so you can save the layout.
  // Calls back with (currentLayout, allLayouts). allLayouts are keyed by breakpoint.
  onLayoutChange: React.PropTypes.func,

  // added by swjo
  items: React.PropTypes.array,
  generateGridView: React.PropTypes.func,
};

const defaultProps = {
  items: [],

  generateGridView: noop,
  onLayoutChange: noop,
};

// Beginning of Logic!
/**
 *
 */
class GridSuite extends React.Component {

  constructor (props) {
    super(props);

    this.state = {
      items: this.props.items,
      placeholder: {},
      nativeGrid: null,
      currentGrid: null,
      innerGrids: [],
      innerGridPos: {top: 0, left: 0},
      dragEvt: null,
      belowItem: null,
    };

    // Event Binding
    autoBindHandlers(this, [
      'onDragStart',
      'onDrag',
      'onDragStop',
      'placeholder',
      'addInnerGrid',
    ]);
  }

  onDragStart(layout, oldDragItem, l, placeholder, e, node) {
    const { innerGrids } = this.state;
    let nativeGrid = null;

    innerGrids.some((ig) => {
      let gridRect = ReactDOM.findDOMNode(ig).getBoundingClientRect();
      if ((e.pageX > gridRect.left && e.pageX < gridRect.right) && (e.pageY > gridRect.top && e.pageY < gridRect.bottom)) {
        nativeGrid = ig;
        return true;
      }
    });

    this.setState({
      nativeGrid
    });
  }

  onDrag (layout, oldDragItem, l, placeholder, e, node) {

    const { innerGrids } = this.state;
    let currentGrid = null;
    let belowItem = placeholder;
    let currentPos = {};

    // if (nativeGrid)
    //   if mouse is in nativeGrid
    //     switch them
    //   else
    //     draw outside placeholder
    if (this.state.nativeGrid) {
      const nativeGridRect = ReactDOM.findDOMNode(this.state.nativeGrid).getBoundingClientRect();

      // if mouse is in nativeGrid
      if ((e.x > nativeGridRect.left && e.x < nativeGridRect.right) && (e.y > nativeGridRect.top && e.y < nativeGridRect.bottom)) {
        console.log('innerGrid');
        innerGrids.some((ig) => {
          let gridRect = ReactDOM.findDOMNode(ig).getBoundingClientRect();
          // 1
          if ((e.x > gridRect.left && e.x < gridRect.right) && (e.y > gridRect.top && e.y < gridRect.bottom)) {
            currentGrid = ig;
            // 2
            currentPos = calcXY(currentGrid.props, e.y, e.x, gridRect); // currentPos = { x, y }
            currentGrid.props.layout.some((layoutItem) => {
              let isInRangeX = (currentPos.x >= layoutItem.x) && (currentPos.x < layoutItem.x + layoutItem.w);
              let isInRangeY = (currentPos.y >= layoutItem.y) && (currentPos.y < layoutItem.y + layoutItem.h);
              if (isInRangeX && isInRangeY && layoutItem.i != l.i) {
                belowItem = layoutItem;
                return true;
              }
            });
            return true;
          }
        });
      } else {
        console.log('outerGrid');
        currentPos = calcXY(this.props, e.y, e.x, ReactDOM.findDOMNode(this).getBoundingClientRect()); // currentPos = { x, y }
        belowItem.w = 1;
        belowItem.h = 1;
        belowItem.x = currentPos.x;
        belowItem.y = currentPos.y;
        belowItem.i = l.i;
        belowItem.placeholder = true;
      }

    } else {
      // else
      // get belowItem by (x,y)
      // 1. get grid contains (x,y)
      // 2. get item contains (x,y)
      innerGrids.some((ig) => {
        let gridRect = ReactDOM.findDOMNode(ig).getBoundingClientRect();
        // 1
        if ((e.x > gridRect.left && e.x < gridRect.right) && (e.y > gridRect.top && e.y < gridRect.bottom)) {
          currentGrid = ig;
          // 2
          currentPos = calcXY(currentGrid.props, e.y, e.x, gridRect); // currentPos = { x, y }
          currentGrid.props.layout.some((layoutItem) => {
            let isInRangeX = (currentPos.x >= layoutItem.x) && (currentPos.x < layoutItem.x + layoutItem.w);
            let isInRangeY = (currentPos.y >= layoutItem.y) && (currentPos.y < layoutItem.y + layoutItem.h);
            if (isInRangeX && isInRangeY && layoutItem.i != l.i) {
              belowItem = layoutItem;
              return true;
            }
          });
          return true;
        }
      });
    }

    this.setState({
      dragEvt: e,
      currentGrid: currentGrid || this,
      belowItem,
    });

    if (currentGrid) {
      this.setState({
        innerGridPos: {
          top: ReactDOM.findDOMNode(currentGrid).getBoundingClientRect().top - ReactDOM.findDOMNode(this).getBoundingClientRect().top,
          left: ReactDOM.findDOMNode(currentGrid).getBoundingClientRect().left - ReactDOM.findDOMNode(this).getBoundingClientRect().left
        }
      });
    } else {
      this.setState({
        innerGridPos: {
          top: 0,
          left: 0
        }
      });
    }
  }

  onDragStop () {

    const { currentGrid } = this.state;

    // If dragging stopped in innerGrid,
    // case 1: if the target Grid is empty-card-slot
    // 1. delete target item(slot) laid on target innerGrid
    // 2.
    if (currentGrid.props.className === 'inner-grid') {
      this.setState({

      });
    }

    this.setState({
      dragEvt: null,
      currentGrid: null,
      nativeGrid: null,
      belowItem: null
    });
  }

  addInnerGrid (gridElm) {
    let currentInnerGrids = this.state.innerGrids;
    currentInnerGrids.push(gridElm);
    this.setState({
      innerGrids: currentInnerGrids
    });
  }

  /**
   * Create a placeholder object.
   * @return {Element} GridPlaceholder div.
   */
  placeholder () {
    const { dragEvt, belowItem, currentGrid, innerGridPos } = this.state;
    if (!dragEvt) return null;
    // console.log(belowItem);
    // console.log(currentGrid);

    return (
      <GridPlaceholder
        w={belowItem.w}
        h={belowItem.h}
        x={belowItem.x}
        y={belowItem.y}
        i={belowItem.i}
        className="react-grid-placeholder"
        containerWidth={currentGrid.props.width}
        cols={currentGrid.props.cols}
        margin={currentGrid.props.margin}
        maxRows={currentGrid.props.maxRows}
        rowHeight={currentGrid.props.rowHeight}

        innerGridPos={innerGridPos}

        isDraggable={false}
        isResizable={false}
        useCSSTransforms={false}>
        <div />
      </GridPlaceholder>
    );
  }

  render() {
    const {onLayoutChange, generateGridView, ...other} = this.props;

    return (
      <div className="additor-grid-manager-wrapper">
        <GridCore
          {...other}
          onLayoutChange={onLayoutChange}
          generateGridView={generateGridView}
          currentGrid={this.state.currentGrid}
          innerGrids={this.state.innerGrids}
          compactType={'horizontal'}

          onDragStart={this.onDragStart}
          onDrag={this.onDrag}
          onDragStop={this.onDragStop}
          addInnerGrid={this.addInnerGrid}
        >
          {_.map(this.state.items, this.props.generateGridCard)}
        </GridCore>
        {
          this.placeholder()
        }
      </div>
    );
  }
}

GridSuite.propTypes = propTypes;
GridSuite.defaultProps = defaultProps;

export default GridSuite;