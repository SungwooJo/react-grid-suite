/* @flow */
"use strict";

// Common Modules...
import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { autoBindHandlers, calcXY, cloneLayoutItem } from './utils/GridUtils';
import { createInnerGrid, applyDefaultInnerGridLayout } from './utils/InnerGridUtils';
import Update from 'react-addons-update';
import _ from 'lodash';

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
      'removeItem',
      'onDragStart',
      'onDrag',
      'onDragStop',
      'mergeToInnerGrid',
      'mergeItems',
      'placeholder',
      'addInnerGrid',
    ]);
  }

  removeItem (itemKeys) {
    itemKeys.forEach((i) => {
      /*
       remove items from this.props.items
       */
      this.setState({
        items: _.reject(this.state.items, {i: i})
      });
    });
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

  onDragStop (layout, oldDragItem, l, placeholder, e, node) {

    const { currentGrid, belowItem, items } = this.state;

    // drag stop destinations
    // 1. Addit
    // 2. innerGrid (paragraph)
    // 3. side list
    // 4. nothing

    const itemIndex = _.findIndex(items, (item) => {
      if (item.i === belowItem.i) {
        return true;
      }
    });

    // 1. stop on Addit
    
    // i) in items
    // ii) not itself
    if (currentGrid.props.className !== 'inner-grid' && items[itemIndex].i !== oldDragItem.i && !items[itemIndex].ig) {
      console.log('merge is ready!');
      this.mergeItems(oldDragItem.i, items[itemIndex].i);

    } else if (currentGrid.props.className !== 'inner-grid' && items[itemIndex].ig && !l.ig) {
      console.log('adding item is ready');
      let newItems = Update(this.state.items, {
        [itemIndex]: {igItems: {$push: [oldDragItem]}}
      });
      newItems[itemIndex] = applyDefaultInnerGridLayout(newItems[itemIndex]);
      newItems = _.reject(newItems, {i: oldDragItem.i});
      this.setState({
        items: newItems
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

  mergeToInnerGrid (item, target) {
    /*
     1. create new innerGrid item
     2. push to items
     */

    let newLayoutItem = createInnerGrid([item, target], {x: 0, y: target.y}, 3, 1);

    this.setState({
      items: this.state.items.concat([newLayoutItem])
    });
  }

  /**
   * case 1 : 1 + 1 = 1
   * case 2 : 1 + * = 1
   */
  mergeItems (itemKey, targetKey) {
    /*
      case 1 : 1 + 1 = 1 (if target is item)
      1. save two items
      2. remove two items in parent grid
      3. create innerGrid
      4. add two items to the innerGrid

      case 2 : 1 + * = 1 (if target is innerGrid)
      1. remove item in parent grid
      2. add item to target innerGrid
    */

    // 1. save two items
    let itemLayout = null;
    let targetLayout = null;

    this.state.items.forEach((item) => {
      if (item.i === itemKey) {
        itemLayout = item;
      }
      else if (item.i === targetKey) {
        targetLayout = item;
      }
    });

    if (!itemLayout.ig && !targetLayout.ig) { // case 1
      // 2. remove two items in parent grid
      this.removeItem([itemKey, targetKey]);

      // 3. create innerGrid
      // 4. add two items to the innerGrid
      this.mergeToInnerGrid(itemLayout, targetLayout);

    } else if (!itemLayout.ig && targetLayout.ig) { // case 2
      this.removeItem([itemKey]);
      targetLayout.igItems.push(itemLayout);
    }
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
    const {currentGrid, innerGrids, items} = this.state;

    return (
      <div className="additor-grid-manager-wrapper">
        <GridCore
          {...other}
          onLayoutChange={onLayoutChange}
          generateGridView={generateGridView}
          currentGrid={currentGrid}
          innerGrids={innerGrids}
          compactType={'horizontal'}
          layout={items}

          onDragStart={this.onDragStart}
          onDrag={this.onDrag}
          onDragStop={this.onDragStop}
          addInnerGrid={this.addInnerGrid}
        >
          {_.map(items, this.props.generateGridCard)} 
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