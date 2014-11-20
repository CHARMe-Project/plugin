/*
 * Copyright (c) 2014, CGI
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without modification, are 
 * permitted provided that the following conditions are met:
 * 1. Redistributions of source code must retain the above copyright notice, this list of 
 *    conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list 
 *    of conditions and the following disclaimer in the documentation and/or other materials 
 *    provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors may be 
 *    used to endorse or promote products derived from this software without specific prior 
 *    written permission.
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF 
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL 
 * THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, 
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT 
 * OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) 
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR 
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS 
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 */

charme.web.controllers = angular.module('charmeControllers', ['charmeServices']);

charme.web.controllers.controller('InitCtrl', ['$scope', '$routeParams', '$location', '$filter', 'loginService', 'targetService', 'searchBarService', 'searchAnnotations',
    function ($scope, $routeParams, $location, $filter, loginService, targetService, searchBarService, searchAnnotations){
        searchAnnotations.clearListeners();
        var targetId = $routeParams.targetId;
        loginService._loadState();

        // call the getSelectedTargets() function on charme.js
        var selectedTargets = window.parent.charme.plugin.getSelectedTargets();

        if(selectedTargets.hasOwnProperty(charme.common.ALL_TARGETS)) {
            targetService.targets = {};
            targetService.targets[charme.common.ALL_TARGETS] = selectedTargets[charme.common.ALL_TARGETS];
            searchBarService.isSearchOpen = true;
        }
        else
            targetService.targets = selectedTargets;

        $location.path(encodeURIComponent(targetId) + '/annotations/');
    }
]);

/**
 * A controller specific to the plugin header
 */
charme.web.controllers.controller('HeaderCtrl', ['$scope', 'targetService', 'minimisedService', 
function ($scope, targetService, minimisedService){
    $scope.close = function() {
        //var targetId = $routeParams.targetId;
        //charme.web.close($.map(targetService.targets, function(value, index){return index;}).length === 1, targetId);
        charme.web.close($.map(targetService.targets, function(value, index){return index;}).length === 1, targetService.targets);
    };

    $scope.size = 'max';
    $scope.minimise = function(){
        $scope.size = 'min';
        $scope.headerBorderBottomStyle = $('#charmeDragHandle').css('border-bottom');
        $('#charmeDragHandle').css('border-bottom', 'none');
        $('.modal-body').hide();
        $('.modal-footer').hide();
        minimisedService.isMinimised = true;
        charme.web.minimise(top.document.getElementById('charme-plugin-frame').offsetTop);
    };
    $scope.maximise = function(){
        $scope.size = 'max';
        $('#charmeDragHandle').css('border-bottom', $scope.headerBorderBottomStyle);
        $('.modal-body').show();
        $('.modal-footer').show();
        minimisedService.isMinimised = false;
        charme.web.maximise();
    };
    
    $scope.back = function() {
        window.history.back();
    };
    $scope.forward = function() {
        window.history.forward();
    };
    //$scope.reload = function() {
    //    location.reload(true);
    //};
    
    // If data provider allows the plugin GUI to be dragged, make header element the handle for dragging
    var plugin = window.parent.document.getElementById('charme-placeholder');
    if(plugin.className === 'charme-draggable')
        document.onLoad = dragIF_addHandle(document.getElementById('charmeDragHandle'), window);
}]);
charme.web.controllers.controller('FooterCtrl', ['$rootScope', '$scope', '$timeout',
function($rootScope, $scope, $timeout){
    $scope.confirmDelete = false;
    
    $rootScope.$on('noDelete', function() {
        $scope.confirmDelete = false;
    });
    
    //$('.shift-anno-buttons-holder').css('right', ($('.modal-footer').outerWidth() - $('.shift-anno-buttons-holder').outerWidth()) / 2);
    $rootScope.$on('shiftButtons', function() {
        $timeout(function() {
            $scope.$apply(function() {
                $('.shift-anno-buttons-holder').css('right', ($('.modal-footer').outerWidth() - $('.shift-anno-buttons-holder').outerWidth()) / 2);
            });
        });
    });
}]);

/**
 * List the results of an annotation search.
 */
charme.web.controllers.controller('ListAnnotationsCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$filter', '$timeout', 'fetchAnnotationsForTarget', 'loginService', 'searchAnnotations', 'targetService', 'searchBarService', 'shiftAnnoService', 'minimisedService',
    function ($rootScope, $scope, $routeParams, $location, $filter, $timeout, fetchAnnotationsForTarget, loginService, searchAnnotations, targetService, searchBarService, shiftAnnoService, minimisedService){
        $scope.listAnnotationsFlag=true;
        $scope.loadingList = $scope.loadingFacets = true;
        $scope.targets = targetService.targets;
        $scope.close = function() {
            var targetId = $routeParams.targetId;
            charme.web.close($.map(targetService.targets, function(value, index){return index;}).length === 1, targetId);
        };
        
        $scope.isSearchOpen = searchBarService.isSearchOpen;
        if(searchBarService.targetDropdownFlag) {
            $scope.searchOpen = 'open';
            searchBarService.targetDropdownFlag = false;
        }
        else
            $scope.searchOpen = $scope.isSearchOpen ? 'opened' : 'collapsed';

        $scope.smallSpan = top.window.innerWidth < charme.common.LARGE_WINDOW ? 'span5' : 'span7';
        $scope.largeSpan = 'span12';
        if($scope.isSearchOpen)
            $timeout(function() {
                $('#chooseTarget').removeClass($scope.largeSpan).addClass($scope.smallSpan);
            });

        var cachedIsSearchOpen = $scope.isSearchOpen;
        
        $scope.setSearchOpen = function() {
            if($scope.searchOpen === 'open' || $scope.searchOpen === 'opened') {
                $scope.searchOpen = 'collapse';
                searchBarService.isSearchOpen = $scope.isSearchOpen = false;
                $('#chooseTarget').removeClass($scope.smallSpan).addClass($scope.largeSpan);
            }
            else {
                $scope.searchOpen = 'open';
                searchBarService.isSearchOpen = $scope.isSearchOpen = true;
                $('#chooseTarget').removeClass($scope.largeSpan).addClass($scope.smallSpan);
            }
        };
        
        // Adjust GUI width to fit user's window size, with debounce to avoid function calls stacking up
        var pluginWidthResize = charme.logic.debounce(function() {
            if(minimisedService.isMinimised)
                return;
            
            $scope.$apply(function(){
                if($scope.searchOpen === 'open' || $scope.searchOpen === 'opened')
                    $('#chooseTarget').removeClass($scope.smallSpan);
                
                $scope.smallSpan = top.window.innerWidth < charme.common.LARGE_WINDOW ? 'span5' : 'span7';
                
                if($scope.searchOpen === 'open' || $scope.searchOpen === 'opened')
                    $('#chooseTarget').addClass($scope.smallSpan);
                
                var plugin = top.window.document.getElementById('charme-plugin-frame');
                if(top.window.innerWidth <= charme.common.SMALL_WINDOW)
                    plugin.style.width = plugin.style.minWidth = charme.common.SMALL_WIDTH + 'px';
                else if(top.window.innerWidth >= charme.common.LARGE_WINDOW)
                    plugin.style.minWidth = charme.common.LARGE_WIDTH + 'px';
                else
                    plugin.style.minWidth = top.window.innerWidth + 'px';
            });
        }, 1000);

        top.window.addEventListener('resize', pluginWidthResize);

        /*
         * Check if already logged in
         */
        $scope.loggedIn=loginService.isLoggedIn();
        if($scope.loggedIn) {
            $scope.author = 'Loading...';
        
            var auth = loginService.getAuth();
            if(auth && auth.user) {
                $scope.author=auth.user.first_name + ' ' + auth.user.last_name;
                $scope.userName = auth.user.username;
                $scope.email=auth.user.email;
            }
        }

        /*
         * Register a login listener for future login events
         */
        loginService.addLoginListener(function(authToken){
            $scope.$apply(function(){
                $scope.loggedIn=authToken.token ? true : false;
                var user = authToken.user;
                $scope.author=user.first_name + ' ' + user.last_name;
                $scope.userName = auth.user.username;
                $scope.email=user.email;
            });
        });

        var targetId = $routeParams.targetId;
        targetService.listViewTarget = targetId;
        
        //$timeout(function() {
        //    $scope.targetIdKey=$scope.targets[targetId][0];
        //});
        
        // Remove the empty option from the dropdown by initialising the model value...
        $scope.selectedTarget = targetId;
        // ... then, after HTML rendering, ensure the correct option is shown as being selected
        $timeout(function() {
            var targetSelect = document.getElementById("chooseTarget");
            targetSelect.value = targetId;

            // Avoid selected option being shown twice (doesn't happen in IE, but don't need to check if browser is IE here)
            targetSelect.options[targetSelect.options.selectedIndex].style.display = 'none';
        });
        
        /**
         * Onclick functions for buttons
         */

        $scope.viewTargets = function() {
            $location.path(encodeURIComponent(targetId) + '/annotations/datasets/');
        };

        $scope.refreshTargetSelection = function() {
            //var targetSelect = document.getElementById("chooseTarget");

            searchBarService.isSearchOpen = cachedIsSearchOpen;
            $location.path(encodeURIComponent($scope.selectedTarget) + '/annotations/');
        };

        $scope.newAnnotation = function(){
            $location.path(encodeURIComponent(targetId) + '/annotations/new/');
        };

        $scope.login = function(){
            //window.addEventListener('message', loginService._loginEvent, false);
            window.addEventListener('message', loginService.handshake, false);
            window.open(charme.logic.urls.authRequest());
        };

        loginService.addLogoutListener(function(){
            $scope.loggedIn=false;
        });

        $scope.logout = function(){
            loginService.logout();
        };

		/**
		 * Listen for search events. Searches are triggered by asynchronous events in the faceted search bar.
		 */
        $scope.targetId=targetId;

        searchAnnotations.addListener(searchAnnotations.listenerTypes.BEFORE_SEARCH, function(){
            $scope.entries = [];
            $scope.loadingList = true;
            $scope.errorMsg = '';
        });

        searchAnnotations.addListener(searchAnnotations.listenerTypes.AFTER_SEARCH, function(){
            $scope.$apply(function(){
                $scope.loadingList = false;
            });
        });

        searchAnnotations.addListener(searchAnnotations.listenerTypes.SUCCESS, function(results, pages, pageNum, lastPage){
            $scope.$apply(function(){
                $scope.entries = results;
                $scope.pages = pages;
                
                if(pageNum <= Math.ceil(charme.logic.constants.NUM_PAGE_BUTTONS / 2) || lastPage <= charme.logic.constants.NUM_PAGE_BUTTONS)
                    $scope.offset = 1;
                else if(pageNum >= lastPage - Math.floor(charme.logic.constants.NUM_PAGE_BUTTONS / 2))
                    $scope.offset = lastPage - charme.logic.constants.NUM_PAGE_BUTTONS + 1;
                else
                    $scope.offset = pageNum - Math.floor(charme.logic.constants.NUM_PAGE_BUTTONS / 2);

                $scope.lastPage = lastPage;
                $scope.pageIncrement = Math.ceil(lastPage / 10);
                
                angular.forEach($scope.entries, function(entry) {
                    //Double-escape URIs embedded within a URI in order to work with Angular routing
                    entry.uri = '#/' + encodeURIComponent(encodeURIComponent(targetId)) + '/annotation/' 
                                     + encodeURIComponent(encodeURIComponent(entry.id)) + '/';
                });

                shiftAnnoService.annoList[targetId] = $scope.entries;
            });
        });

        searchAnnotations.addListener(searchAnnotations.listenerTypes.ERROR, function(errorMsg){
            $scope.$apply(function(){
                $scope.errorMsg = errorMsg;
                
                if($scope.pages) {
                    for(var i = 0; i < $scope.pages.length; i++) {
                        if(i === criteria.pageNum - $scope.offset)
                            $scope.pages[i] = {status: 'current'};
                        else
                            $scope.pages[i] = {status: 'notCurrent'};
                    }
                }
            });
        });
        
        $rootScope.$on('facetsFetched', function() {
            $scope.loadingFacets = false;
        });

        /**
         * Search criteria are encoded in URL. This is a convenience function for retrieving search criteria from URL
         * @type {{}}
         */
        var criteria = {};
        var criteriaFromUrl = function() {
            criteria.targetTypes = $location.search()[charme.web.constants.PARAM_TARGET_TYPES];
            criteria.bodyTypes = $location.search()[charme.web.constants.PARAM_BODY_TYPES];
            criteria.motivations = $location.search()[charme.web.constants.PARAM_MOTIVATIONS];
            criteria.domainsOfInterest = $location.search()[charme.web.constants.PARAM_DOMAINS];
            criteria.organization = $location.search()[charme.web.constants.PARAM_ORGANIZATION];
            criteria.creator = $location.search()[charme.web.constants.PARAM_CREATOR];
            criteria.resultsPerPage = $location.search()['resultsPerPage'];
            criteria.selectedRPP = $location.search()['selectedRPP'];
            criteria.pageNum = $location.search()['pageNum'];
            
            //var listOrder = $location.search()['listOrder'];
            //if(typeof listOrder === 'string')
            //    criteria.listOrder = listOrder;

            return criteria;
        };
        
        criteria = criteriaFromUrl();
        
        var onNewCriteria = $rootScope.$on('newCriteria', function(event, newCriteria) {//, newListOrder) {
            criteria.targetTypes = newCriteria.targetTypes;
            criteria.bodyTypes = newCriteria.bodyTypes;
            criteria.motivations = newCriteria.motivations;
            criteria.domainsOfInterest = newCriteria.domainsOfInterest;
            criteria.organization = newCriteria.organization;
            criteria.creator = newCriteria.creator;
            criteria.resultsPerPage = newCriteria.resultsPerPage;
            criteria.selectedRPP = newCriteria.selectedRPP;
            criteria.pageNum = newCriteria.pageNum;
        });
        $scope.$on('$destroy', function() {
            onNewCriteria(); // Remove listener
        });
        
        /*$rootScope.$on('listOptions', function(event, newResultsPerPage, newSelectedRPP) {//, newListOrder) {
            criteria.resultsPerPage = newResultsPerPage;
            criteria.selectedRPP = newSelectedRPP;
            //criteria.listOrder = newListOrder;
        });*/
        
        // Store resultsPerPage and selectedRPP in the URL so they can be retrieved if user invokes $scope.directSearch when viewing annotation
        $scope.viewAnnotation = function(annoId) {
            $timeout(function() {
                criteria.targetTypes = criteria.targetTypes === '' ? '' : criteria.targetTypes.join(',');
                criteria.bodyTypes = criteria.bodyTypes === '' ? '' : criteria.bodyTypes.join(',');
                criteria.motivations = criteria.motivations === '' ? '' : criteria.motivations.join(',');
                criteria.domainsOfInterest = criteria.domainsOfInterest === '' ? '' : criteria.domainsOfInterest.join(',');
                criteria.organization = criteria.organization === '' ? '' : criteria.organization.toString();
                criteria.creator = criteria.creator === '' ? '' : criteria.creator.toString();
                criteria.resultsPerPage = criteria.resultsPerPage === '' ? '' : criteria.resultsPerPage.toString();
                criteria.selectedRPP = criteria.selectedRPP === '' ? '' : criteria.selectedRPP.toString();
                //criteria.listOrder = criteria.listOrder === '' ? '' : criteria.listOrder.toString();
                criteria.pageNum = criteria.pageNum === '' ? '' : criteria.pageNum.toString();
                
                $location.search(charme.web.constants.PARAM_TARGET_TYPES, criteria.targetTypes)
                         .search(charme.web.constants.PARAM_BODY_TYPES, criteria.bodyTypes)
                         .search(charme.web.constants.PARAM_MOTIVATIONS, criteria.motivations)
                         .search(charme.web.constants.PARAM_DOMAINS, criteria.domainsOfInterest)
                         .search(charme.web.constants.PARAM_ORGANIZATION, criteria.organization)
                         .search(charme.web.constants.PARAM_CREATOR, criteria.creator)
                         .search('resultsPerPage', criteria.resultsPerPage)
                         .search('selectedRPP', criteria.selectedRPP)
                         //.search('listOrder', criteria.listOrder)
                         .search('pageNum', criteria.pageNum)
                         .replace();
            });
        };
        
        $scope.setPage = function(newPage){
            $rootScope.$broadcast('changePage', newPage, $scope.lastPage, $scope.pages);
        };
        
        $scope.directSearch = function(facet, name, evt) {
            evt.preventDefault();
            $location.path(encodeURIComponent(targetId) + '/annotations/').search(facet, name).search('pageNum', '1');
        };

        var cachedTarget;
        var waitAnotherClickFlag = true;
        $('#chooseTarget')
            .focus(function() {
                cachedIsSearchOpen = $scope.isSearchOpen;
                cachedTarget = $scope.selectedTarget;

                if($scope.isSearchOpen) {
                    searchBarService.targetDropdownFlag = true;
                    $(this).removeClass($scope.smallSpan).addClass($scope.largeSpan);

                    $scope.$apply(function() {
                        $scope.searchOpen = 'collapse';
                        searchBarService.isSearchOpen = $scope.isSearchOpen = false;
                        $location.replace();
                    });

                    // In this particular case, the initial click to give focus to the dropdown doesn't fire 
                    // the .click function, only the .focus function. When the search bar is closed, or with 
                    // other browsers, both the .focus and .click functions fire with the initial click.
                    if(charme.common.isChrome)
                        $(this).click();
                }
            })
            .blur(function() {
                waitAnotherClickFlag = true;
        
                if(cachedIsSearchOpen) {
                    searchBarService.targetDropdownFlag = false;
                    $(this).removeClass($scope.largeSpan).addClass($scope.smallSpan);
                    
                    $scope.$apply(function() {
                        $scope.searchOpen = 'open';
                        searchBarService.isSearchOpen = $scope.isSearchOpen = true;
                        $location.replace();
                    });
                }
            })
            .click(function() {
                if(waitAnotherClickFlag)
                    waitAnotherClickFlag = false;
                else if($scope.selectedTarget === cachedTarget)
                    $(this).blur();
            });
    }]);

/**
 * View details of individual annotation.
 */
charme.web.controllers.controller('ViewAnnotationCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$timeout', '$window', 'fetchTargetTypeVocab', 'fetchAnnotation', 'fetchKeywords', 'fetchAllMotivations', 'searchAnnotations', 'deleteAnnotation', 'loginService', 'shiftAnnoService', 'targetService', 'replyToAnnoService', 
    function ($rootScope, $scope, $routeParams, $location, $timeout, $window, fetchTargetTypeVocab, fetchAnnotation, fetchKeywords, fetchAllMotivations, searchAnnotations, deleteAnnotation, loginService, shiftAnnoService, targetService, replyToAnnoService){
        $scope.viewAnnotationFlag=true;
        searchAnnotations.clearListeners();
        $scope.loading=true;
        var targetId = $routeParams.targetId;
        $scope.loggedIn=loginService.isLoggedIn();
        
        var criteria = {};
        var criteriaFromUrl = function() {
            criteria.targetTypes = $location.search()[charme.web.constants.PARAM_TARGET_TYPES];
            criteria.bodyTypes = $location.search()[charme.web.constants.PARAM_BODY_TYPES];
            criteria.motivations = $location.search()[charme.web.constants.PARAM_MOTIVATIONS];
            criteria.domainsOfInterest = $location.search()[charme.web.constants.PARAM_DOMAINS];
            criteria.organization = $location.search()[charme.web.constants.PARAM_ORGANIZATION];
            criteria.creator = $location.search()[charme.web.constants.PARAM_CREATOR];
            criteria.resultsPerPage = $location.search()['resultsPerPage'];
            criteria.selectedRPP = $location.search()['selectedRPP'];
            criteria.pageNum = $location.search()['pageNum'];
            
            //var listOrder = $location.search()['listOrder'];
            //if(typeof listOrder === 'string')
            //    criteria.listOrder = listOrder;

            return criteria;
        };
        
        $timeout(function() {
            criteria = criteriaFromUrl();
        });
        
        $scope.flag = function(){
            alert('Flag annotation as inappropriate (for review by moderator): this functionality will be enabled in a future iteration of CHARMe');
        };
        
        $scope.return = function(){
            $location.path(encodeURIComponent(targetService.listViewTarget) + '/annotations/')
                     .search(charme.web.constants.PARAM_TARGET_TYPES, criteria.targetTypes)
                     .search(charme.web.constants.PARAM_BODY_TYPES, criteria.bodyTypes)
                     .search(charme.web.constants.PARAM_MOTIVATIONS, criteria.motivations)
                     .search(charme.web.constants.PARAM_DOMAINS, criteria.domainsOfInterest)
                     .search(charme.web.constants.PARAM_ORGANIZATION, criteria.organization)
                     .search(charme.web.constants.PARAM_CREATOR, criteria.creator)
                     .search('resultsPerPage', criteria.resultsPerPage)
                     .search('selectedRPP', criteria.selectedRPP)
                     //.search('listOrder', criteria.listOrder);
                     .search('pageNum', criteria.pageNum);
        };
        
        var annoId=$routeParams.annotationId;
        $scope.annotationId=annoId;
        $scope.targetId=targetId;
        
        $scope.viewAnnotation = function(annoId) {
            $timeout(function() {
                $location.search(charme.web.constants.PARAM_TARGET_TYPES, criteria.targetTypes)
                         .search(charme.web.constants.PARAM_BODY_TYPES, criteria.bodyTypes)
                         .search(charme.web.constants.PARAM_MOTIVATIONS, criteria.motivations)
                         .search(charme.web.constants.PARAM_DOMAINS, criteria.domainsOfInterest)
                         .search(charme.web.constants.PARAM_ORGANIZATION, criteria.organization)
                         .search(charme.web.constants.PARAM_CREATOR, criteria.creator)
                         .search('resultsPerPage', criteria.resultsPerPage)
                         .search('selectedRPP', criteria.selectedRPP)
                         //.search('listOrder', criteria.listOrder)
                         .search('pageNum', criteria.pageNum)
                         .replace();
            });
        };
        
        Promise.every(fetchKeywords(), fetchAnnotation(annoId), fetchAllMotivations(), fetchTargetTypeVocab()).then(
            function (results){
                $scope.loading=false;
                //Create local alias to avoid having to use fully resolved name
                var annoType = jsonoa.types.Annotation;
                $scope.$apply(function(){
                    var categories = results[0];
                    var keywords = {};
                    var motivations_catagories = results[2];
                    var motivation_keywords = {};
                    
                    //Process Motivation keywords
                    angular.forEach(motivations_catagories[0].keywords, function(keyword){
                        motivation_keywords[keyword.uri]=keyword.desc;
                    });
                    
                    var graph = results[1];
                    var targetTypeVocab = results[3];
                    //Process graph
                    var annoList = graph.getAnnotations();
                    if (annoList.length > 0) {
						var anno = graph.getNode(annoId);

                        var motivations = anno.getValues(annoType.MOTIVATED_BY);
                        if (motivations && motivations.length > 0) {
                            $scope.motivationTags = [];
                        }
                        angular.forEach(motivations, function (motivation){
                            var motivURI =  motivation.getValue(motivation.ID);
                            $scope.motivationTags.push({uri: motivURI, desc: motivation_keywords[motivURI]});
                        });

                        //Retrieve citations if present
                        var citoSpec = jsonoa.types.CitationAct;
                        if(anno.hasType(citoSpec.TYPE))
                        {
                            var citingEntity = anno.getValue(citoSpec.CITING_ENTITY);

                            if (citingEntity.getValue){
                                var citoURI = citingEntity.getValue(jsonoa.types.Common.ID);
                                $scope.citation = {};
                                $scope.citation.loading=true;
                                $scope.citation.uri = citoURI;

                                //Match the citation type to a text description.
                                var citoTypes = citingEntity.getValues(citingEntity.TYPE_ATTR_NAME);
                                angular.forEach(targetTypeVocab, function(fType){
                                    if (citoTypes.indexOf(fType.resource)>=0){
                                        if (!$scope.citation.types){
                                            $scope.citation.types = [];
                                        }
                                        $scope.citation.types.push(fType.label);
                                    }
                                });

                                //Trim the 'doi:' from the front
                                var doiTxt = citoURI.substring(charme.logic.constants.DXDOI_URL.length, citoURI.length);
                                var criteria = {};
                                criteria[charme.logic.constants.DXDOI_CRITERIA_ID]=doiTxt;
                                charme.logic.fetchDxdoiMetaData(criteria).then(function(citation){
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
                                $scope.link.uri = citingEntity;
                            }

                        }

                        var bodies = anno.getValues(annoType.BODY);
                        //Create local alias to avoid having to use fully qualified name everywhere
                        var textType = jsonoa.types.Text;
                        var citoSpec = jsonoa.types.CitationAct;
                        angular.forEach(bodies, function(body){
                            if (body.hasType(textType.TEXT) || body.hasType(textType.CONTENT_AS_TEXT)){
                                $scope.comment = body.getValue(textType.CONTENT_CHARS);
                            }
/*                            else if (body.hasType(citoSpec.TYPE)) {
                                var citingEntity = body.getValue(citoSpec.CITING_ENTITY);
                                //Check if the returned value is an object, or a primitive (should be an object, but some historical data might have primitives in this field)
                                if (citingEntity.getValue){
                                    var citoURI = citingEntity.getValue(jsonoa.types.Common.ID);
                                    $scope.citation = {};
                                    $scope.citation.loading=true;
                                    $scope.citation.uri = citoURI;

                                    //Match the citation type to a text description.
                                    var citoTypes = citingEntity.getValues(citingEntity.TYPE_ATTR_NAME);
                                    angular.forEach(targetTypeVocab, function(tType){
                                        if (citoTypes.indexOf(tType.resource)>=0){
                                            if (!$scope.citation.types){
                                                    $scope.citation.types = [];
                                            }
                                            $scope.citation.types.push(tType.label);
                                            //$scope.citation.citoTypeDesc = citoType.label;
                                        }
                                    });

                                    //Trim the 'doi:' from the front
                                    var doiTxt = citoURI.substring(charme.logic.constants.DXDOI_URL.length, citoURI.length);
                                    var criteria = {};
                                    criteria[charme.logic.constants.DXDOI_CRITERIA_ID]=doiTxt;
                                    charme.logic.fetchDxdoiMetaData(criteria).then(function(citation){
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
                                    $scope.link.uri = citingEntity;
                                }
                            }*/
                            else if (body.hasType(jsonoa.types.SemanticTag.TYPE)){
                                if (!$scope.domainTags){
                                    $scope.domainTags = [];
                                }
                                var tagURI = body.getValue(jsonoa.types.Common.ID);
                                var prefLabel = body.getValue(jsonoa.types.SemanticTag.PREF_LABEL);
                                $scope.domainTags.push({uri: tagURI, desc: prefLabel});
                            } else {
                                //Match the citation type to a text description.
                                var type = body.getValue(body.TYPE_ATTR_NAME);
                                $scope.link = {};
                                $scope.link.uri = body.getValue(jsonoa.types.Common.ID);
                                angular.forEach(targetTypeVocab, function(targetType){
                                    if (type === targetType.resource){
                                        $scope.link.linkTypeDesc = targetType.label;
                                    }
                                });
                            }
                        });

                        var authorDetails = anno.getValues(annoType.ANNOTATED_BY);
                        var personSpec = jsonoa.types.Person;
                        var organizationSpec = jsonoa.types.Organization;
                        angular.forEach(authorDetails, function(authorDetail){
                            if (authorDetail.hasType(personSpec.TYPE)){
                                $scope.author = authorDetail.getValue(personSpec.GIVEN_NAME) + ' ' + authorDetail.getValue(personSpec.FAMILY_NAME);
                                $scope.userName = authorDetail.getValue(personSpec.USER_NAME);
                            } else if (authorDetail.hasType(organizationSpec.TYPE)){
                                $scope.organizationName = authorDetail.getValue(organizationSpec.NAME);
                                $scope.organizationUri = authorDetail.getValue(organizationSpec.URI);
                            }
                        });

						var annoDate = anno.getValue(annoType.DATE);
						$scope.annoDate = annoDate[jsonoa.types.Common.VALUE];

						var modificationOf = anno.getValue(annoType.WAS_REVISION_OF);
						if (typeof modificationOf !== 'undefined'){
							$scope.modificationOf = modificationOf.getValue(jsonoa.types.Common.ID);
						}

                        //Extract the targetid(s) of the annotation
                        //var targets = anno.getValues(annoType.TARGET);
                        var targets = [];

                        //If  a composite type is found, exract the multiple targets from the composite
                        //else just extarct the single target
                        var composite = anno.getValues(annoType.TARGET);
                        if (composite.hasType(jsonoa.types.Composite.TYPE))
                        {
                            angular.forEach(composite, function(element){
                                targets.push(element.getValue(jsonoa.types.Composite.ITEM))
                            });
                        }
                        else
                        {
                            targets = anno.getValues(annoType.TARGET);
                        }
                        
                        if(targets && targets.length > 0) {
                            $scope.targetList = [];
                        }
                        
                        var date = anno.getValue(annoType.DATE);
                        $scope.date = (date !== undefined && date.hasOwnProperty('@value')) ? date['@value'] : 'undefined';

                        var validTargetTypeLabels = {};
                        for(var i = 0; i < targetTypeVocab.length; i++) {
                            var label = targetTypeVocab[i].label.replace(/ /g, "");
                            validTargetTypeLabels[label] = targetTypeVocab[i].label;
                        }
                        
                        angular.forEach(targets, function(target){
                            var targetHref = target.getValue(jsonoa.types.Common.ID);
                            var targetName = targetHref;//.substring(targetHref.lastIndexOf('/') + 1);

                            //var targetType = (target.getValue(jsonoa.types.Common.TYPE));
                            var targetType;
                            var targetTypes = (target.getValues(jsonoa.types.Common.TYPE));
                            targetType = targetTypes[0].substring(targetTypes[0].lastIndexOf('/') + 1);
                            targetType = targetType.substring(targetType.lastIndexOf('#') + 1);
                            targetType = targetType === 'Annotation' ? 'CHARMeAnnotation' : targetType; // id workaround
                            
                            if(targetType !== 'CHARMeAnnotation') {
                                $scope.targetList.push({uri: targetHref, name: targetName, desc: validTargetTypeLabels[targetType]});
                            }
                            else {
                                var targetLoading = {uri: targetHref, name: 'Loading...', desc: validTargetTypeLabels[targetType]};
                                $scope.targetList.push(targetLoading);
                                
                                fetchAnnotation(targetHref).then(function(graph) {
                                    var annoList = graph.getAnnotations();
                                    if (annoList.length > 0) {
                                        //var anno = annoList[0];
                                        var anno = charme.logic.filterAnnoList(annoList, annoType);
                                        var bodies = anno.getValues(annoType.BODY);
                                        var textType = jsonoa.types.Text;
                                        $scope.targetComment = '(No comment)';
                                        angular.forEach(bodies, function(body){
                                            if(body.hasType(textType.TEXT) || body.hasType(textType.CONTENT_AS_TEXT)){
                                                $scope.targetComment = body.getValue(textType.CONTENT_CHARS);
                                            }
                                        });
                                    }
                                    
                                    var targetLoaded = {uri: targetHref, name: '"' + $scope.targetComment + '"', desc: validTargetTypeLabels[targetType]};
                                    $scope.targetList.splice($scope.targetList.indexOf(targetLoading), 1, targetLoaded);
                                    $scope.$apply();
                                    
                                    var targetDropdown = document.getElementById('targetList');
                                    // Avoid first option being shown twice (doesn't happen in IE, but don't need to check if browser is IE here)
                                    targetDropdown.options[0].style.display = 'none';
                                    targetDropdown.selectedIndex = 0; // Fix for Firefox to make first option displayed (rather than blank)
                                }, function(error) {
                                    var targetLoaded = {uri: targetHref, name: 'Error loading text', desc: validTargetTypeLabels[targetType]};
                                    $scope.targetList.splice($scope.targetList.indexOf(targetLoading), 1, targetLoaded);
                                    $scope.$apply();
                                    
                                    var targetDropdown = document.getElementById('targetList');
                                    // Avoid first option being shown twice (doesn't happen in IE, but don't need to check if browser is IE here)
                                    targetDropdown.options[0].style.display = 'none';
                                    targetDropdown.selectedIndex = 0; // Fix for Firefox to make first option displayed (rather than blank)
                                });
                            }
                        });

                        // Remove the empty option from the dropdown by initialising the model value
                        if(targetId === charme.common.ALL_TARGETS)
                            $scope.targetListDisplay = $scope.targetList[0].name;
                        else
                            $scope.targetListDisplay = targetId;
                        
                        $timeout(function() {
                            if($scope.targetList.length > 1)
                                $scope.multipleTargets = true;
                            
                            if($scope.domainTags && $scope.domainTags.length > 1)
                                $scope.multipleDomains = true;
                            
                            if($scope.motivationTags && $scope.motivationTags.length > 1)
                                $scope.multipleMotivations = true;
                        });
                        
                        // Replying to annotation
                        $scope.replyToAnno = function() {
                            $location.path(encodeURIComponent(annoId) + '/annotations/new/');
                            replyToAnnoService.comments = $scope.comment;
                        };
                        
                        /*
                         Annotation deletion.
                         */
                        var auth = loginService.getAuth();
                        if($scope.loggedIn && auth && $scope.userName === auth.user.username) {
                                $scope.creatorOfAnnotationFlag = true;
								$scope.modifyAnnotationFlag = true;
                                
                                $scope.confirmBoxContent = {
                                    message: 'Delete this annotation?',
                                    confirm: 'Yes',
                                    cancel: 'No'
                                };

								$scope.modify = function () {
									$location.path('/' + encodeURIComponent(targetId) + '/annotations/' + encodeURIComponent(annoId) + '/edit/');
								};

                                $scope.getConfirm = function() {
                                    $scope.confirmDelete = true;
                                };
                                $scope.noDelete = function() {
                                    $scope.confirmDelete = false;
                                    $rootScope.$broadcast('noDelete');
                                };
                                
                                $scope.deleteAnnotation = function () {
                                    $scope.confirmDelete = false;
                                    $scope.processing=true;
                                    $('.ajaxModal').height($('.modal-body-view')[0].scrollHeight);
                                    $('.popover-visible').css('z-index', '0');
                                    
                                    deleteAnnotation(annoId, auth.token).then(function (response) {
                                        $scope.$apply(function() {
                                            $scope.processing=false;
                                            angular.forEach($scope.targetList, function(thisTarget) {
                                                window.top.postMessage('refreshAnnotationCount' +
                                                        ":::" + thisTarget.uri, '*');
                                            });
                                            $location.path(encodeURIComponent(targetId) +
                                                    '/annotations/');
                                            });
                                        }, function (error) {
                                            $scope.$apply(function() {
                                                $scope.processing=false;
                                                $scope.errorMsg='Unable to delete annotation';
                                            });
                                        });
                                };
                        }

                        if (!$scope.comment){
                            $scope.noComment=true;
                        }
                    } else {
                        // $timeout used to avoid 'apply already in progress' error
                        $timeout(function() {
                            $scope.$apply(function(){
                                $scope.errorMsg='Error: No annotation returned';
                            });
                        });
                    }
                });
                
                
                // annoOnAnno code:
                var criteria = {
                    targets: [annoId],
                    pageNum: '1',
                    resultsPerPage: '100000',
                    targetIsAnno: true
                };
                
                var numSearchesStarted = 1, numSearchesCompleted = 0;
                $scope.loadingReplies = true;
                var annoList = [];
                
                // id workaround
                var resultIdList = {};
                resultIdList[annoId] = '';

                // Fires twice: first time for searchAnnotations call in SearchCtrl, second time for searchAnnotations call in this Ctrl
                searchAnnotations.addListener(searchAnnotations.listenerTypes.SUCCESS, function(results, pages, pageNum, lastPage, totalResults, targetIsAnno){
                    if(targetIsAnno) {
                        $scope.$apply(function() {
                            numSearchesCompleted++;
                            if(numSearchesCompleted === (numSearchesStarted + results.length)) {
                                annoList.sort(function(a, b) {return (Date.parse(b.date) - Date.parse(a.date));});
                                
                                /*console.log('annoList');
                                console.log(annoList);
                                
                                var sortedAnnoList = [], newSortedAnnoList = [];
                                for(var i = 0; i < annoList.length; i++) {
                                    if(annoList[i].targets[0] === annoId) {
                                        sortedAnnoList.push(annoList[i]);
                                    }
                                }
                                sortedAnnoList.sort(function(a, b) {return (Date.parse(b.date) - Date.parse(a.date));});
                                
                                for(var i = 0; i < sortedAnnoList.length; i++) {
                                    newSortedAnnoList.push(sortedAnnoList[i]);
                                }
                                
                                console.log(sortedAnnoList);
                                
                                threadedConvo = function() {
                                    //for(var i = 0; i < sortedAnnoList.length; i++) {
                                    //    newSortedAnnoList.push(sortedAnnoList[i]);
                                    //}
                                    
                                    for(var i = 0; i < sortedAnnoList.length; i++) {
                                        var tempArr = [];
                                        
                                        for(var j = 0; j < annoList.length; j++) {
                                            if(annoList[j].targets[0] === sortedAnnoList[i].id) {
                                                tempArr.push(annoList[j]);
                                            }
                                            
                                        }
                                        
                                        console.log('tempArr');
                                        console.log(tempArr);
                                        
                                        tempArr.sort(function(b, a) {return (Date.parse(b.date) - Date.parse(a.date));});
                                        for(var k = 0; k < tempArr.length; k++)
                                            var insertionPoint = newSortedAnnoList.indexOf(sortedAnnoList[i]) + 1;
                                            newSortedAnnoList.splice(insertionPoint, 0, tempArr[k]);
                                        
                                        console.log('newSortedAnnoList');
                                        console.log(newSortedAnnoList);
                                        
                                    }
                                    
                                    for(var i = 0; i < newSortedAnnoList.length; i++) {
                                        sortedAnnoList.push(newSortedAnnoList[i]);
                                    }
                                    
                                    if(sortedAnnoList.length < annoList.length)
                                        threadedConvo();
                                };

                                threadedConvo();
                                $scope.entries = newSortedAnnoList;*/


                                $scope.entries = annoList;
                                shiftAnnoService.annoList[annoId] = $scope.entries;
                                $scope.loadingReplies = false;
                            }
                            else if(results.length > 0) {
                                var tempResultIdList = {}; // id workaround
                                
                                angular.forEach(results, function(result) {
                                    if(!tempResultIdList.hasOwnProperty(result.id)) { // id workaround
                                        tempResultIdList[result.id] = '';             // id workaround
                                    
                                        criteria.targets = [result.id];
                                        searchAnnotations.searchAnnotations(criteria);
                                        numSearchesStarted++;

                                        //Double-escape URIs embedded within a URI in order to work with Angular routing
                                        result.uri = '#/' + encodeURIComponent(encodeURIComponent(annoId)) + '/annotation/' 
                                                         + encodeURIComponent(encodeURIComponent(result.id)) + '/';

                                        //annoList.push(result); // If id workaround no longer needed, then uncomment this line

                                        // id workaround
                                        if(!resultIdList.hasOwnProperty(result.id) && result.date > $scope.date) {
                                            annoList.push(result);
                                            resultIdList[result.id] = '';
                                        }
                                    }
                                });
                            }
                        });
                    }
                });

                searchAnnotations.addListener(searchAnnotations.listenerTypes.ERROR, function(error) {
                    $scope.repliesErrorMsg = error;
                });

                searchAnnotations.searchAnnotations(criteria);
                
            },
            function(error){
                // $timeout used to avoid 'apply already in progress' error
                $timeout(function() {
                    $scope.$apply(function(){
                        $scope.errorMsg='Error: ' + error;
                    });
                });
            }
        );

        $scope.directSearch = function(facet, name, evt) {           
            evt.preventDefault();
            $location.path(encodeURIComponent(targetService.listViewTarget) + '/annotations/').search(facet, name).search('pageNum', '1');
        };
        
        $scope.annoListPosition = shiftAnnoService.getPosition(targetId, $scope.annotationId);
        $scope.annoListLength = shiftAnnoService.getListLength(targetId);
        $scope.noShifting = ($scope.annoListLength === 1);
        $rootScope.$broadcast('shiftButtons');
        
        $scope.shiftAnno = function(direction) {
            var newAnno = shiftAnnoService.getNewAnno(targetId, $scope.annotationId, direction);
            $scope.annoListPosition = shiftAnnoService.getPosition(targetId, newAnno.id);

                var criteria = {};
                criteria.targetTypes = $location.search()[charme.web.constants.PARAM_TARGET_TYPES];
                criteria.bodyTypes = $location.search()[charme.web.constants.PARAM_BODY_TYPES];
                criteria.motivations = $location.search()[charme.web.constants.PARAM_MOTIVATIONS];
                criteria.domainsOfInterest = $location.search()[charme.web.constants.PARAM_DOMAINS];
                criteria.organization = $location.search()[charme.web.constants.PARAM_ORGANIZATION];
                criteria.creator = $location.search()[charme.web.constants.PARAM_CREATOR];
                criteria.resultsPerPage = $location.search()['resultsPerPage'];
                criteria.selectedRPP = $location.search()['selectedRPP'];
                //criteria.listOrder = $location.search()['listOrder'];
                
                window.location.href = newAnno.uri;
                $timeout(function() {
                    $location.search(charme.web.constants.PARAM_TARGET_TYPES, criteria.targetTypes)
                             .search(charme.web.constants.PARAM_BODY_TYPES, criteria.bodyTypes)
                             .search(charme.web.constants.PARAM_MOTIVATIONS, criteria.motivations)
                             .search(charme.web.constants.PARAM_DOMAINS, criteria.domainsOfInterest)
                             .search(charme.web.constants.PARAM_ORGANIZATION, criteria.organization)
                             .search(charme.web.constants.PARAM_CREATOR, criteria.creator)
                             .search('resultsPerPage', criteria.resultsPerPage)
                             .search('selectedRPP', criteria.selectedRPP)
                             //.search('listOrder', criteria.listOrder.toString());
                             .replace();
                });
        };
        
        $scope.$on('$destroy', function() {
            searchAnnotations.clearListeners();
        });
    }]);

/**
 * New annotation screen.
 */
charme.web.controllers.controller('EditAnnotationCtrl', ['$scope', '$routeParams', '$location', '$window', '$timeout', 'saveAnnotation', 'loginService', 'fetchTargetTypeVocab', 'fetchAllMotivations', 'fetchKeywords', 'searchAnnotations', 'targetService', 'replyToAnnoService', 'fetchAnnotation', 'annotationService',
    function ($scope, $routeParams, $location, $window, $timeout, saveAnnotation, loginService, fetchTargetTypeVocab, fetchAllMotivations, fetchKeywords, searchAnnotations, targetService, replyToAnnoService, fetchAnnotation, annotationService){
        searchAnnotations.clearListeners();
        $scope.newAnnotationFlag=true;
        var targetId = $routeParams.targetId;
        $scope.targetId=targetId;
        $scope.commentMaxLength = charme.settings.COMMENT_LENGTH ? charme.settings.COMMENT_LENGTH : 500; // Maximum no. of characters for free text
		var annoId = $routeParams.annotationId;
		var pristineModel;
		$scope.anno = {motivation: [], targets: []};

		/*
		 Add all selected targets to this annotation;
		 */
		var addSelectedTargets = function(){
			var selectedTargets = targetService.targets;
			//Iterate through each of the selected targets, and only add it if it's not already on the annotation
			for (var key in selectedTargets) {
				//Check if the key is an object attribute
				if (selectedTargets.hasOwnProperty(key)) {
					//search the targets already defined on the annotations
					var targetFound = false;
					for (var i=0; i < $scope.anno.targets.length; i++){
						if ($scope.anno.targets[i].id===key){
							targetFound=true;
							break;
						}
					}
					if (!targetFound){
						var selectedTargetDetails = selectedTargets[key];
						$scope.anno.targets.push({id: selectedTargetDetails[0], typeId: jsonoa.types[selectedTargetDetails[1]].TYPE});
					}
				}
			}
			$scope.anno.targets.push();
		}

        $scope.loggedIn=loginService.isLoggedIn();
        $scope.targetList = targetService.targets;

        // Remove the empty option from the dropdown by initialising the model value
        $scope.selectedTarget = targetId;
        if(!$scope.targetList.hasOwnProperty(targetId)) {
            var annoName;
            
            if(replyToAnnoService.comments === '') {
                annoName = targetId;
            }
            else {
                annoName = replyToAnnoService.comments;
                annoName = '"' + charme.logic.shortTargetName(annoName, 75) + '"';
            }

            $scope.targetList = {};
            $scope.targetList[targetId] = {name: annoName, label: 'CHARMeAnnotation', desc: 'CHARMe Annotation'};
            replyToAnnoService.comments = '';
        }

		/*
		 Validate data provider's targets, displaying an appropriate error message if unknown types exist
		 */
		var validateTargets = function(types){
			//This fetches a short list of the known target types, and their labels. This is used for displaying the short name of targets attached to this annotation
			$scope.knownTargetTypeLabels = {};
			angular.forEach(types, function(type){
				$scope.knownTargetTypeLabels[type.resource] = type.label;
			});

			/*
			 This code validates the targets that the user has selected to ensure they all have valid target types. This should be refactored to use the above knownTargetList
			 */
			var validTargetTypeLabels = {};
			$scope.targetList = targetService.targets;
			for(var i = 0; i < types.length; i++) {
				var label = types[i].label.replace(" ", "");
				validTargetTypeLabels[label] = '';
			}

			var numTargets = 0;
			for(target in $scope.targetList) {
				numTargets++;
				if(!validTargetTypeLabels.hasOwnProperty($scope.targetList[target][1])){
					console.error('Invalid target type defined for ' + target[0]);
					$scope.errorMsg = 'Error: Invalid/undefined target type(s). Annotation may not be saved';
				}
			};

		};

		//Pre-populate model if editing existing annotation.
		if (annoId){
			$scope.loading = true;
			Promise.every(fetchAnnotation(annoId), fetchTargetTypeVocab()).then(function(results){
				var graph = results[0];
				validateTargets(results[1]);
				var annotation = graph.getNode(annoId);
				var anno = annotationService.createSimpleAnnotationObject(annotation);
				pristineModel = angular.copy(anno);
				$scope.$apply(function(){
					$scope.anno = anno;
					$scope.loading = false;
				})
			}, function(error){
				$scope.$apply(function() {
					console.error(error);
					$scope.errorMsg = 'Unable to fetch annotation';
					$scope.loading = false;
				});
			});
		} else {
			$scope.anno = annotationService.createSimpleAnnotationObject();
			addSelectedTargets();

			// Validate the data provider's target types
			fetchTargetTypeVocab().then(function(types) {
				validateTargets(types);
			}, function(error) {
				$scope.$apply(function() {
					$scope.errorMsg = error;
				});
			});
		}

        fetchAllMotivations().then(function(categories){
            $scope.$apply(function(){
                $scope.$broadcast('motivationCategoriesForNewAnno', categories);
            });
        });
        
        fetchKeywords().then(function(categories){
            $scope.$apply(function(){
                $scope.$broadcast('domainCategoriesForNewAnno', categories);
            });
        });
        

        $scope.cancel = function(){
            if($scope.loading)
                return;
            
            window.history.back();
        };
        $scope.changeURI = function(uri){
            $scope.anno.citoText='';
            var doiVal = charme.logic.findDOI(uri);
            if (doiVal){
                var criteria = {};
                criteria[charme.logic.constants.DXDOI_CRITERIA_ID]=doiVal;
                charme.logic.fetchDxdoiMetaData(criteria).then(function(citation){    
                    $scope.$apply(function(){
                        $scope.anno.citoText = citation;
                    });
                });
            }
        };

		/**
		 * Watch for changes in the URI entered and fetch cito data if available.
		 */
		$scope.$watch('anno.linkURI', changeURI);

		$scope.login = function(){
            //window.addEventListener('message', loginService._loginEvent, false);
            window.addEventListener('message', loginService.handshake, false);
            window.open(charme.logic.urls.authRequest());
            loginService.addLoginListener(function(authToken){
                $scope.$apply(function(){
                    $scope.loggedIn=authToken.token ? true : false;
                });
            });
        };

		var findTargetInList = function(targetToFind, listOfTargets){
			var matchIndex = -1;
			angular.forEach(listOfTargets, function(target, index){
				if (target.id === targetToFind.id){
					matchIndex = index;
				}
			});
			return matchIndex;
		};

		$scope.deleteTarget = function(targetToDelete){
			if(typeof targetToDelete === 'undefined'){
				//Delete all selected targets
				var selectedTargets = angular.copy($scope.filteredTargets || $scope.anno.targets);
				angular.forEach( selectedTargets, function(selectedTarget){
					var matchIndex = findTargetInList(selectedTarget, $scope.anno.targets);
					$scope.anno.targets.splice(matchIndex, 1);

				});
				$scope.searchText = '';
			} else {
				var matchIndex = findTargetInList(targetToDelete, $scope.anno.targets);
				$scope.anno.targets.splice(matchIndex, 1);
			}
		};


		$scope.addSelected = function(){
			addSelectedTargets();
		}


		$scope.save = function(annoModel){
            if ($scope.loading)
                return;
            
            $scope.loading=true;
            $('.ajaxModal').height($('.modal-body-new')[0].scrollHeight);
            
            var auth = loginService.getAuth();
			saveAnnotation(targetId, $scope.targetList, auth, annoModel, pristineModel).then(
                function(){
                    $scope.$apply(function(){
                        $scope.loading=false;
                        //$location.path(encodeURIComponent(targetId) + '/annotations/');
                        window.history.back();

                        // Issue the refresh message(s)
                        for(target in $scope.targetList)
                            top.postMessage('refreshAnnotationCount' + ":::" + target, '*');
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

charme.web.controllers.controller('SearchCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$window', '$timeout', 'fetchAllSearchFacets', 'fetchTargetTypeVocab', 'searchAnnotations',
    function($rootScope, $scope, $routeParams, $location, $window, $timeout, fetchAllSearchFacets, fetchTargetTypeVocab, searchAnnotations) {
        var targetId = $routeParams.targetId;
        targetId = targetId === charme.common.ALL_TARGETS ? '' : targetId;
        
        $scope.loading = true;
        $scope.resultsPerPage = [10, 20, 30, 'All'];  // first value in this array must be a number (not 'All')
        //$scope.listOrderOptions = [{text: 'Newest', sortNum: -1}, {text: 'Oldest', sortNum: 1}];

        $scope.criteria = {
            selectedTargetTypes: [],
            selectedBodyTypes: [],
            selectedMotivations: [],
            selectedDomains: []
        };
        
        var criteria = {
            targets: [targetId]
            //count: 100000  // until the node can handle date queries, we must always retrieve all annotations
        };

        Promise.every(fetchAllSearchFacets(criteria), fetchTargetTypeVocab()).then(function(results){
            var facetTypes = results[0];
            var targetTypeVocab = results[1];
            
            var validTargetTypeLabels = {};
            for(var i = 0; i < targetTypeVocab.length; i++) {
               var label = targetTypeVocab[i].label.replace(/ /g, "");
               validTargetTypeLabels[label] = targetTypeVocab[i].label;
            }
            
            $scope.$apply(function(){
                var targetTypeKeywords = facetTypes[charme.logic.constants.FACET_TYPE_TARGET_TYPE];
                for(var targetType in targetTypeKeywords)
                    targetTypeKeywords[targetType].label = validTargetTypeLabels[targetTypeKeywords[targetType].label];
                
                var targetTypeCategories = [{
                	name: 'Target Types',
                        keywords: targetTypeKeywords
                }];
                $scope.$broadcast('targetTypeCategoriesForSearch', targetTypeCategories);
                
                var bodyTypeKeywords = facetTypes[charme.logic.constants.FACET_TYPE_BODY_TYPE];
                for(var bodyType in bodyTypeKeywords)
                    bodyTypeKeywords[bodyType].label = validTargetTypeLabels[bodyTypeKeywords[bodyType].label];
                    // Valid body types are same as valid target types
                
                var bodyTypeCategories = [{
                	name: 'Body Types',
                        keywords: bodyTypeKeywords
                }];
                $scope.$broadcast('bodyTypeCategoriesForSearch', bodyTypeCategories);

                var motivationKeywords = facetTypes[charme.logic.constants.FACET_TYPE_MOTIVATION];
                var motivationCategories = [{
                	name: 'OA Motivations',
                        keywords: motivationKeywords
                }];
                $scope.$broadcast('motivationCategoriesForSearch', motivationCategories);

                var domainKeywords = facetTypes[charme.logic.constants.FACET_TYPE_DOMAIN];
                var domainCategories = [{
                        name: 'GCMD',
                        keywords: domainKeywords
                }];
                $scope.$broadcast('domainCategoriesForSearch', domainCategories);
                
                $scope.organizations = facetTypes[charme.logic.constants.FACET_TYPE_ORGANIZATION];
                
                $rootScope.$broadcast('facetsFetched');
            });
        });
        
        var criteriaFromSearch = function(){
            $scope.loading = true;

            // In case facets are undefined in the URL, define them here
            criteria.targetTypes = criteria.bodyTypes = criteria.motivations = criteria.domainsOfInterest = criteria.organization = criteria.creator = '';
            criteria.pageNum = 1;
            criteria.resultsPerPage = $scope.resultsPerPage[0];
            criteria.selectedRPP = $scope.resultsPerPage[0];
            //criteria.listOrder = $scope.listOrderOptions[0].sortNum;
            $scope.selectedRPP = criteria.selectedRPP;
            //$scope.selectedOrder = criteria.listOrder;

            var targetTypeParam = $location.search()[charme.web.constants.PARAM_TARGET_TYPES];
            if(typeof targetTypeParam === 'string')
                criteria.targetTypes = targetTypeParam.split(',');
            
            var bodyTypeParam = $location.search()[charme.web.constants.PARAM_BODY_TYPES];
            if(typeof bodyTypeParam === 'string')
                criteria.bodyTypes = bodyTypeParam.split(',');

            var motivationParam = $location.search()[charme.web.constants.PARAM_MOTIVATIONS];
            if(typeof motivationParam === 'string')
                criteria.motivations = motivationParam.split(',');

            var domainsParam = $location.search()[charme.web.constants.PARAM_DOMAINS];
            if(typeof domainsParam === 'string')
                criteria.domainsOfInterest = domainsParam.split(',');

            var organization = $location.search()[charme.web.constants.PARAM_ORGANIZATION];
            if(typeof organization === 'string')
                criteria.organization = organization;
                
            // Ensure correct colour for placeholder text when moving back and forward through browser history
            if(organization === '' || organization === undefined)
                $('#chooseOrganisation').addClass('select-placeholder');
            else
                $('#chooseOrganisation').removeClass('select-placeholder');

            var creator = $location.search()[charme.web.constants.PARAM_CREATOR];
            if(typeof creator === 'string')
                criteria.creator = creator;

            // Wait to broadcast if first load or returning from viewAnno or newAnno...
            var onFacetsFetched = $rootScope.$on('facetsFetched', function() {
                $rootScope.$broadcast('newTargetTypes', criteria.targetTypes);
                $rootScope.$broadcast('newBodyTypes', criteria.bodyTypes);
                $rootScope.$broadcast('newMotivations', criteria.motivations);
                $rootScope.$broadcast('newDomains', criteria.domainsOfInterest);
            });
            // ... otherwise broadcast now
            $rootScope.$broadcast('newTargetTypes', criteria.targetTypes);
            $rootScope.$broadcast('newBodyTypes', criteria.bodyTypes);
            $rootScope.$broadcast('newMotivations', criteria.motivations);
            $rootScope.$broadcast('newDomains', criteria.domainsOfInterest);
            
            $scope.$on('$destroy', function() {
                onFacetsFetched(); // Remove listener
            });
            
            $scope.criteria.selectedOrganization = criteria.organization;
            $scope.criteria.selectedCreator = criteria.creator;

            var pageNum = $location.search()['pageNum'];
            if(typeof pageNum === 'string')
                criteria.pageNum = parseInt(pageNum);

            // selectedRPP represents the option selected in the HTML - either a number or a string ('All') - and is used for CSS styling (so that the selected option is underlined)
            // resultsPerPage is the value sent to the node, and must be a number, not a string - see scope.setResultsPerPage below
            var resultsPerPage = $location.search()['resultsPerPage'];
            var selectedRPP = $location.search()['selectedRPP'];
            if(typeof resultsPerPage === 'string')
                criteria.resultsPerPage = parseInt(resultsPerPage);
            if(typeof selectedRPP === 'string'){
                if(selectedRPP === resultsPerPage)
                    $scope.selectedRPP = criteria.selectedRPP = criteria.resultsPerPage;
                else
                    $scope.selectedRPP = criteria.selectedRPP = selectedRPP;
                }

            //var listOrder = $location.search()['listOrder'];
            //if(typeof listOrder === 'string')
            //    $scope.selectedOrder = criteria.listOrder = parseInt(listOrder);
            
            //$rootScope.$broadcast('listOptions', criteria.resultsPerPage, criteria.selectedRPP);//, criteria.listOrder);
            $rootScope.$broadcast('newCriteria', criteria);
            
            return criteria;
        };
 
        var loadCriteriaIntoModel = function(criteriaForLoad){
            if(typeof $scope.criteria === 'undefined')
                $scope.criteria = {};
            
            if(criteriaForLoad.targetTypes instanceof Array){
                var loadedTargetTypes = [];
                angular.forEach(criteriaForLoad.targetTypes, function(targetType){
                    loadedTargetTypes.push({value: targetType});
                });
                $scope.criteria.selectedTargetTypes = loadedTargetTypes;
            }
            
            if(criteriaForLoad.bodyTypes instanceof Array){
                var loadedBodyTypes = [];
                angular.forEach(criteriaForLoad.bodyTypes, function(bodyType){
                    loadedBodyTypes.push({value: bodyType});
                });
                $scope.criteria.selectedBodyTypes = loadedBodyTypes;
            }
            
            if(criteriaForLoad.motivations instanceof Array){
                var loadedMotivations = [];
                angular.forEach(criteriaForLoad.motivations, function(motivation){
                    loadedMotivations.push({value: motivation});
                });
                $scope.criteria.selectedMotivations = loadedMotivations;
            }

            if(criteriaForLoad.domainsOfInterest instanceof Array){
                var loadedDomains = [];
                angular.forEach(criteriaForLoad.domainsOfInterest, function(domain){
                    loadedDomains.push({value: domain});
                });
                $scope.criteria.selectedDomains = loadedDomains;
            }
 
            if(typeof criteriaForLoad.organization !== 'undefined'){
                $scope.criteria.selectedOrganization = criteriaForLoad.organization;
            }

            if(typeof criteriaForLoad.creator !== 'undefined'){
                $scope.criteria.selectedCreator = criteriaForLoad.creator;
            }
        };

        var criteriaOnLoad = criteriaFromSearch();
        loadCriteriaIntoModel(criteriaOnLoad);
        searchAnnotations.searchAnnotations(criteriaOnLoad);
 
        var debounceHandle;
        $scope.$watch('criteria', function(newVal, oldVal){
            // After a watcher is registered with the scope, the listener function is called once, asynchronously, to initialize the watcher
            if(newVal === oldVal) {
                return;
            }
            
            if(typeof $scope.criteria !== 'undefined') {
                if (debounceHandle)
                    $timeout.cancel(debounceHandle);
 
                /*
                Set timeout here in order to 'debounce' input from text fields. This avoids a search being triggered on each keypress.
                Newer versions of angular provide this out of the box, but we are stuck supporting IE8. For now...
                */
                debounceHandle = $timeout(function() {
                    criteria.pageNum = 1;
                    
                    var selectedTargetTypes = [];
                    angular.forEach($scope.criteria.selectedTargetTypes,
                        function(selectedTargetType) {
                            selectedTargetTypes.push(selectedTargetType.value);
                        });
                    var currentTargetTypes = $location.search()[charme.web.constants.PARAM_TARGET_TYPES];
                    currentTargetTypes = typeof currentTargetTypes === 'undefined' ? '' : currentTargetTypes;
                    var newTargetTypes = selectedTargetTypes.join(',');
                    if(currentTargetTypes !== newTargetTypes)
                        $location.search(charme.web.constants.PARAM_TARGET_TYPES, newTargetTypes)
                                 .search('pageNum', criteria.pageNum.toString());
                         
                    var selectedBodyTypes = [];
                    angular.forEach($scope.criteria.selectedBodyTypes,
                        function(selectedBodyType) {
                            selectedBodyTypes.push(selectedBodyType.value);
                        });
                    var currentBodyTypes = $location.search()[charme.web.constants.PARAM_BODY_TYPES];
                    currentBodyTypes = typeof currentBodyTypes === 'undefined' ? '' : currentBodyTypes;
                    var newBodyTypes = selectedBodyTypes.join(',');
                    if(currentBodyTypes !== newBodyTypes)
                        $location.search(charme.web.constants.PARAM_BODY_TYPES, newBodyTypes)
                                 .search('pageNum', criteria.pageNum.toString());

                    var selectedMotivations = [];
                    angular.forEach($scope.criteria.selectedMotivations,
                        function(selectedMotivation) {
                            selectedMotivations.push(selectedMotivation.value);
                        });
                    var currentMotivations = $location.search()[charme.web.constants.PARAM_MOTIVATIONS];
                    currentMotivations = typeof currentMotivations === 'undefined' ? '' : currentMotivations;
                    var newMotivations = selectedMotivations.join(',');
                    if(currentMotivations !== newMotivations)
                        $location.search(charme.web.constants.PARAM_MOTIVATIONS, newMotivations)
                                 .search('pageNum', criteria.pageNum.toString());
 
                    var selectedDomains = [];
                    angular.forEach($scope.criteria.selectedDomains, function (selectedDomain) {
                        selectedDomains.push(selectedDomain.value);
                    });
                    var currentDomains = $location.search()[charme.web.constants.PARAM_DOMAINS];
                    currentDomains = typeof currentDomains === 'undefined' ? '' : currentDomains;
                    var newDomains = selectedDomains.join(',');
                    if(currentDomains !== newDomains)
                        $location.search(charme.web.constants.PARAM_DOMAINS, newDomains)
                                 .search('pageNum', criteria.pageNum.toString());
 
                    var currentOrganization = $location.search()[charme.web.constants.PARAM_ORGANIZATION];
                    currentOrganization = typeof currentOrganization === 'undefined' ? '' : currentOrganization;
                    var newOrganization = $scope.criteria.selectedOrganization;
                    if(currentOrganization !== newOrganization)
                        $location.search(charme.web.constants.PARAM_ORGANIZATION, newOrganization)
                                 .search('pageNum', criteria.pageNum.toString());
 
                    var currentCreator = $location.search()[charme.web.constants.PARAM_CREATOR];
                    currentCreator = typeof currentCreator === 'undefined' ? '' : currentCreator;
                    var newCreator = $scope.criteria.selectedCreator;
                    if(currentCreator !== newCreator)
                        $location.search(charme.web.constants.PARAM_CREATOR, newCreator)
                                 .search('pageNum', criteria.pageNum.toString());
                }, 500);
            }
        }, true);
        
        $scope.$on('$routeUpdate', function(){
            searchAnnotations.searchAnnotations(criteriaFromSearch());
        });

        $rootScope.$on('changePage', function(event, newPage, lastPage, pages) {
            var currentPage = criteria.pageNum;
            
            if(typeof newPage === "number")
                criteria.pageNum = newPage;
            else if(typeof newPage === "string") {
                var pageIncrement = parseInt(newPage);
                
                if(criteria.pageNum + pageIncrement > 0 && criteria.pageNum + pageIncrement <= lastPage)
                    criteria.pageNum += pageIncrement;
            }

            if(criteria.pageNum !== currentPage) {
                $location.search('pageNum', criteria.pageNum.toString());
            }
        });

        var maxResults, firstSearchFlag = true;
        searchAnnotations.addListener(searchAnnotations.listenerTypes.SUCCESS, function(results, pages, pageNum, lastPage, totalResults){
            $scope.$apply(function() {
                $scope.numResults = totalResults;
                $scope.loading = false;
                
                // The first search, on loading, returns the total number of annotations in 'totalResults', and 
                // we store that number as 'maxResults' for future reference
                if(firstSearchFlag) {
                    firstSearchFlag = false;
                    maxResults = totalResults > 0 ? totalResults : 1;  // Node doesn't like 'count=0'
                }
            });
        });
        $scope.setResultsPerPage = function(rpp) {
            if(typeof rpp === "number")
                criteria.resultsPerPage = rpp;
            else if(typeof rpp === "string")
                criteria.resultsPerPage = maxResults;
                  
            $scope.selectedRPP = criteria.selectedRPP = rpp;
            criteria.pageNum = 1;
            $location.search('pageNum', criteria.pageNum.toString())
                     .search('resultsPerPage', criteria.resultsPerPage.toString())
                     .search('selectedRPP', criteria.selectedRPP.toString());
        };
        
        //$scope.setListOrder = function(sortNum) {
        //    $scope.selectedOrder = criteria.listOrder = sortNum;
        //    criteria.pageNum = 1;
        //    $location.search('pageNum', criteria.pageNum.toString())
        //             .search('listOrder', criteria.listOrder.toString());
        //};
        
        // Function to ensure correct CSS colour (grey) for placeholder text is applied immediately
        $scope.changeOrganisation = function(isReset) {
            var orgSelect = document.getElementById("chooseOrganisation");
            if(isReset)
                orgSelect.value = "";

            if(orgSelect.value === "")
                $(orgSelect).addClass('select-placeholder');
            else
                $(orgSelect).removeClass('select-placeholder');
        };
        
        $scope.reset = function() {
            $rootScope.$broadcast('reset');
            criteria.pageNum = 1;
            $scope.criteria.selectedTargetTypes = '';
            $scope.criteria.selectedBodyTypes = '';
            $scope.criteria.selectedMotivations = '';
            $scope.criteria.selectedDomains = '';
            $scope.criteria.selectedOrganization = '';
            $scope.changeOrganisation(true);
            $scope.criteria.selectedCreator = '';
        };

        $scope.xOverflow = function() {
            $('#searchContainer').removeClass('search-overflow-y');
        };
        $scope.yOverflow = function() {
            $('#searchContainer').addClass('search-overflow-y');
        };

        selectizeMixins.addToOnFocus('chooseDomainDiv', $scope.xOverflow);
        selectizeMixins.addToOnBlur('chooseDomainDiv', $scope.yOverflow);
        
        $scope.$on('$destroy', function(event) {
            selectizeMixins.removeFromOnFocus('chooseDomainDiv', $scope.xOverflow);
            selectizeMixins.removeFromOnBlur('chooseDomainDiv', $scope.yOverflow);
        });
    }]);
