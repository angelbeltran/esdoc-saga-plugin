module.exports.onHandlePlugins = function(ev) {
  console.log('onHandlePlugins')
  // modify list of plugins
  // ev.data.plugins = ...;
};

module.exports.onStart = function(ev) {
  console.log('onStart')
  // take option
  // ev.data.option;
};
  
module.exports.onHandleConfig = function(ev) {
  console.log('onHandleConfig')
  // modify config
  // ev.data.config.title = ...;
};

module.exports.onHandleCode = function(ev) {
  console.log('onHandleCode:', ev)
  // modify code
  // ev.data.code = ...;
};

module.exports.onHandleCodeParser = function(ev) {
  console.log('onHandleCodeParser')
  // modify parser
  // ev.data.parser = function(code){ ... };
};

module.exports.onHandleAST = function(ev) {
  console.log('onHandleAST')
  // modify AST
  // ev.data.ast = ...;
};

module.exports.onHandleDocs = function(ev) {
  console.log('onHandleDocs')
  // modify content
  // ev.data.docs = ...;
};

module.exports.onPublish = function(ev) {
  console.log('onPublish')
  // publish?
};

module.exports.onHandleContent = function(ev) {
  console.log('onHandleContent')
  // modify AST
  // ev.data.ast = ...;
};

module.exports.onHandleTag = function(ev) {
  // TODO: ev.data.tag -> ev.data.docs, onHandleTag -> onHandleDocs
  console.log('onHandleTag')
  console.log(ev.data.tag)
  // modify tag
  // ev.data.tag = ...;
};

module.exports.onHandleHTML = function(ev) {
  console.log('onHandleHTML')
  // modify HTML
  // ev.data.html = ...;
};

module.exports.onComplete = function(ev) {
  console.log('onComplete')
  // complete
};
