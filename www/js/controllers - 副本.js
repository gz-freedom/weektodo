angular.module('todo.controllers', ['todo.services'])

.controller('MainCtrl', ['$scope', '$ionicModal', '$ionicPopup', 'Todos', function($scope, $ionicModal, $ionicPopup, Todos){
  var todoService = angular.injector(['todo.services']).get('Todos'),
      weektodos = todoService.get('weektodos');
  $scope.weektodos = Todos.get('weektodos');

  $scope.$on('updateWaitingTodo', function(event, data) {
    todoService = angular.injector(['todo.services']).get('Todos');
    weektodos = todoService.get('weektodos');
    $scope.todos = weektodos.waitingTodos;
  });

  if(weektodos) {
    if(weektodos.waitingTodos.length === 0) {
      $scope.todos = [];
    } else {
      $scope.todos = weektodos.waitingTodos;
    }
    $scope.addTodos = weektodos.enable_add;
  } else {
    $scope.todos = [];
    $scope.addTodos = false;
  }
  
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
    $scope.todos.push({
        done: false,
        text: this.todoText
    });
    this.todoText = "";
    if(weektodos) {
      weektodos.waitingTodos = $scope.todos;
    } else {
      weektodos = {
        enable_add: true,
        stageTodos: [],
        allTodos: [],
        waitingTodos: $scope.todos
      };
    }
    todoService.set('weektodos', weektodos);
  };
  $scope.deleteTodo = function() {
    var i = this.$parent.$index;
    $scope.todos.splice(i, 1);
    weektodos.waitingTodos = $scope.todos;
    todoService.set('weektodos', weektodos);
  };

  $scope.deleteAll = function() {
    $ionicPopup.confirm({
      title: "确认信息",
      template: "确定全部删除吗?"
    }).then(function(res){
      if(res) {
        $scope.todos = [];
        weektodos.waitingTodos = [];
        todoService.set('weektodos', weektodos);
      }
    });
  };
  $scope.saveWeekTodos = function() {
    var d = new Date();
    weektodos.allTodos.push({
      date: d.getTime(),
      todos: $scope.todos
    });
    weektodos.enable_add = false;
    weektodos.waitingTodos = [];
    todoService.set('weektodos', weektodos);
    $scope.modal.hide();
    $scope.$broadcast('updateTodoList', $scope.todos);
  };

  $scope.checkTodos = function() {
    return $scope.todos.length === 0;
  };

  $scope.moveTaskOut = function() {
    var i = this.$parent.$index,
        thisTodo = $scope.todos.splice(i, 1)[0];
    weektodos.waitingTodos = $scope.todos;
    weektodos.stageTodos.push(thisTodo);
    todoService.set('weektodos', weektodos);
    $scope.$broadcast('updateStageTodos');
  };
}])

.controller('ListCtrl', ['$scope', '$ionicModal', function($scope, $ionicModal) {
  var todoService = angular.injector(['todo.services']).get('Todos'),
      weektodos = todoService.get('weektodos'),
      allTodos = weektodos.allTodos,
      thisWeekTodo, startDate, today, days;
  if(weektodos && allTodos.length > 0 && !weektodos.enable_add) {
    thisWeekTodo = allTodos[allTodos.length - 1];
    startDate = thisWeekTodo.date;
    today = new Date().getTime();
    days = parseInt((today - startDate) / (1000 * 3600 * 24));
    $scope.remain = 7 - days;
    $scope.todos = thisWeekTodo.todos;
  } else {
    $scope.todos = [];
  }

  $scope.$on('updateTodoList', function(event, data) {
    $scope.todos = data;
    $scope.remain = 7;
  });

  $scope.toggleTodo = function() {
    var i = this.$parent.$index,
        isDone = true;
    thisWeekTodo.todos = $scope.todos;
    todoService.set('weektodos', weektodos);

    angular.forEach($scope.todos, function(todo, key) {
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
    weektodos.enable_add = true;
    todoService.set('weektodos', weektodos);
    $scope.todos = [];
    $scope.remain = 0;
    $scope.modal.hide();
  };
}])

.controller('ArchiveCtrl', ['$scope', '$filter', function($scope, $filter) {
  var todoService = angular.injector(['todo.services']).get('Todos'),
      weektodos = todoService.get('weektodos'), allTodos, preMonth, month;
  // set test data
  // $http.get("test-data.json").success(function(response) {
  //   var weektodos = response[0];
  //   todoService.set("weektodos", weektodos);
  // });
  $scope.months = [];
  if(weektodos && weektodos.allTodos.length > 0) {
    allTodos = weektodos.allTodos;
    angular.forEach(allTodos, function(data, index) {
      month = $filter('date')(data.date, 'yyyy-MM');
      if(preMonth !== month) {
        preMonth = month;
        $scope.months.push(month);
      }
    });
  }
}])

.controller('ArchiveSubCtrl', ['$scope', '$stateParams', '$filter', function($scope, $stateParams, $filter) {
  var todoService = angular.injector(['todo.services']).get('Todos'),
      weektodos = todoService.get('weektodos'),
      allTodos = weektodos.allTodos, month;
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
  var todoService = angular.injector(['todo.services']).get('Todos'),
      weektodos = todoService.get('weektodos');

  $scope.$on('updateStageTodos', function() {
    todoService = angular.injector(['todo.services']).get('Todos');
    weektodos = todoService.get('weektodos');
    $scope.todos = weektodos.stageTodos;
  });

  if(weektodos && weektodos.stageTodos.length > 0) {
    $scope.todos = weektodos.stageTodos;
  } else {
    $scope.todos = [];
    weektodos = {
      enable_add: true,
      stageTodos: [],
      allTodos: [],
      waitingTodos: []
    };
  }

	$ionicGesture.on('swipedown', function() {
    angular.element(document.getElementById('add-task')).removeClass('add-task');
    document.getElementById('add-input').focus();
  }, angular.element(document));

  $scope.addTodo = function() {
    $scope.todos.push({
      done: false,
      text: this.todoText
    });
    this.todoText = "";
    weektodos.stageTodos = $scope.todos;
    todoService.set('weektodos', weektodos);
  };

  $scope.deleteTodo = function() {
    var i = this.$parent.$index;
    $scope.todos.splice(i, 1);
    weektodos.stageTodos = $scope.todos;
    todoService.set('weektodos', weektodos);
  };

  $scope.moveTaskIn = function() {
    var i = this.$parent.$index, thisTodo;
    if(!$scope.addTodos) {
      $ionicPopup.alert({
        title: '当前有正在执行的一周任务',
        template: '请先完成当前的一周任务'
      });
    } else {
      thisTodo = $scope.todos.splice(i, 1)[0];
      weektodos.waitingTodos.push(thisTodo);
      weektodos.stageTodos = $scope.todos;
      todoService.set('weektodos', weektodos);
      $scope.$emit('updateWaitingTodo');
    }
  };
}]);