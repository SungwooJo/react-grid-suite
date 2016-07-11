/**
 *
 * @param cardNum
 * @param density
 * @returns {{}}
 */
export function createInnerGrid(cardNum: number, density: number) {
  const newInnerGridItem = {};

  newInnerGridItem.ig = true;
  newInnerGridItem.igItems = [];
  newInnerGridItem.x = 0;
  newInnerGridItem.y = 0;
  newInnerGridItem.w = density * cardNum;
  newInnerGridItem.h = (density * cardNum) / 2;
  newInnerGridItem.i = 'innerGrid';

  for (let i=0; i< cardNum; i++) {
    const emptyItem = {};
    //emptyItem.x = 0;
    //emptyItem.y = 0;
    //emptyItem.w = 1;
    //emptyItem.h = 1;
    emptyItem.i = 'empty-card-slot-' + i;

    newInnerGridItem.igItems.push(emptyItem);
  }

  switch (cardNum) {
    case 6 :
      newInnerGridItem.igLayout = [
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
