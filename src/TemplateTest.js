

import React from 'react';
import GridSuite from './GridSuite';

import _ from 'lodash';


export default class Test extends React.Component {

  constructor() {
    super();

    this.state = {
      items: [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) {
        return {i: i.toString(), x: 0, y: 0, w: 1, h: 3, ig: false, igItems: []};
      }),
      itemsForMergeTwoAddits: [0, 1].map(function (i) {
        return {i: i.toString(), x: 0, y: 0, w: 1, h: 1, ig: false, igItems: []};
      }),
    };

    this.createAddit = this.createAddit.bind(this);
  }

  /**
   * Doing 상태의 addit을 stanby queue에 집어넣음
   * @param i
   */
  removeDoingItem(i) {
    this.setState({
      // Add a new item. It must have a unique key
      stanbyQueue: this.state.stanbyQueue.concat({
        i: 'n' + this.state.newCounter,
        x: 0,
        y: 0,
        w: 1,
        h: 1,
      }),
      // Increment the counter to ensure key is always unique.
      newCounter: this.state.newCounter + 1,
      items: _.reject(this.state.items, {i: i})
    });
  }

  /**
   * card 한개를 만드는 함수
   *
   * @param el
   * @returns {XML}
   */
  createAddit(el) {
    let removeStyle = {
      position: 'absolute',
      right: '2px',
      top: 0,
      cursor: 'pointer'
    };
    let i = el.i;
    return (
      <div key={i} _grid={el}>
        <span className="text">{i}</span>
      </div>
    );
  }

  render() {
    return (
      <div>
        <GridSuite
          className={"additor-grid-manager"}
          margin={[20, 20]}
          rowHeight={100}
          arrangeMode={true}
          autoMove={false}

          width={870}
          cols={3}

          maxRows={Infinity} 
          useCSSTransforms={true}

          items={this.state.items}
          generateGridCard={this.createAddit}
        />
      </div>
    );
  }
}