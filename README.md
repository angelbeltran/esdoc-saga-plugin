# esdoc-saga-plugin
An ESDoc plugin for documenting redux-sagas effects.


## Description
This plugin is aimed to be compatible with ESDoc 1.0.0+, and will not likely work with pre-1.0.0 versions.
This plugin recognizes tags of the form @saga\<effect\> on functions, and tabulates the information, like with @param tags, just below the Params table in the respective function doc.

## Example

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
