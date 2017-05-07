import { take, put, call, fork, select, all } from 'redux-saga/effects'

/**
 * @param {string} someArg1 - some string
 * @param {number} someArg2 - some number
 * @param {boolean} someArg3 - some boolean
 * @sagaselect someSubstate - some part of the state
 * @sagatake SOME_ACTION_TYPE - some action type
 * @sagacall someApiCall - some api call
 */
export function* someSaga (someArg1, someArg2, someArg3) {
  const something = yield select((state) => state.someSubstate)

  return !!something.something
}

/**
 * @example const inst = new SomeClass(val)
 */
class SomeClass {
  /**
   * @param {string} val - some string value
   */
  constructor (val) {
    /**
     * @type {string} SomeClass#val
     */
    this.val = val
  }

  /**
   * @param {string} someParam - some string parameter
   */
  someMethod (someParam) {
    console.log(someParam)
  }
}

export default {
  someSaga,
  SomeClass,
}
