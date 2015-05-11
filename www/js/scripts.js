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
    cache: false,
    views: {
      'menu-content': {
        templateUrl: 'templates/list.html',
        controller: 'ListCtrl'
      }
    }
  })

  .state('todo.stage', {
    url: '/stage',
    cache: false,
    views: {
      'menu-content': {
        templateUrl: 'templates/stage.html',
        controller: 'StageCtrl'
      }
    }
  })

  .state('todo.archive', {
    url: '/archive',
    cache: false,
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
  });

  $urlRouterProvider.otherwise('/todo/list');

}]);

angular.module('todo.controllers', ['todo.services'])

.controller('MainCtrl', ['$scope', '$ionicModal', '$ionicPopup', '$location', '$window', 'Todos', function($scope, $ionicModal, $ionicPopup, $location, $window, Todos){
  $scope.version = "0.0.1";
  $scope.todoService = Todos;
  $scope.weektodos = $scope.todoService.get('weektodos');

  if($scope.weektodos) {
    $scope.weektodos['version'] = $scope.version;
  } else {
    $scope.weektodos = {
      version: $scope.version,
      todos: {
        enableAdd: true,
        allTodos: [],
        waitingTodos: [],
        stageTodos: [],
        stat: {}
      }
    };
    $scope.todoService.set('weektodos', $scope.weektodos);
  }
  $scope.todos = $scope.weektodos.todos;

  $scope.$on('updateWaitingTodo', function(event, data) {
    $scope.waitingTodos = data;
  });
  $scope.$on('watchAddStatus', function(event, data) {
    $scope.addTodos = data;
  });
  if($scope.todos.waitingTodos.length === 0) {
    $scope.waitingTodos = [];
  } else {
    $scope.waitingTodos = $scope.todos.waitingTodos;
  }
  $scope.addTodos = $scope.todos.enableAdd;
  
  //modal controller
  $ionicModal.fromTemplateUrl('templates/add.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });
  $scope.closeAddTodo = function() {
    $scope.modal.hide();
  };
  $scope.openAddTodo = function() {
    $scope.modal.show();
  };

  $scope.addTodo = function() {
    $scope.waitingTodos.push({
        done: false,
        text: this.todoText
    });
    this.todoText = "";
    $scope.todos.waitingTodos = $scope.waitingTodos;
    $scope.todoService.set('weektodos', $scope.weektodos);
  };
  $scope.deleteTodo = function() {
    var i = this.$parent.$index;
    $scope.waitingTodos.splice(i, 1);
    $scope.todos.waitingTodos = $scope.waitingTodos;
    $scope.todoService.set('weektodos', $scope.weektodos);
  };

  $scope.deleteAll = function() {
    $ionicPopup.confirm({
      title: "确认信息",
      template: "确定全部删除吗?"
    }).then(function(res){
      if(res) {
        $scope.waitingTodos = [];
        $scope.todos.waitingTodos = [];
        $scope.todoService.set('weektodos', $scope.weektodos);
      }
    });
  };
  $scope.saveWeekTodos = function() {
    var d = new Date();
    $scope.todos.allTodos.push({
      date: d.getTime(),
      todos: $scope.waitingTodos
    });
    $scope.todos.enableAdd = false;
    $scope.addTodos = false;
    $scope.todos.waitingTodos = [];
    $scope.todoService.set('weektodos', $scope.weektodos);
    $scope.modal.hide();
    $scope.$broadcast('updateTodoList', $scope.waitingTodos);
    $scope.waitingTodos = [];
  };

  $scope.checkTodos = function() {
    return $scope.waitingTodos ? $scope.waitingTodos.length === 0 : false;
  };

  $scope.moveTaskOut = function() {
    var i = this.$parent.$index,
        thisTodo = $scope.waitingTodos.splice(i, 1)[0];
    $scope.todos.waitingTodos = $scope.waitingTodos;
    $scope.todos.stageTodos.push(thisTodo);
    $scope.todoService.set('weektodos', $scope.weektodos);
    $scope.$broadcast('updateStageTodos', $scope.todos.stageTodos);
  };
}])

.controller('ListCtrl', ['$scope', '$ionicModal', function($scope, $ionicModal) {
  var allTodos, thisWeekTodo, startDate, today, days;
  if($scope.todos.allTodos.length > 0 && !$scope.todos.enableAdd) {
    allTodos = $scope.todos.allTodos;
    thisWeekTodo = allTodos[allTodos.length - 1];
    startDate = thisWeekTodo.date;
    today = new Date().getTime();
    days = parseInt((today - startDate) / (1000 * 3600 * 24));
    $scope.remain = 7 - days;
    $scope.listTodos = thisWeekTodo.todos;
  } else {
    $scope.listTodos = [];
  }

  $scope.$on('updateTodoList', function(event, data) {
    allTodos = $scope.todos.allTodos;
    thisWeekTodo = allTodos[allTodos.length - 1];
    $scope.listTodos = data;
    $scope.remain = 7;
  });

  $scope.toggleTodo = function() {
    var i = this.$parent.$index, isDone = true;
    thisWeekTodo.todos = $scope.listTodos;
    $scope.todoService.set('weektodos', $scope.weektodos);

    angular.forEach($scope.listTodos, function(todo, key) {
      if(!todo.done) {
        isDone = false;
        return;
      }
    });
    if(isDone) {
      $scope.modal.show();
    }
  };

  $ionicModal.fromTemplateUrl('templates/done.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });
  $scope.pushArchive = function() {
    $scope.todos.enableAdd = true;
    $scope.todoService.set('weektodos', $scope.weektodos);
    $scope.listTodos = [];
    $scope.remain = 0;
    $scope.modal.hide();
    $scope.$emit('watchAddStatus', $scope.todos.enableAdd);
  };
}])

.controller('ArchiveCtrl', ['$scope', '$filter', function($scope, $filter) {
  var weektodos = $scope.todoService.get('weektodos'), todos = weektodos.todos, allTodos, preMonth;
  $scope.months = [];
  allTodos = todos.allTodos
  angular.forEach(allTodos, function(data, index) {
    month = $filter('date')(data.date, 'yyyy-MM');
    if(preMonth !== month) {
      preMonth = month;
      $scope.months.push(month);
    }
  });
  if(!todos.enableAdd) {
    $scope.months.pop();
  }
  $scope.months.reverse();
}])

.controller('ArchiveSubCtrl', ['$scope', '$stateParams', '$filter', function($scope, $stateParams, $filter) {
  var weektodos = $scope.todoService.get('weektodos'),
      todos = weektodos.todos,
      allTodos = todos.allTodos, month;
  $scope.month = $stateParams.month;
  $scope.monthTodos = [];
  angular.forEach(allTodos, function(data, index) {
    month = $filter('date')(data.date, 'yyyy-MM');
    if(month === $scope.month) {
      $scope.monthTodos.push(data);
    }
  });
}])

.controller('StageCtrl', ['$scope', '$ionicGesture', '$ionicPopup', function($scope, $ionicGesture, $ionicPopup){
  $scope.$on('updateStageTodos', function(event, data) {
    $scope.stageTodos = data;
  });
  $scope.stageTodos = $scope.todos.stageTodos;

	$ionicGesture.on('swipedown', function() {
    angular.element(document.getElementById('add-task')).removeClass('add-task');
    document.getElementById('add-input').focus();
  }, angular.element(document));

  $scope.addTodo = function() {
    $scope.stageTodos.push({
      done: false,
      text: this.todoText
    });
    this.todoText = "";
    $scope.todos.stageTodos = $scope.stageTodos;
    $scope.todoService.set('weektodos', $scope.weektodos);
  };

  $scope.deleteTodo = function() {
    var i = this.$parent.$index;
    $scope.stageTodos.splice(i, 1);
    $scope.todos.stageTodos = $scope.stageTodos;
    $scope.todoService.set('weektodos', $scope.weektodos);
  };

  $scope.moveTaskIn = function() {
    var i = this.$parent.$index, thisTodo;
    if(!$scope.addTodos) {
      $ionicPopup.alert({
        title: '当前有正在执行的一周任务',
        template: '请先完成当前的一周任务'
      });
    } else {
      thisTodo = $scope.stageTodos.splice(i, 1)[0];
      $scope.todos.waitingTodos.push(thisTodo);
      $scope.todos.stageTodos = $scope.stageTodos;
      $scope.todoService.set('weektodos', $scope.weektodos);
      $scope.$emit('updateWaitingTodo', $scope.todos.waitingTodos);
    }
  };

  $scope.showTip = function() {
    var flag = angular.element(document.getElementById('add-task')).hasClass('add-task');
    return flag ? true : false;
  };
}]);

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
    cache: false,
    views: {
      'menu-content': {
        templateUrl: 'templates/list.html',
        controller: 'ListCtrl'
      }
    }
  })

  .state('todo.stage', {
    url: '/stage',
    cache: false,
    views: {
      'menu-content': {
        templateUrl: 'templates/stage.html',
        controller: 'StageCtrl'
      }
    }
  })

  .state('todo.archive', {
    url: '/archive',
    cache: false,
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
  });

  $urlRouterProvider.otherwise('/todo/list');

}]);

angular.module('todo.controllers', ['todo.services'])

.controller('MainCtrl', ['$scope', '$ionicModal', '$ionicPopup', '$location', '$window', 'Todos', function($scope, $ionicModal, $ionicPopup, $location, $window, Todos){
  $scope.version = "0.0.1";
  $scope.todoService = Todos;
  $scope.weektodos = $scope.todoService.get('weektodos');

  if($scope.weektodos) {
    $scope.weektodos['version'] = $scope.version;
  } else {
    $scope.weektodos = {
      version: $scope.version,
      todos: {
        enableAdd: true,
        allTodos: [],
        waitingTodos: [],
        stageTodos: [],
        stat: {}
      }
    };
    $scope.todoService.set('weektodos', $scope.weektodos);
  }
  $scope.todos = $scope.weektodos.todos;

  $scope.$on('updateWaitingTodo', function(event, data) {
    $scope.waitingTodos = data;
  });
  $scope.$on('watchAddStatus', function(event, data) {
    $scope.addTodos = data;
  });
  if($scope.todos.waitingTodos.length === 0) {
    $scope.waitingTodos = [];
  } else {
    $scope.waitingTodos = $scope.todos.waitingTodos;
  }
  $scope.addTodos = $scope.todos.enableAdd;
  
  //modal controller
  $ionicModal.fromTemplateUrl('templates/add.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });
  $scope.closeAddTodo = function() {
    $scope.modal.hide();
  };
  $scope.openAddTodo = function() {
    $scope.modal.show();
  };

  $scope.addTodo = function() {
    $scope.waitingTodos.push({
        done: false,
        text: this.todoText
    });
    this.todoText = "";
    $scope.todos.waitingTodos = $scope.waitingTodos;
    $scope.todoService.set('weektodos', $scope.weektodos);
  };
  $scope.deleteTodo = function() {
    var i = this.$parent.$index;
    $scope.waitingTodos.splice(i, 1);
    $scope.todos.waitingTodos = $scope.waitingTodos;
    $scope.todoService.set('weektodos', $scope.weektodos);
  };

  $scope.deleteAll = function() {
    $ionicPopup.confirm({
      title: "确认信息",
      template: "确定全部删除吗?"
    }).then(function(res){
      if(res) {
        $scope.waitingTodos = [];
        $scope.todos.waitingTodos = [];
        $scope.todoService.set('weektodos', $scope.weektodos);
      }
    });
  };
  $scope.saveWeekTodos = function() {
    var d = new Date();
    $scope.todos.allTodos.push({
      date: d.getTime(),
      todos: $scope.waitingTodos
    });
    $scope.todos.enableAdd = false;
    $scope.addTodos = false;
    $scope.todoService.set('weektodos', $scope.weektodos);
    $scope.modal.hide();
    $scope.$broadcast('updateTodoList', $scope.waitingTodos);
    $scope.todos.waitingTodos = [];
    $scope.waitingTodos = [];
  };

  $scope.checkTodos = function() {
    return $scope.waitingTodos ? $scope.waitingTodos.length === 0 : false;
  };

  $scope.moveTaskOut = function() {
    var i = this.$parent.$index,
        thisTodo = $scope.waitingTodos.splice(i, 1)[0];
    $scope.todos.waitingTodos = $scope.waitingTodos;
    $scope.todos.stageTodos.push(thisTodo);
    $scope.todoService.set('weektodos', $scope.weektodos);
    $scope.$broadcast('updateStageTodos', $scope.todos.stageTodos);
  };
}])

.controller('ListCtrl', ['$scope', '$ionicModal', function($scope, $ionicModal) {
  var allTodos, thisWeekTodo, startDate, today, days;
  if($scope.todos.allTodos.length > 0 && !$scope.todos.enableAdd) {
    allTodos = $scope.todos.allTodos;
    thisWeekTodo = allTodos[allTodos.length - 1];
    startDate = thisWeekTodo.date;
    today = new Date().getTime();
    days = parseInt((today - startDate) / (1000 * 3600 * 24));
    $scope.remain = 7 - days;
    $scope.listTodos = thisWeekTodo.todos;
  } else {
    $scope.listTodos = [];
  }

  $scope.$on('updateTodoList', function(event, data) {
    allTodos = $scope.todos.allTodos;
    thisWeekTodo = allTodos[allTodos.length - 1];
    $scope.listTodos = data;
    $scope.remain = 7;
  });

  $scope.toggleTodo = function() {
    var i = this.$parent.$index, isDone = true;
    thisWeekTodo.todos = $scope.listTodos;
    $scope.todoService.set('weektodos', $scope.weektodos);

    angular.forEach($scope.listTodos, function(todo, key) {
      if(!todo.done) {
        isDone = false;
        return;
      }
    });
    if(isDone) {
      $scope.modal.show();
    }
  };

  $ionicModal.fromTemplateUrl('templates/done.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });
  $scope.pushArchive = function() {
    $scope.todos.enableAdd = true;
    $scope.todoService.set('weektodos', $scope.weektodos);
    $scope.listTodos = [];
    $scope.remain = 0;
    $scope.modal.hide();
    $scope.$emit('watchAddStatus', $scope.todos.enableAdd);
  };
}])

.controller('ArchiveCtrl', ['$scope', '$filter', function($scope, $filter) {
  var weektodos = $scope.todoService.get('weektodos'), todos = weektodos.todos, allTodos, preMonth;
  $scope.months = [];
  allTodos = todos.allTodos
  angular.forEach(allTodos, function(data, index) {
    month = $filter('date')(data.date, 'yyyy-MM');
    if(preMonth !== month) {
      preMonth = month;
      $scope.months.push(month);
    }
  });
  if(!todos.enableAdd) {
    $scope.months.pop();
  }
  $scope.months.reverse();
}])

.controller('ArchiveSubCtrl', ['$scope', '$stateParams', '$filter', function($scope, $stateParams, $filter) {
  var weektodos = $scope.todoService.get('weektodos'),
      todos = weektodos.todos,
      allTodos = todos.allTodos, month;
  $scope.month = $stateParams.month;
  $scope.monthTodos = [];
  angular.forEach(allTodos, function(data, index) {
    month = $filter('date')(data.date, 'yyyy-MM');
    if(month === $scope.month) {
      $scope.monthTodos.push(data);
    }
  });
}])

.controller('StageCtrl', ['$scope', '$ionicGesture', '$ionicPopup', function($scope, $ionicGesture, $ionicPopup){
  $scope.$on('updateStageTodos', function(event, data) {
    $scope.stageTodos = data;
  });
  $scope.stageTodos = $scope.todos.stageTodos;

	$ionicGesture.on('swipedown', function() {
    angular.element(document.getElementById('add-task')).removeClass('add-task');
    document.getElementById('add-input').focus();
  }, angular.element(document));

  $scope.addTodo = function() {
    $scope.stageTodos.push({
      done: false,
      text: this.todoText
    });
    this.todoText = "";
    $scope.todos.stageTodos = $scope.stageTodos;
    $scope.todoService.set('weektodos', $scope.weektodos);
  };

  $scope.deleteTodo = function() {
    var i = this.$parent.$index;
    $scope.stageTodos.splice(i, 1);
    $scope.todos.stageTodos = $scope.stageTodos;
    $scope.todoService.set('weektodos', $scope.weektodos);
  };

  $scope.moveTaskIn = function() {
    var i = this.$parent.$index, thisTodo;
    if(!$scope.addTodos) {
      $ionicPopup.alert({
        title: '当前有正在执行的一周任务',
        template: '请先完成当前的一周任务'
      });
    } else {
      thisTodo = $scope.stageTodos.splice(i, 1)[0];
      $scope.todos.waitingTodos.push(thisTodo);
      $scope.todos.stageTodos = $scope.stageTodos;
      $scope.todoService.set('weektodos', $scope.weektodos);
      $scope.$emit('updateWaitingTodo', $scope.todos.waitingTodos);
    }
  };

  $scope.showTip = function() {
    var flag = angular.element(document.getElementById('add-task')).hasClass('add-task');
    return flag ? true : false;
  };
}]);

angular.module('todo.services', [])
.factory('Todos', function() {
  return {
    get: function(name) {
      var d = localStorage.getItem(name);
      return d ? angular.fromJson(d) : null;
    },
    set: function(name, value) {
      return localStorage.setItem(name, angular.toJson(value));
    }
  };
});
angular.module("todos",["ionic","todo.controllers"]).run(function(o){o.ready(function(){window.cordova&&window.cordova.plugins.Keyboard&&cordova.plugins.Keyboard.hideKeyboardAccessoryBar(!0),window.StatusBar&&StatusBar.styleDefault()})}).config(["$stateProvider","$urlRouterProvider",function(o,t){o.state("todo",{url:"/todo","abstract":!0,templateUrl:"templates/todos.html",controller:"MainCtrl"}).state("todo.list",{url:"/list",cache:!1,views:{"menu-content":{templateUrl:"templates/list.html",controller:"ListCtrl"}}}).state("todo.stage",{url:"/stage",cache:!1,views:{"menu-content":{templateUrl:"templates/stage.html",controller:"StageCtrl"}}}).state("todo.archive",{url:"/archive",cache:!1,views:{"menu-content":{templateUrl:"templates/archive.html",controller:"ArchiveCtrl"}}}).state("todo.archive-subpage",{url:"/archive/:month",views:{"menu-content":{templateUrl:"templates/archive-subpage.html",controller:"ArchiveSubCtrl"}}}),t.otherwise("/todo/list")}]),angular.module("todo.controllers",["todo.services"]).controller("MainCtrl",["$scope","$ionicModal","$ionicPopup","$location","$window","Todos",function(o,t,e,d,s,n){o.version="0.0.1",o.todoService=n,o.weektodos=o.todoService.get("weektodos"),o.weektodos?o.weektodos.version=o.version:(o.weektodos={version:o.version,todos:{enableAdd:!0,allTodos:[],waitingTodos:[],stageTodos:[],stat:{}}},o.todoService.set("weektodos",o.weektodos)),o.todos=o.weektodos.todos,o.$on("updateWaitingTodo",function(t,e){o.waitingTodos=e}),o.$on("watchAddStatus",function(t,e){o.addTodos=e}),o.waitingTodos=0===o.todos.waitingTodos.length?[]:o.todos.waitingTodos,o.addTodos=o.todos.enableAdd,t.fromTemplateUrl("templates/add.html",{scope:o}).then(function(t){o.modal=t}),o.closeAddTodo=function(){o.modal.hide()},o.openAddTodo=function(){o.modal.show()},o.addTodo=function(){o.waitingTodos.push({done:!1,text:this.todoText}),this.todoText="",o.todos.waitingTodos=o.waitingTodos,o.todoService.set("weektodos",o.weektodos)},o.deleteTodo=function(){var t=this.$parent.$index;o.waitingTodos.splice(t,1),o.todos.waitingTodos=o.waitingTodos,o.todoService.set("weektodos",o.weektodos)},o.deleteAll=function(){e.confirm({title:"确认信息",template:"确定全部删除吗?"}).then(function(t){t&&(o.waitingTodos=[],o.todos.waitingTodos=[],o.todoService.set("weektodos",o.weektodos))})},o.saveWeekTodos=function(){var t=new Date;o.todos.allTodos.push({date:t.getTime(),todos:o.waitingTodos}),o.todos.enableAdd=!1,o.addTodos=!1,o.todoService.set("weektodos",o.weektodos),o.modal.hide(),o.$broadcast("updateTodoList",o.waitingTodos),o.todos.waitingTodos=[],o.waitingTodos=[]},o.checkTodos=function(){return o.waitingTodos?0===o.waitingTodos.length:!1},o.moveTaskOut=function(){var t=this.$parent.$index,e=o.waitingTodos.splice(t,1)[0];o.todos.waitingTodos=o.waitingTodos,o.todos.stageTodos.push(e),o.todoService.set("weektodos",o.weektodos),o.$broadcast("updateStageTodos",o.todos.stageTodos)}}]).controller("ListCtrl",["$scope","$ionicModal",function(o,t){var e,d,s,n,a;o.todos.allTodos.length>0&&!o.todos.enableAdd?(e=o.todos.allTodos,d=e[e.length-1],s=d.date,n=(new Date).getTime(),a=parseInt((n-s)/864e5),o.remain=7-a,o.listTodos=d.todos):o.listTodos=[],o.$on("updateTodoList",function(t,s){e=o.todos.allTodos,d=e[e.length-1],o.listTodos=s,o.remain=7}),o.toggleTodo=function(){var t=(this.$parent.$index,!0);d.todos=o.listTodos,o.todoService.set("weektodos",o.weektodos),angular.forEach(o.listTodos,function(o,e){return o.done?void 0:void(t=!1)}),t&&o.modal.show()},t.fromTemplateUrl("templates/done.html",{scope:o}).then(function(t){o.modal=t}),o.pushArchive=function(){o.todos.enableAdd=!0,o.todoService.set("weektodos",o.weektodos),o.listTodos=[],o.remain=0,o.modal.hide(),o.$emit("watchAddStatus",o.todos.enableAdd)}}]).controller("ArchiveCtrl",["$scope","$filter",function(o,t){var e,d,s=o.todoService.get("weektodos"),n=s.todos;o.months=[],e=n.allTodos,angular.forEach(e,function(e,s){month=t("date")(e.date,"yyyy-MM"),d!==month&&(d=month,o.months.push(month))}),n.enableAdd||o.months.pop(),o.months.reverse()}]).controller("ArchiveSubCtrl",["$scope","$stateParams","$filter",function(o,t,e){var d,s=o.todoService.get("weektodos"),n=s.todos,a=n.allTodos;o.month=t.month,o.monthTodos=[],angular.forEach(a,function(t,s){d=e("date")(t.date,"yyyy-MM"),d===o.month&&o.monthTodos.push(t)})}]).controller("StageCtrl",["$scope","$ionicGesture","$ionicPopup",function(o,t,e){o.$on("updateStageTodos",function(t,e){o.stageTodos=e}),o.stageTodos=o.todos.stageTodos,t.on("swipedown",function(){angular.element(document.getElementById("add-task")).removeClass("add-task"),document.getElementById("add-input").focus()},angular.element(document)),o.addTodo=function(){o.stageTodos.push({done:!1,text:this.todoText}),this.todoText="",o.todos.stageTodos=o.stageTodos,o.todoService.set("weektodos",o.weektodos)},o.deleteTodo=function(){var t=this.$parent.$index;o.stageTodos.splice(t,1),o.todos.stageTodos=o.stageTodos,o.todoService.set("weektodos",o.weektodos)},o.moveTaskIn=function(){var t,d=this.$parent.$index;o.addTodos?(t=o.stageTodos.splice(d,1)[0],o.todos.waitingTodos.push(t),o.todos.stageTodos=o.stageTodos,o.todoService.set("weektodos",o.weektodos),o.$emit("updateWaitingTodo",o.todos.waitingTodos)):e.alert({title:"当前有正在执行的一周任务",template:"请先完成当前的一周任务"})},o.showTip=function(){var o=angular.element(document.getElementById("add-task")).hasClass("add-task");return o?!0:!1}}]),angular.module("todo.services",[]).factory("Todos",function(){return{get:function(o){var t=localStorage.getItem(o);return t?angular.fromJson(t):null},set:function(o,t){return localStorage.setItem(o,angular.toJson(t))}}});
angular.module('todo.services', [])
.factory('Todos', function() {
  return {
    get: function(name) {
      var d = localStorage.getItem(name);
      return d ? angular.fromJson(d) : null;
    },
    set: function(name, value) {
      return localStorage.setItem(name, angular.toJson(value));
    }
  };
});