const SagaPlugin = require('./SagaPlugin')


const sagaPlugin = new SagaPlugin()

module.exports.onHandleContent = function(ev) {
  ev.data.content = sagaPlugin.exec(ev.data.content)
};

module.exports.onHandleDocs = function(ev) {
  ev.data.docs.filter(d => d.kind === 'function').forEach((d) => {
    if (d.unknown) {
      for (let i = 0; i < d.unknown.length; i++) {
        const unknownTag = d.unknown[i].tagName
        if (unknownTag.indexOf('@saga') === 0) {
          sagaPlugin.push(d)
          break
        }
      }
    }
  })
};
