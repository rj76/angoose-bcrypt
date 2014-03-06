;(function(){


angular.module('angoose.ui.services').factory('AngooseQuery',function(  $q, $timeout){
    
    function AngooseQuery(scope){
        console.log("Created Query object for scope", scope.$id);
        this.scope = scope;
        scope.dmeta = this;
        // some initial structure
        this.spec = { filter: {}}
    }
    // update the spec with new options.
    // new options will override the existing ones
    AngooseQuery.prototype.update = function(options){
        console.log("Updating Query spec", options);
        if(!options) return;
        //@todo: below is a mess
        var dmeta = this;
        dmeta.modelName = options.modelName || dmeta.modelName
        dmeta.columns = options.columns || dmeta.columns;
        dmeta.render = options.render || dmeta.render;
        
        
        if(options.preset)
            dmeta.spec.preset = options.preset || dmeta.spec.preset;
        if(options.defaultFilter)
            dmeta.spec.preset = options.defaultFilter || dmeta.spec.preset;
        
        dmeta.spec.sortBy = options.sortBy || dmeta.sortBy 
        dmeta.spec.sortDir = options.sortDir || dmeta.sortDir
        
        dmeta.templates = options.templates || dmeta.templates;
        dmeta.template = options.template || dmeta.template;
        dmeta.templateUrl = options.templateUrl || dmeta.templateUrl;
        
        dmeta.pageTitle = options.pageTitle || dmeta.pageTitle;
        dmeta.actionColumn = options.actionColumn ===undefined?  dmeta.actionColumn :options.actionColumn   ;
         
        return this;
    }
    AngooseQuery.prototype.get =   getter;
    return AngooseQuery;
});  
             

function getter(obj, p){
    if(!p || !obj) return undefined;
    var p = p.split('.');
    var o = obj;
    for (var i = 0; i < p.length; i++){
        if(!o || typeof o != "object") return undefined;
        o = o[p[i]]
    } 
    return o;
}    

})();