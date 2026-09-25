export default {
  getWeek() {
    return `Weekday ${'SunMonTueWedThuFriSat'.slice(new Date().getDay() * 3, new Date().getDay() * 3 + 3)}`
    // this.showDate=this.$momentMini(new Date()).format('YYYY-MM-DD, ')+str
  },
  /* form validation*/
  // match phone number
  mobilePhone(str) {
    const reg = /^0?1[0-9]{10}$/
    return reg.test(str)
  },
  /*
   * insert a space every 4 digits of a numeric string
   * */
  toSplitNumFor(num, numToSpace) {
    return num.replace(/(.{4})/g, '$1 ')
  },
  // match bank card number
  bankCardNo(str) {
    const reg = /^\d{15,20}$/
    return reg.test(str)
  },
  // email
  regEmail(str) {
    const reg = /^([a-zA-Z]|[0-9])(\w|-)+@[a-zA-Z0-9]+\.([a-zA-Z]{2,4})$/
    return reg.test(str)
  },
  // ID card number
  idCardNumber(str) {
    const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
    return reg.test(str)
  },
  /* common array operations*/
  /*
   * remove a specified element from an array
   * arrItem the index of the element in the array
   * return the array after removal
   * */
  deleteArrItem(arr, arrItem) {
    arr.splice(arr.indexOf(arrItem), 1)
  },
  /*
   *  deduplicate an array
   *  arr: the array to deduplicate
   *  return the deduplicated array
   * */
  arrToRepeat(arr) {
    return arr.filter((ele, index, thisArr) => {
      // indexOf returns the index of the first occurrence of an element; for a duplicate its position
      // will always be that first-occurrence index, which won't match its own index, so it gets removed.
      return thisArr.indexOf(ele) === index
    })
  },
  /*
   * deduplicate an array
   * seriesArr: the array
   * return the deduplicated array
   * */
  deRepeatArr(seriesArr) {
    return [...new Set(seriesArr)]
  },
  /*
   * remove items from arrObj2 based on a lookup against arrObj by objKey
   * arrObj: array of objects
   * arrObj2: the array of objects to remove items from
   * objKey: the key name on the objects in arrObj to match on
   * return: arrObj2 after removal
   * */
  byArrObjDeleteArrObj2(arrObj, arrObj2, objKey) {
    arrObj
      .map((value) => {
        return value[objKey]
      })
      .forEach((value2) => {
        arrObj2.splice(
          arrObj2.findIndex((item) => item[objKey] === value2),
          1
        )
      })
    return arrObj2
  },
  /*
   * remove an item from arrObj where the value of objKey equals value
   * arrObj: array of objects
   * objKey: the key name on the objects in arrObj
   * return: arrObj after removal
   * */
  deleteArrObjByKey(arrObj, objKey, value) {
    //foreach splice
    //for substring  slice does not mutate the original array
    arrObj.splice(
      arrObj.findIndex((item) => item[objKey] === value),
      1
    )
    return arrObj
  },
  /*
   * find an item in arrObj by the value of objKey
   * arrObj: array of objects
   * objKey: the key name on the objects in arrObj
   * return: the found item from arrObj
   * */
  findArrObjByKey(arrObj, objKey, value) {
    return arrObj[arrObj.findIndex((item) => item[objKey] == value)]
  },
  /*
   * filter arrObj2 based on a lookup against arrObj by objKey value
   * arrObj: array of objects
   * arrObj2: the array of objects to filter
   * objKey: the key name on the objects in arrObj
   * return: the filtered arrObj2
   * */
  byArrObjFindArrObj2(arrObj, arrObj2, objKey) {
    const arrObj3 = []
    arrObj
      .map((value) => {
        return value[objKey]
      })
      .forEach((value2) => {
        const arrIndex = arrObj2.findIndex((item) => item[objKey] === value2)
        if (arrIndex !== -1) {
          arrObj3.push(arrObj2[arrIndex])
        }
      })
    return arrObj3
  },
  
  /**
   * Flatten an object, converting nested objects into a single-level object with keys joined by dots
   * @param {Object} obj - the object to flatten
   * @param {String} prefix - prefix, used for recursive calls
   * @param {Array} fieldOrder - optional, specifies the field ordering
   * @return {Object} - the flattened object
   */
  flattenObject(obj, prefix = '', fieldOrder = []) {
    const flattened = {}
    const orderedResult = {}

    // default field order
    const defaultFieldOrder = ['keyword', 'type', 'tree', 'link', 'description', 'example', 'detail']
    const finalFieldOrder = fieldOrder.length > 0 ? fieldOrder : defaultFieldOrder

    // first flatten all fields
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key]
        const newKey = prefix ? `${prefix}.${key}` : key
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          Object.assign(flattened, this.flattenObject(value, newKey, finalFieldOrder))
        } else {
          flattened[newKey] = value
        }
      }
    }

    // rearrange fields in the specified order
    // first add fields in the specified order
    finalFieldOrder.forEach(field => {
      Object.keys(flattened).forEach(key => {
        if (key.toLowerCase().includes(field.toLowerCase())) {
          orderedResult[key] = flattened[key]
          delete flattened[key]
        }
      })
    })

    // add the remaining fields
    Object.keys(flattened).forEach(key => {
      orderedResult[key] = flattened[key]
    })

    return orderedResult
  }
}
