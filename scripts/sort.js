/// Sort search engines by index
function sortByIndex(list) {
  const logToConsole = false;
  let sortedList = {};
  let listArray = [];
  let indexArray = [];
  let minIndex = 999;
  let count = 1;

  // Build index and list arrays
  for (let id in list){
    let obj = {};
    obj[id] = list[id];
    // If index isn't defined then assign an arbitrary value to index
    if (isEmpty(list[id].index)) {
      list[id].index = count;
    }
    indexArray.push(list[id].index);
    listArray.push(obj);
    count++;
  }

  if (logToConsole) {
    console.log(`Array of indexes:\n${indexArray}`);
    //console.log(`List of search engines:\n${JSON.stringify(listArray)}`);
    console.log(indexArray.length);
  }

  // Sort the list based on index values
  while (indexArray.length > 0){
    minIndex = Math.min(...indexArray);
    let pos = indexArray.indexOf(minIndex);
    let item = listArray.splice(pos, 1)[0];
    sortedList[Object.keys(item)[0]] = item[Object.keys(item)[0]];
    indexArray.splice(pos, 1);

    if (logToConsole) {
      console.log(`remaining indexes: ${indexArray}`);
      console.log(`minimum index is ${minIndex}`);
      console.log(`position of minimum index is ${pos}`);
      console.log(`search engine at minimum index is:\n${JSON.stringify(item)}`);
      console.log(Object.keys(item)[0]);
    }
  }

  if (logToConsole) {
    console.log(`Remaining search engines:\n${JSON.stringify(listArray)}`);
    console.log(`Sorted list of search engines:\n${JSON.stringify(sortedList)}`);
  }

  return sortedList;
}

// Test if an object is empty
function isEmpty(value) {
  if (typeof value === 'number') return false
  else if (typeof value === 'string') return value.trim().length === 0
  else if (Array.isArray(value)) return value.length === 0
  else if (typeof value === 'object') return value == null || Object.keys(value).length === 0
  else if (typeof value === 'boolean') return false
  else return !value
}