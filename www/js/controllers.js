(function() {

	var app = angular.module('clientXray.controllers', ['clientXray.factories', 'clientXray.graph']);

	app.controller('NavigationController', function($scope, LoginHelper){
		// Determine if login page is required
		if(!LoginHelper.isLoggedIn()) {
			$scope.activePanel = "login";
		} else {
			$scope.activePanel = "updateMood";
		}

		$scope.setPanel = function(newPanel) {
			console.log("new Panel : " + newPanel);
			// close menu
			$(".navbar-collapse").collapse('hide');
			$scope.activePanel = newPanel;
		};

		$scope.isSet = function(panelName){
			return $scope.activePanel === panelName;
		};

		$scope.login = function(){
			// Add Email to local storage
			LoginHelper.setUser($scope.email);
			$scope.activePanel = 'updateMood';
		};

		$scope.logout = function() {
			LoginHelper.logout();
			$(".navbar-collapse").collapse('hide');
			$scope.activePanel = 'login';
		};
	});

	app.controller('UpdateMoodController', function($scope, XrayMachine, LoginHelper){
	    // Default panel here
	    $scope.newUpdate = {};
	    $scope.successNotify = false;

 		var updateClientsForUser = function() {
 			XrayMachine.getClientsForUser(LoginHelper.getUser()).success(function(data){			
 				$scope.clientsForUser = data;
 				if (data[0])
 				{
 					$scope.newUpdate.client = data[0].clientCode;
 				}
 				else
 				{
 					$scope.newUpdate.client = 'bench';
 				}
 			});
 			XrayMachine.getConsultantMoodBriefHistory(LoginHelper.getUser()).success(function(data){			
 				if (data[0])
 				{
 					$scope.moodHistory = data;
 				}
 			});
 		};

 		// Update clients for this user and create callback function for each login thereafter
 		updateClientsForUser();
 		LoginHelper.attachLoginCallback(updateClientsForUser);

	    $scope.closeNotfication = function() {
	    	$scope.successNotify = false;
	    };

	    $scope.getHashtags = function(){
			var regex = /#[^\s]+/g;

			var matches = [];
			var match = regex.exec($scope.newUpdate.notes);
			while (match != null) {
			    matches.push(match[0].replace("#", ""));
			    match = regex.exec($scope.newUpdate.notes);
			}
			return matches.join(",");
	    };

	    $scope.updateMood = function(){
	    	var tagsList = $scope.getHashtags();
			var moodObject = { mood: $scope.newUpdate.mood, notes : $scope.newUpdate.notes, client : $scope.newUpdate.client, tags : tagsList };
			var email = LoginHelper.getUser();
			XrayMachine.updateMood(email, moodObject).success(function(){
				// Mood has been successfully sent to API
				$scope.newUpdate.notes = null;
				$scope.successNotify = true;
			});
		};
  	});

	app.controller('SearchController', function($scope, XrayMachine, data, MoodValues) {

		$scope.searchType = '';
		$scope.searchList = [
        	{ field: 'Consultant', value: 'consultant'},
        	{ field: 'Client', value: 'client'},
        	{ field: 'Mood', value: 'mood'}];
        $scope.selected = $scope.searchList[0];

	    $scope.search = function(selected, value){		
 			console.log("Selected: " + selected.value + " Value: " + value);
 			$scope.searchType = selected.value;

 			if(selected.value === "consultant"){
 				XrayMachine.searchConsultant(value).success(function(data){			
 					$scope.searchResults = data;
				});
 			}
 			else if(selected.value === "client"){
 				console.log('search for client');
 				XrayMachine.searchClient(value).success(function(data){			
 					$scope.searchResults = data;
				}); 				
 			}		
		};

	    $scope.viewConsutlant = function(email){
			XrayMachine.getConsultantMood(email).success(function(consultantData){
			 	console.log('consultantData : ' + consultantData);
				data.setConsultantMood(consultantData);
			});

			XrayMachine.getConsultant(email).success(function(consultantData){			 	
				data.setConsultant(consultantData);
			});
			$scope.setPanel('consultantView');
		};	

	    $scope.viewClient = function(clientCode){
			XrayMachine.getClient(clientCode).success(function(clientData){
				data.setClient(clientData);
			});

			XrayMachine.getClientMood(clientCode).success(function(clientMoodData){
				data.setClientMood(clientMoodData);
			});

			XrayMachine.getClientConsultants(clientCode).success(function(clientConsultantsData){
				data.setClientConsultants(clientConsultantsData);
			});				

    		var totalCount = 0;
			var moodCount = 0;
				for(var mood in data.getClientMood()){
					console.log("Mood: " + mood.count + " " + mood['mood.name']);
					totalCount += mood.count;
					moodCount += MoodValues.getMoodValue((mood['mood.name']));
				}
			data.setOverallMood = moodCount/totalCount;
			$scope.setPanel('clientView');
		};

		$scope.isViewForClients = function() {
			return $scope.searchType === 'client';
		};

		$scope.isViewForMood = function() {
			return $scope.searchType === 'mood';
		};	

		$scope.isViewForConsultant = function() {
			return $scope.searchType === 'consultant';
		};	

	});

	app.controller('ConsultantViewController', function($scope, data, Grapher) {

		$scope.$watch(
			function () { 
				return data.getConsultantMood(); 
			},
			function (newValue) {
        		if (newValue && newValue != '')
        		{
        			console.log('newValue : ' + newValue);
        			$scope.consultantMood = newValue;
        			Grapher.createGraph(newValue);
        		}
    		}
    	);

    	$scope.$watch(
			function () { 
				return data.getConsultant(); 
			},
			function (newValue) {
        		if (newValue)
        		{
        			console.log('newValue : ' + newValue); 
        			$scope.consultant = newValue;
        		}
    		}
    	);

		$scope.$watch(
			function () { 
				return data.getClient(); 
			},
			function (newValue) {
        		if (newValue) 
        			$scope.client = newValue;
    		}
    	);

	});

	app.controller('ClientViewController', function($scope, data, XrayMachine) {

		$scope.$watch(
			function () {
				return data.getClientMood();
			},
			function (newValue) {
				if (newValue)
				{
					console.log('newValue : ' + newValue);
					$scope.clientMood = newValue;					
				}
			}
		);

		$scope.$watch(
			function () {
				return data.getOverallMood();
			},
			function (newValue) {
				if (newValue)
				{
					console.log('newValue : ' + newValue);
					$scope.overallClientMood = newValue;					
				}
			}
		);
		
		$scope.$watch(
			function () {
				return data.getClientConsultants();
			},
			function (newValue) {
				if (newValue)
				{
					console.log('newValue : ' + newValue);
					$scope.clientConsultants = newValue;
				}
			}
		);

		$scope.$watch(
			function () {
				return data.getClient();
			},
			function (newValue) {
				if (newValue)
					$scope.client = newValue;
			}
		);		

	    $scope.viewConsultant = function(email){
			XrayMachine.getConsultantMood(email).success(function(consultantData){
			 	console.log('consultantData : ' + consultantData);
				data.setConsultantMood(consultantData);
			});

			XrayMachine.getConsultant(email).success(function(consultantData){			 	
				data.setConsultant(consultantData);
			});

			$scope.setPanel('consultantView');
		};			
	});
})();
