var jsonoa = {};
jsonoa.types = {};
jsonoa.graph = {};
jsonoa.constants = {
	ID:'@id',
	PREF_LABEL:'http://www.w3.org/2004/02/skos/core#prefLabel',
	NAME: 'http://xmlns.com/foaf/0.1/name',
	GRAPH: '@graph'
};

jsonoa.util = {};

jsonoa.util.arraysEqual = function(arr1, arr2){
	return !(arr2 < arr1 || arr1 < arr2);
};
jsonoa.util.isWrapped = function(obj){
	return (obj.node);
};

/**
 * Tests whether a given value is a jsonoa graph node, or a primitive type
 * @param test
 * @returns
 */
jsonoa.util.isNode = function(test){
	//Check value is not null, and then check that it has an @id attribute
	return test && test['@id'] ? true : false;
};

jsonoa.types.registry = [];

/**
 * Registers a new node type with the library. This should not be called from anywhere other than jsonoa.types.js where node types are defined.
 * @param The description object of the new node type.
 * @returns {typeDef}
 */
jsonoa.types.register = function(typeDesc){
	var typeTemplate = JSON.parse(typeDesc.template);
	var nodeObj = JSON.parse(typeDesc.template);
	
	/**
	 * An object is returned that wraps the underlying node, providing accessor and mutator methods for modification.
	 * ALL node objects returned by this library are wrapped with the object structure below. Returned object has a runtime type defined by its jsono.types type. (eg. jsonoa.types.Annotation). 
	 * This means that operations such as (node instanceof jsonoa.types.Annotation) will evaluate to true.
	 */
	var typeDef = function(){
		//Fields
		this.ID='@id';
		this.TYPE='@type';
		this.node = undefined;
		this.template = typeTemplate;
		this.graph = [];
		
		this._init = function(){
			this.node = JSON.parse(typeDesc.template);
		};
		
		this._isInit = function(){
			if (!this.node){
				throw 'Registered node type not initialised.(' + typeDesc.template + ')';
			}
		};
		
		//Constructor - Copy all constants across
		for (var key in typeDesc.constants){
			this[key]=typeDesc.constants[key];
		}
		
		this._wrapValue = function(attrVal){
			if (jsonoa.util.isNode(attrVal)){
				var linkedNode = this.graph.getNode(attrVal['@id']);
				if (!linkedNode){
					//Basically, node is unknown, but return the node wrapped in a stub object to allow for get/set functionality
					var stub = this.graph.createNode(jsonoa.types.Stub, attrVal['@id'], attrVal, true);
					return stub;
				}
				return linkedNode ? linkedNode : attrVal;
			} else {
				return attrVal;
			}
		};
		
		//Accessor Methods
		this.getValue=function(attr){
			this._isInit();
			
			var attrVal = this.node[attr];
			if (attrVal instanceof Array){
				attrVal = attrVal[0];
			}
			
			return this._wrapValue(attrVal);
				
		};
		this.getValues=function(attr){
			this._isInit();
			var attrVal = this.node[attr];
			if (typeof attrVal==='undefined')
				return [];
			else if (attrVal instanceof Array){
				var wrappedArr = [];
				for (var i=0; i < attrVal.length; i++){
					wrappedArr.push(this._wrapValue(attrVal[i]));
				}
				return wrappedArr;
			} else {
				return [this._wrapValue(attrVal)];
			}
		};
		this.setValue=function(attr,value){
			this._isInit();
			if (value instanceof Array){
				throw 'Type exception, cannot set value to an array type. Use addValue function instead.';
			}
			if (typeof this.node[attr] !== 'object' && this.template[attr]!=='?'){
				throw 'Field (' + attr + ') is defined as constant in type template';
			}
			if (typeof value !== typeof this.node[attr] && !(this.node[attr] instanceof Array)){
				throw 'Type exception, cannot set field (' + attr + ') with type ' + (typeof this.node[attr]) + ' to value of type ' + (typeof value);
			}
			if (jsonoa.util.isWrapped(value)){
				value = (this.graph.createStub(value.node[value.ID])).node;
			}
			if (this.node[attr] instanceof Array && !(value instanceof Array)){
				this.node[attr] = [value];
			} else {
				this.node[attr] = value;
			}
		};
		this.addValue=function(attr,value){
			this._isInit();
			if (typeof this.node[attr] !== 'object' && this.template[attr]!=='?'){
				throw 'Field (' + attr + ') is defined as constant in type template';
			}
			if (!(this.node[attr] instanceof Array)){
				throw 'Field (' + attr + ') is not defined as an array type in template';
			}
			else{
				if (jsonoa.util.isWrapped(value)){
					value = (this.graph.createStub(value.node[value.ID])).node;
				}
				this.node[attr].push(value);
			}
		};		
		this._checkRequiredFields = function(){
			for (var prop in this.node){
				var val = this.node[prop];
				if (jsonoa.util.isNode(val)){
					if (val['@id']==='?'){
						throw 'Required field ' + prop + ' missing';
					}
				}else if (val==='?'){
					throw 'Required field ' + prop + ' missing';
				}
			}
		};
		
		this.toJSON=function(){
			this._isInit();
			this._checkRequiredFields();
			return JSON.stringify(this.node);
		};
	};
	
	var types = nodeObj['@type'];
	if (!types){
		if (jsonoa.types.Stub)
			throw 'Registered node type must specify an @type attribute';
		types = [];
	}
	if (!(types instanceof Array)){
		types = [types];
	}
	jsonoa.types.registry.push({'matchTypes': types.sort(), 'typeDef': typeDef});
	
	return typeDef;
};

jsonoa.types._createBasicNode = function(){
	return {'@id': '?'};
};

/**
 * Defines a basic node type for graphs, and some functions for accessing the graph. A graph is first instantiated via
 * var graph = new jsonoa.types.Graph(). It can then be built programatically by adding nodes to it, via createNode, or a node
 * structure can be loaded from a string or json object source via Graph.load()
 */
jsonoa.types.Graph = function(){
	this.nodes = [];
	this.idMap = [];
	
	/**
	 * Creates a new node of the requested type. The wrapped node will be returned, and also saved into the graph. The 'wrappedData' is the basic json-ld node underlying it (not required for new nodes)
	 * 
	 */
	this.createNode = function(nodeType, id, wrappedData, graphLess){
		var node = new nodeType();
		node._init();
		
		if (wrappedData){
			node.node = wrappedData;
		}
		
		node.node['@id']=id;
		
		node.graph = this;
		if (!graphLess){
			this.nodes.push(node);
			this.idMap[id]=node;
		}
		return node;
	};
	
	this.createStub = function(id){
		return this.createNode(jsonoa.types.Stub, id, undefined, true);
	};
	
	/**
	 * Returns a node with the given ID
	 */
	this.getNode = function(id){
		return this.idMap[id];
	};
	
	/**
	 * Returns all nodes of the requested type
	 */
	this.getNodesOfType = function(type){
		var wrappedNodes = [];
		for (var i=0; i<this.nodes.length; i++){
			var thisNode = this.nodes[i];
			if (thisNode instanceof type){
				wrappedNodes.push(thisNode);
			}
		}
		return wrappedNodes;
	};
	
	this.getAnnotations = function(){
		return this.getNodesOfType(jsonoa.types.Annotation);
	};
	
	//Traverse the graph, decorate nodes with utility functions and identifiers, then stitch them together.
	this.load = function(graphSrc, ignoreErrors){
		var parentGraph = this;
		return new Promise(function(resolver) {
			var graph;
			if (typeof graphSrc === 'string'){
				//JSON-ify
				graph = JSON.parse(graphSrc);
			} else if (typeof graphSrc === 'object'){
				graph = graphSrc;
			} else {
				throw 'Unknown graph type';
			}
			(new jsonld.JsonLdProcessor()).flatten(graph, {}).then(function(data){
				var graphArr = [];
				if (data['@graph']){
					graphArr = data['@graph'];
				} else {
					graphArr = data;
				}
				for (var i=0; i < graphArr.length;i++){
					var node = graphArr[i];
					if (jsonoa.types.hasType(node)){
						var nodeType = jsonoa.types.identifyFromNode(node);
						if (nodeType){
							parentGraph.createNode(nodeType, node['@id'], node);
						} else {
							if (!ignoreErrors){
								resolver.reject('Unknown node type in graph');
								return;
							}
						}
					}
					
				}
				resolver.resolve(parentGraph);
			});
		});
	};
	
	this.toJSON = function(){
		var graphString = '{"@graph": [';
		var nodeStringArr=[];
		for (var i=0; i < this.nodes.length; i++){
			nodeStringArr.push(this.nodes[i].toJSON());
		}
		graphString+=nodeStringArr.join(',');
		graphString+=']}';
		return graphString;
	};
};

jsonoa.types.Stub = jsonoa.types.register({
	template:
		'{																							' + 
		'	"@id": "?"																				' +
		'}																							',
	constants: {
	}
});

jsonoa.types.identifyFromType = function(typeArr){
	if (!(typeArr instanceof Array)){
		typeArr = [typeArr];
	}
	typeArr = typeArr.sort();
	for (var i=0; i < jsonoa.types.registry.length; i++){
		var registeredTypes = jsonoa.types.registry[i].matchTypes;
		if (jsonoa.util.arraysEqual(registeredTypes, typeArr)){
			return jsonoa.types.registry[i].typeDef;
		}
	}
	return null;
};

jsonoa.types.identifyFromNode = function(node){
	var typeArr = node['@type'];
	if (!(typeArr instanceof Array)){
		typeArr = [typeArr];
	}
	return jsonoa.types.identifyFromType(typeArr);
};

jsonoa.types.hasType = function(node){
	return node['@type'] ? true : false;
};
