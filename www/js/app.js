angular.module('todos', ['ionic', 'todo.controllers'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
  $stateProvider

  .state('todo', {
    url: '/todo',
    abstract: true,
    templateUrl: 'templates/todos.html',
    controller: 'MainCtrl'
  })

  .state('todo.list', {
    url: '/list',
    views: {
      'menu-content': {
        templateUrl: 'templates/list.html',
        controller: 'ListCtrl'
      }
    }
  })

  .state('todo.stage', {
    url: '/stage',
    views: {
      'menu-content': {
        templateUrl: 'templates/stage.html',
        controller: 'StageCtrl'
      }
    }
  })

  .state('todo.archive', {
    url: '/archive',
    views: {
      'menu-content': {
        templateUrl: 'templates/archive.html',
        controller: 'ArchiveCtrl'
      }
    }
  })

  .state('todo.archive-subpage', {
    url: '/archive/:month',
    views: {
      'menu-content': {
        templateUrl: 'templates/archive-subpage.html',
        controller: 'ArchiveSubCtrl'
      }
    }
  })

  .state('entrance', {
    url: '/entrance',
    templateUrl: 'templates/entrance.html',
    controller: 'EntranceCtrl'
  });

  $urlRouterProvider.otherwise('/entrance');

}]);
