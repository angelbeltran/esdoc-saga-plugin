# esdoc-saga-plugin
An ESDoc plugin for sagas

## Description
Adds tag recognition to ESDoc for saga effect descriptions. For example

```javascript
/**
 * @param {string} someArg1 - some string
 * @param {number} someArg2 - some number
 * @param {boolean} someArg3 - some boolean
 * @sagaselect someSubstate - some part of the state
 * @sagatake SOME_ACTION_TYPE - some action type
 * @sagacall someApiCall - some api call
 */
export function* someSaga (someArg1, someArg2, someArg3) {
  const someSubstate = yield select((state) => state.someSubstate)
 
  if (someSubstate.someProp) {
    yield put({ type: 'SOME_ACTION_TYPE' })
    yield call(someApiCall)
  }
}
```
