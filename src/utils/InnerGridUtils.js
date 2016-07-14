/**
 *
 * @param targetItem
 * @param targetGrid
 * @returns {{}}
 */
export function applyDefaultInnerGridLayout(targetGrid) {

  //targetGrid.igItems.push(targetItem);
  /*
  const newInnerGridItem = {};

  newInnerGridItem.ig = true;
  newInnerGridItem.igItems = [];
  newInnerGridItem.x = 0;
  newInnerGridItem.y = 0;
  newInnerGridItem.w = width;
  newInnerGridItem.h = height;
  newInnerGridItem.i = 'innerGrid';

  for (let i=0; i< cardNum; i++) {
    const emptyItem = {};
    //emptyItem.x = 0;
    //emptyItem.y = 0;
    //emptyItem.w = 1;
    //emptyItem.h = 1;
    emptyItem.i = 'empty-card-slot-' + i;

    newInnerGridItem.igItems.push(emptyItem);
  }*/

  switch (targetGrid.igItems.length) {
    case 3 :
      targetGrid.igLayout = [
        {
          x: 0,
          y: 0,
          w: 4,
          h: 6,
          ig: false,
          i: targetGrid.igItems[0].i
        },
        {
          x: 4,
          y: 0,
          w: 4,
          h: 6,
          ig: false,
          i: targetGrid.igItems[1].i
        },
        {
          x: 8,
          y: 0,
          w: 4,
          h: 6,
          ig: false,
          i: targetGrid.igItems[2].i
        },
      ];
      break;
    case 6 :
      targetGrid.igLayout = [
        {
          x: 0,
          y: 0,
          w: 4,
          h: 3,
          i: 'empty-card-slot-0'
        },
        {
          x: 4,
          y: 0,
          w: 4,
          h: 4,
          i: 'empty-card-slot-1'
        },
        {
          x: 8,
          y: 0,
          w: 4,
          h: 3,
          i: 'empty-card-slot-2'
        },
        {
          x: 0,
          y: 3,
          w: 4,
          h: 3,
          i: 'empty-card-slot-3'
        },
        {
          x: 4,
          y: 3,
          w: 4,
          h: 2,
          i: 'empty-card-slot-4'                                                            
        },
        {
          x: 8,
          y: 3,
          w: 4,
          h: 3,
          i: 'empty-card-slot-5'
        }
      ];
      break;
    default :
      return {};
      break;
  }

  return targetGrid;
}

/**
 *
 * @param cardNum
 * @returns {{}}
 */
export function createInnerGrid(items, pos, width: number, height: number) {
  const newInnerGridItem = {};
  let id = '';
  items.forEach((item) => {
    id = id + item.i;
  });

  newInnerGridItem.ig = true;
  newInnerGridItem.igItems = [...items];
  newInnerGridItem.x = pos.x;
  newInnerGridItem.y = pos.y;
  newInnerGridItem.w = width;
  newInnerGridItem.h = height;
  newInnerGridItem.i = 'innerGrid' + id;

  switch (items.length) {
    case 2 :
      newInnerGridItem.igLayout = [
        {
          x: 0,
          y: 0,
          w: 6,
          h: 6,
          ig: false,
          i: items[0].i
        },
        {
          x: 6,
          y: 0,
          w: 6,
          h: 6,
          ig: false,
          i: items[1].i
        },
      ];
      break;
    case 3 :
      newInnerGridItem.igLayout = [
        {
          x: 0,
          y: 0,
          w: 4,
          h: 6,
          ig: false,
          i: items[0].i
        },
        {
          x: 4,
          y: 0,
          w: 4,
          h: 6,
          ig: false,
          i: items[1].i
        },
        {
          x: 8,
          y: 0,
          w: 4,
          h: 6,
          ig: false,
          i: items[2].i
        },
      ];
      break;
    default :
      return {};
      break;
  }

  return newInnerGridItem;
}

export function generateEmptySlot (el) {
  let i = el.i;
  return (
    <div onClick={() => {}} key={i}>
      <span className="text">Create note or Drop Addit</span>
    </div>
  );
}
