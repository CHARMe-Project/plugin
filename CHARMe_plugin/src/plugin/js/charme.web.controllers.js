charme.web.controllers = angular.module('charmeControllers', ['charmeServices']);

charme.web.controllers.controller('InitCtrl', ['$scope', '$routeParams', '$location', '$filter', 'loginService', 'persistence',
    function ($scope, $routeParams, $location, $filter, loginService, persistence){
        var targetId=$routeParams.targetId;
        loginService._loadState();
        $location.path(encodeURIComponent(targetId) + '/annotations/');
    }
]);

charme.web.controllers.controller('HeaderCtrl', ['$scope',
function ($scope){
    $scope.close = function(){
        charme.web.close();
    };
}]);

/**
 * List all annotations for target.
 */
charme.web.controllers.controller('ListAnnotationsCtrl', ['$scope', '$routeParams', '$location', '$filter', 'fetchAnnotationsForTarget', 'loginService', 'searchAnnotations',
    function ($scope, $routeParams, $location, $filter, fetchAnnotationsForTarget, loginService, searchAnnotations){
        $scope.listAnnotationsFlag=true;
        $scope.loading=true;

        /*
         * Check if already logged in
         */
        $scope.loggedIn=loginService.isLoggedIn();
        var auth = loginService.getAuth();
        if (auth && auth.user){
            $scope.userName=auth.user.first_name + ' ' + auth.user.last_name;
            $scope.email=auth.user.email;
        }

        /*
         * Register a login listener for future login events
         */
        /**
         * Add a login listener
         */
        loginService.addLoginListener(function(authToken){
            $scope.$apply(function(){
                $scope.loggedIn=authToken.token ? true : false;
                var user = authToken.user;
                $scope.userName=user.first_name + ' ' + user.last_name;
                $scope.email=user.email;
            });
        });

        var targetId=$routeParams.targetId;

        $scope.close = function(){
            charme.web.close();
        };

        $scope.newAnnotation = function(){
            $location.path(encodeURIComponent(targetId) + '/annotations/new/');
        };

        $scope.viewAnnotation = function(annoId){
            $location.path(encodeURIComponent(targetId) + '/annotation/' + encodeURIComponent(annoId) + '/');
        };
        $scope.login = function(){
            window.addEventListener('message', loginService._loginEvent, false);
            window.open(charme.logic.urls.authRequest());
        };

        loginService.addLogoutListener(function(){
            $scope.loggedIn=false;
        });

        $scope.logout = function(){
            loginService.logout();
        };

        $scope.targetId=targetId;

        searchAnnotations.addListener(searchAnnotations.listenerTypes.BEFORE_SEARCH, function(){
            $scope.entries = [];
            $scope.loading = true;
            $scope.errorMsg = ''
        });

        searchAnnotations.addListener(searchAnnotations.listenerTypes.AFTER_SEARCH, function(){
            $scope.$apply( function(){
                $scope.loading = false;
            });
        });

        searchAnnotations.addListener(searchAnnotations.listenerTypes.SUCCESS, function(results){
            $scope.$apply( function(){
                $scope.entries = results;
            });
        });

        searchAnnotations.addListener(searchAnnotations.listenerTypes.ERROR, function(errorMsg) {
            $scope.$apply( function(){
                $scope.errorMsg = errorMsg;
            });
        });
    }]);

/**
 * View details of individual annotation.
 */
charme.web.controllers.controller('ViewAnnotationCtrl', ['$scope', '$routeParams', '$location', '$window', 'fetchAnnotation', 'fetchKeywords', 'fetchFabioTypes', 'fetchAllMotivations',
    function ($scope, $routeParams, $location, $window, fetchAnnotation, fetchKeywords, fetchFabioTypes, fetchAllMotivations){
        $scope.viewAnnotationFlag=true;
        $scope.loading=true;
        var targetId=$routeParams.targetId;
        $scope.cancel = function(){
            $location.path(encodeURIComponent(targetId) + '/annotations/');
        };
        var annoId=$routeParams.annotationId;
        $scope.annotationId=annoId;
        $scope.targetId=targetId;

        Promise.every(fetchKeywords(), fetchAnnotation(annoId), fetchFabioTypes(), fetchAllMotivations()).then(
            function (results){
                $scope.loading=false;
                $scope.$apply(function(){
                    var categories = results[0];
                    var keywords = {};
                    var fabioTypes = results[2];
                    var motivations_catagories = results[3];
                    var motivation_keywords = {};
                    //Process GCMD keywords
                    angular.forEach(categories[0].keywords, function(keyword){
                        keywords[keyword.uri]=keyword.desc;
                    });
                    //Process Motivation keywords
                    angular.forEach(motivations_catagories[0].keywords, function(keyword){
                        motivation_keywords[keyword.uri]=keyword.desc;
                    });

                    var graph = results[1];
                    //Process graph
                    var annoList = graph.getAnnotations();
                    if (annoList.length > 0) {
                        var anno = annoList[0];
                        var motivations = anno.getValues(anno.MOTIVATED_BY);
                        if (motivations && motivations.length > 0) {
                            $scope.motivationTags = [];
                        }
                        angular.forEach(motivations, function (motivation){
                            var motivURI =  motivation.getValue(motivation.ID);
                            $scope.motivationTags.push({uri: motivURI, desc: motivation_keywords[motivURI]});
                        });
                        var bodies = anno.getValues(anno.BODY);
                        angular.forEach(bodies, function(body){
                            if (body instanceof jsonoa.types.TextBody){
                                $scope.comment = body.getValue(body.CONTENT_CHARS);
                            }
                            else if (body instanceof jsonoa.types.Publication) {
                                var citingEntity = body.getValue(body.CITING_ENTITY);
                                //Check if the returned value is an object, or a primitive (should be an object, but some historical data might have primitives in this field)
                                if (citingEntity.getValue){
                                    var citoURI = citingEntity.getValue(citingEntity.ID);
                                    $scope.citation = {};
                                    $scope.citation.loading=true;
                                    $scope.citation.uri = citoURI;

                                    //Match the citation type to a text description.
                                    var citoTypeId = citingEntity.getValue(citingEntity.TYPE);
                                    angular.forEach(fabioTypes, function(citoType){
                                        if (citoTypeId === citoType.resource){
                                            $scope.citation.citoTypeDesc = citoType.label;
                                        }
                                    });

                                    //Trim the 'doi:' from the front
                                    var doiTxt = citoURI.substring(charme.logic.constants.DOI_PREFIX.length, citoURI.length);
                                    var criteria = {};
                                    criteria[charme.logic.constants.CROSSREF_CRITERIA_DOI]=doiTxt;
                                    charme.logic.fetchCrossRefMetaData(criteria).then(function(citation){
                                        $scope.$apply(function(){
                                            $scope.citation.text = citation;
                                            $scope.citation.loading=false;
                                        });
                                    }, function(error){
                                        $scope.$apply(function(){
                                            $scope.citation.text = citoURI;
                                            $scope.citation.error='Error: Could not fetch citation metadata';
                                            $scope.citation.loading=false;
                                        });
                                    });
                                } else {
                                    $scop.link.uri = citingEntity;
                                }
                            }
                            else if (body instanceof jsonoa.types.SemanticTag){
                                if (!$scope.tags){
                                    $scope.tags = [];
                                }
                                var tagURI = body.getValue(body.ID);
                                var prefLabel = body.getValue(body.PREF_LABEL);
                                $scope.tags.push({uri: tagURI, desc: prefLabel});
                            } else {
                                //Match the citation type to a text description.
                                var type = body.getValue(body.TYPE);
                                $scope.link = {};
                                $scope.link.uri = body.getValue(body.ID);
                                angular.forEach(fabioTypes, function(fabioType){
                                    if (type === fabioType.resource){
                                        $scope.link.linkTypeDesc = fabioType.label;
                                    }
                                });
                            }

                        });

                        var authorDetails = anno.getValues(anno.ANNOTATED_BY);
                        angular.forEach(authorDetails, function(authorDetail){
                            if (authorDetail instanceof jsonoa.types.Person){
                                $scope.author = authorDetail.getValue(authorDetail.GIVEN_NAME) + ' ' + authorDetail.getValue(authorDetail.FAMILY_NAME);
                            } else if (authorDetail instanceof jsonoa.types.Organization){
                                $scope.organization = authorDetail.getValue(authorDetail.NAME);
                            }
                        });

                        if (!$scope.comment){
                            $scope.noComment=true;
                        }
                    } else {
                        $scope.$apply(function(){
                            $scope.errorMsg='Error: No annotations returned';
                        });
                    }
                });
            },
            function(error){
                $scope.$apply(function(){
                    $scope.errorMsg='Error: ' + error;
                });
            }
        );
    }]);

/**
 * New annotation screen.
 */
charme.web.controllers.controller('NewAnnotationCtrl', ['$scope', '$routeParams', '$location', '$window', '$timeout', 'saveAnnotation', 'loginService', 'fetchFabioTypes',
    function ($scope, $routeParams, $location, $window, $timeout, saveAnnotation, loginService, fetchFabioTypes){
        $scope.newAnnotationFlag=true;
        var targetId=$routeParams.targetId;
        $scope.targetId=targetId;
        $scope.loggedIn=loginService.isLoggedIn();
        fetchFabioTypes().then(function(types){
            var options = [];
            angular.forEach(types, function(type, innerKey){
                options.push({text: type.label, value: type.resource});
            });
            $scope.$apply(function(){
                $scope.citoTypes = options;
            });
        });

        $scope.cancel = function(){
            if ($scope.loading)
                return;
            $location.path(encodeURIComponent(targetId) + '/annotations/');
        };
        $scope.changeURI = function(uri){
            $scope.anno.citoText='';
            var doiVal = charme.logic.findDOI(uri);
            if (doiVal){
                var criteria = {};
                criteria[charme.logic.constants.CROSSREF_CRITERIA_DOI]=uri;
                charme.logic.fetchCrossRefMetaData(criteria).then(function(citation){
                    $scope.$apply(function(){
                        $scope.anno.citoText = citation;
                    });
                });
            }
        };
        $scope.login = function(){
            window.addEventListener('message', loginService._loginEvent, false);
            window.open(charme.logic.urls.authRequest());
            loginService.addLoginListener(function(authToken){
                $scope.$apply(function(){
                    $scope.loggedIn=authToken.token ? true : false;
                });
            });
        };

        $scope.save = function(annoModel){
            if ($scope.loading)
                return;
            $scope.loading=true;
            var auth = loginService.getAuth();
            saveAnnotation(annoModel, targetId, auth).then(
                function(){
                    $scope.$apply(function(){
                        $scope.loading=false;
                        $location.path(encodeURIComponent(targetId) + '/annotations/');

                        //Issue the  refresh message
                        top.postMessage('refreshAnnotationCount' + ":::" + targetId, '*');

                    });
                },
                function(error){
                    $scope.$apply(function(){
                        if (error.status===401){
                            $scope.errorMsg='Authentication failed. Please login and try again.';
                            $scope.loggedIn=false;
                            loginService.logout();
                        } else {
                            $scope.errorMsg=error;
                        }
                        $scope.loading=false;
                    });
                });
        };
    }]);

charme.web.controllers.controller('SearchCtrl', ['$scope', '$routeParams', '$location', '$window', '$timeout', 'fetchAllSearchFacets', 'searchAnnotations',
    function($scope, $routeParams, $location, $window, $timeout, fetchAllSearchFacets, searchAnnotations) {
        var targetId=$routeParams.targetId;

        fetchAllSearchFacets().then(function(facetTypes){
            $scope.$apply(function(){
                $scope.motivations = facetTypes[charme.logic.constants.FACET_TYPE_MOTIVATION];
                $scope.linkTypes = facetTypes[charme.logic.constants.FACET_TYPE_DATA_TYPE];
                $scope.domainsOfInterest = facetTypes[charme.logic.constants.FACET_TYPE_DOMAIN];
                $scope.organizations = facetTypes[charme.logic.constants.FACET_TYPE_ORGANIZATION];
            });
        });

		var criteriaFromSearch = function(){
			var criteria = {
				targets:[targetId]
			};
			var selectedMotivations = [];
			var motivationParam = $location.search()[charme.web.constants.PARAM_MOTIVATIONS];
			if (typeof motivationParam === 'string'){
				var motivationParamsArr = motivationParam.split(',');
				angular.forEach(motivationParamsArr, function(selectedMotivation) {
					selectedMotivations.push(selectedMotivation);
				});
				criteria.motivations = selectedMotivations;//[$scope.criteria.selectedMotivations];
			}

			var selectedDomains = [];
			var domainsParam = $location.search()[charme.web.constants.PARAM_DOMAINS];
			if (typeof domainsParam === 'string'){
				var domainsParamArr = domainsParam.split(',');
				angular.forEach(domainsParamArr, function(selectedDomain) {
					selectedDomains.push(selectedDomain);
				});
				criteria.domainsOfInterest = selectedDomains;
			}
			var organization = $location.search()[charme.web.constants.PARAM_ORGANIZATION];
			if (typeof organization === 'string'){
				criteria.organization = organization;
			}

			var creator = $location.search()[charme.web.constants.PARAM_CREATOR];
			if (typeof creator === 'string') {
				criteria.creator = creator;
			}
			return criteria;
		};

		var loadCriteriaIntoModel = function(criteria){
			if (typeof $scope.criteria=== 'undefined'){
				$scope.criteria = {};
			}
			if (criteria.motivations instanceof Array){
				var loadedMotivations = [];
				angular.forEach(criteria.motivations, function(motivation){
					loadedMotivations.push({value: motivation});
				})
				$scope.criteria.selectedMotivations = loadedMotivations;
			}

			if (criteria.domainsOfInterest instanceof Array){
				var loadedDomains = [];
				angular.forEach(criteria.domainsOfInterest, function(domain){
					loadedDomains.push({value: domain});
				})
				$scope.criteria.selectedDomains = loadedDomains;
			}

			if (typeof criteria.organization !== 'undefined'){
				$scope.criteria.selectedOrganization = criteria.organization;
			}

			if (typeof criteria.creator !== 'undefined'){
				$scope.criteria.selectedCreator = criteria.creator;
			}

		}

		var criteriaOnLoad = criteriaFromSearch();
		loadCriteriaIntoModel(criteriaOnLoad);
        searchAnnotations.searchAnnotations(criteriaOnLoad);

		var debounceHandle;

        $scope.$watch('criteria', function(){
            if (typeof $scope.criteria !== 'undefined') {

				if (debounceHandle){
					$timeout.cancel(debounceHandle);
				}

				/*
				Set timeout here in order to 'debounce' input from text fields. This avoids a search being triggered on each keypress.
				Newer versions of angular provide this out of the box, but we are stuck supporting IE8. For now...
				*/
				debounceHandle = $timeout(function() {
					var selectedMotivations = [];
					angular.forEach($scope.criteria.selectedMotivations,
						function (selectedMotivation) {
							selectedMotivations.push(selectedMotivation.value);
						});
					var currentMotivations = $location.search()[charme.web.constants.PARAM_MOTIVATIONS];
					currentMotivations =
							typeof currentMotivations === 'undefined' ? '' : currentMotivations;
					var newMotivations = selectedMotivations.join(',');
					if (currentMotivations !== newMotivations) {
						$location.search(charme.web.constants.PARAM_MOTIVATIONS, newMotivations);
					}

					var selectedDomains = [];
					angular.forEach($scope.criteria.selectedDomains, function (selectedDomain) {
						selectedDomains.push(selectedDomain.value);
					});
					var currentDomains = $location.search()[charme.web.constants.PARAM_DOMAINS];
					currentDomains = typeof currentDomains === 'undefined' ? '' : currentDomains;
					var newDomains = selectedDomains.join(',');
					if (currentDomains !== newDomains) {
						$location.search(charme.web.constants.PARAM_DOMAINS, newDomains);
					}

					var currentOrganization = $location.search()[charme.web.constants.PARAM_ORGANIZATION];
					currentOrganization =
							typeof currentOrganization === 'undefined' ? '' : currentOrganization;
					var newOrganization = $scope.criteria.selectedOrganization;
					if (currentOrganization !== newOrganization) {
						$location.search(charme.web.constants.PARAM_ORGANIZATION, newOrganization);
					}

					var currentCreator = $location.search()[charme.web.constants.PARAM_CREATOR];
					currentCreator = typeof currentCreator === 'undefined' ? '' : currentCreator;
					var newCreator = $scope.criteria.selectedCreator;
					if (currentCreator !== newCreator) {
						$location.search(charme.web.constants.PARAM_CREATOR, newCreator);
					}
				}, 500);
            }
        }, true);

		$scope.$on('$routeUpdate', function(){
			searchAnnotations.searchAnnotations(criteriaFromSearch());
		});

        $scope.cancel = function(){
            if ($scope.loading)
                return;

            $location.path(encodeURIComponent(targetId) + '/annotations/');
        };
    }]);
