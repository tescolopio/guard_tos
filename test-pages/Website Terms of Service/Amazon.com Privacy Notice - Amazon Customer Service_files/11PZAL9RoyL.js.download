////////////////////////////////////////////
;(function (packageFunction) {
  /* istanbul ignore next */
  var p = window.AmazonUIPageJS || window.P;
  /* istanbul ignore next */
  var attribute = p._namespace || p.attributeErrors;
  /* istanbul ignore next */
  var namespacedP = attribute ? attribute("CSHelpContextJSBuzzWrapper", "") : p;

  /* istanbul ignore next */
  if (namespacedP.guardFatal) {
    namespacedP.guardFatal(packageFunction)(namespacedP, window);
  } else {
    namespacedP.execute(function () {
      packageFunction(namespacedP, window);
    });
  }
}(function(P, window, undefined){
// BEGIN ASSET CSHelpContextJSBuzzWrapper - 1.0
/////////////////////////
// BEGIN FILE placeholder.js
/////////////////////////
/*


Full source (including license, if applicable) included below.
*/
/******
 Empty place holder file as required by Buzz

 */
/////////////////////////
// END FILE placeholder.js
/////////////////////////
/////////////////////////
// BEGIN FILE app.js
/////////////////////////
/*


Full source (including license, if applicable) included below.
*/
"use strict";var t=function(){function t(t){this.sushiEndpoint=t.sushiEndpoint||""}return t.prototype.publishContextEventToSushi=function(t){var e=this,n={events:[]};n.events=[t].map((function(t){return{data:t}}));try{var o={method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)};fetch(this.sushiEndpoint,o).then((function(t){200!==t.status&&e.publishToCSM(t.status+"-errorSendingEventToSushi")}))}catch(t){console.warn("Error serializing and sending data to sushi. "+t.message),this.publishToCSM("errorSendingEventToSushi")}},t.prototype.publishToCSM=function(t){var e=window.ue;e&&e.count&&e.count(t,1)},t}(),e=["customerId","marketplaceId","locale","timestamp","eventCategory","eventType","eventData","sushiEndpoint"],n=function(){function t(t,e){this.contextEventModel=t,this.metricsCollector=e}return t.prototype.publishContextToSushi=function(){var t;0!==Object.keys(this.contextEventModel).length&&this.isValidEvent()?("1"===(null===(t=this.contextEventModel)||void 0===t?void 0:t.customerId)?this.metricsCollector.publishToCSM("unauthContextEvent"):this.metricsCollector.publishToCSM("authContextEvent"),this.metricsCollector.publishContextEventToSushi({customerId:this.contextEventModel.customerId,sessionId:this.contextEventModel.sessionId,marketplaceId:this.contextEventModel.marketplaceId,locale:this.contextEventModel.locale,timestamp:this.contextEventModel.timestamp,eventCategory:this.contextEventModel.eventCategory,eventType:this.contextEventModel.eventType,eventData:this.contextEventModel.eventData})):this.metricsCollector.publishToCSM("invalidContextEvent")},t.prototype.isValidEvent=function(){var t=this;return e.every((function(e){var n=e;return null!==t.contextEventModel[n]&&""!==t.contextEventModel[n]}))},t}(),o=window._contextEventModel||{};new n(o,new t({sushiEndpoint:o.sushiEndpoint})).publishContextToSushi();
//# sourceMappingURL=index.js.map
/////////////////////////
// END FILE app.js
/////////////////////////

// END ASSET CSHelpContextJSBuzzWrapper - 1.0
}));
////////////////////////////////////////////