(function() {

	var app = angular.module('clientXray.controllers', ['clientXray.factories']);

	app.controller('NavigationController', function($scope, LoginHelper){
		// Determine if login page is required
		if(!LoginHelper.isLoggedIn()) {
			$scope.activePanel = "login";
		} else {
			$scope.activePanel = "updateMood";
		}

		$scope.setPanel = function(newPanel) {
			$scope.activePanel = newPanel;
		};

		$scope.isSet = function(panelName){
			return $scope.activePanel === panelName;
		};

		$scope.login = function(){
			// Add Email to local storage
			LoginHelper.setUser($scope.email);
			$scope.setPanel('updateMood');
		};
	});

	app.controller('UpdateMoodController', function($scope, XrayMachine, LoginHelper){
	    // Default panel here
	    $scope.newUpdate = {};
	    

	    $scope.updateMood = function(){
			var moodObject = { mood: $scope.newUpdate.mood, notes : $scope.newUpdate.notes};
			var userId = LoginHelper.getUser();
			XrayMachine.updateMood(userId, moodObject).success(function(){console.log('Hooray!');});
		};
  	});

	app.controller('SearchController', function($scope, XrayMachine){

		$scope.searchList = [
        	{ field: 'Consultant', value: 'consultant'},
        	{ field: 'Client', value: 'client'},
        	{ field: 'Mood', value: 'mood'}];
        $scope.selected = $scope.searchList[0];

	    $scope.search = function(selected, value){		
 			console.log("Selected: " + selected.value + " Value: " + value);
 			XrayMachine.getClientsForUser(selected, value).success(function(data){			
 				$scope.searchResults = data;
			});
		}	

	});

})();