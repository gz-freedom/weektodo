angular.module('todo.controllers', ['todo.services'])

.controller('MainCtrl', ['$scope', '$ionicModal', '$ionicPopup', 'Todos', function($scope, $ionicModal, $ionicPopup, Todos){
  // set test data
  // $http.get("test-data.json").success(function(response) {
  //   var weektodos = response[0];
  //   todoService.set("weektodos", weektodos);
  // });
  $scope.todoService = Todos;
  var weektodos = $scope.todoService.get('weektodos'),
      todos = weektodos.todos;
  //console.log(weektodos);
  $scope.$on('updateWaitingTodo', function(event, data) {
    weektodos = $scope.todoService.get('weektodos');
    $scope.todos = weektodos.waitingTodos;
  });
  $scope.$on('watchAddStatus', function(event, data) {
    $scope.addTodos = data;
  });
  if(todos.waitingTodos.length === 0) {
    $scope.todos = [];
  } else {
    $scope.todos = todos.waitingTodos;
  }
  $scope.addTodos = todos.enableAdd;
  
  //modal controller
  $ionicModal.fromTemplateUrl('templates/add.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });
  $scope.closeAddTodo = function() {
    $scope.modal.hide();
    setTimeout(function() {
      window.location.reload();
    }, 300);
  };
  $scope.openAddTodo = function(flag) {
    if(flag) {
      window.location.href = '#/todo/stage';
    }
    $scope.modal.show();
  };

  $scope.addTodo = function() {
    $scope.todos.push({
        done: false,
        text: this.todoText
    });
    this.todoText = "";
    todos.waitingTodos = $scope.todos;
    $scope.todoService.set('weektodos', weektodos);
  };
  $scope.deleteTodo = function() {
    var i = this.$parent.$index;
    $scope.todos.splice(i, 1);
    todos.waitingTodos = $scope.todos;
    $scope.todoService.set('weektodos', weektodos);
  };

  $scope.deleteAll = function() {
    $ionicPopup.confirm({
      title: "确认信息",
      template: "确定全部删除吗?"
    }).then(function(res){
      if(res) {
        $scope.todos = [];
        todos.waitingTodos = [];
        $scope.todoService.set('weektodos', weektodos);
      }
    });
  };
  $scope.saveWeekTodos = function() {
    var d = new Date();
    todos.allTodos.push({
      date: d.getTime(),
      todos: $scope.todos
    });
    todos.enableAdd = false;
    todos.waitingTodos = [];
    $scope.todoService.set('weektodos', weektodos);
    $scope.modal.hide();
    $scope.$broadcast('updateTodoList', $scope.todos);
  };

  $scope.checkTodos = function() {
    return $scope.todos.length === 0;
  };

  $scope.moveTaskOut = function() {
    var i = this.$parent.$index,
        thisTodo = $scope.todos.splice(i, 1)[0];
    todos.waitingTodos = $scope.todos;
    todos.stageTodos.push(thisTodo);
    $scope.todoService.set('weektodos', weektodos);
    $scope.$broadcast('updateStageTodos');
  };
}])

.controller('ListCtrl', ['$scope', '$ionicModal', function($scope, $ionicModal) {
  var weektodos = $scope.todoService.get('weektodos'), todos = weektodos.todos, allTodos,
      thisWeekTodo, startDate, today, days;
  if(todos.allTodos.length > 0 && !todos.enable_add) {
    allTodos = todos.allTodos;
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
    var i = this.$parent.$index, isDone = true;
    thisWeekTodo.todos = $scope.todos;
    $scope.todoService.set('weektodos', weektodos);

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
    todos.enableAdd = true;
    $scope.todoService.set('weektodos', weektodos);
    $scope.todos = [];
    $scope.remain = 0;
    $scope.modal.hide();
    $scope.$emit('watchAddStatus', true);
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
  var weektodos = $scope.todoService.get('weektodos'),
      todos = weektodos.todos;
  $scope.$on('updateStageTodos', function() {
    weektodos = $scope.todoService.get('weektodos');
    todos = weektodos.todos;
    $scope.todos = todos.stageTodos;
  });

  $scope.todos = todos.stageTodos;

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
    todos.stageTodos = $scope.todos;
    $scope.todoService.set('weektodos', weektodos);
  };

  $scope.deleteTodo = function() {
    var i = this.$parent.$index;
    $scope.todos.splice(i, 1);
    todos.stageTodos = $scope.todos;
    $scope.todoService.set('weektodos', weektodos);
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
      todos.waitingTodos.push(thisTodo);
      todos.stageTodos = $scope.todos;
      $scope.todoService.set('weektodos', weektodos);
      $scope.$emit('updateWaitingTodo');
    }
  };
}])

.controller('EntranceCtrl', ['$scope', '$timeout', '$location', 'Todos', function($scope, $timeout, $location, Todos) {
  $scope.todoService = Todos;
  $scope.version = '0.0.0';
  var weektodos = $scope.todoService.get('weektodos');
  if(weektodos) {
    weektodos['version'] = $scope.version;
  } else {
    weektodos = {
      version: $scope.version,
      todos: {
        enableAdd: true,
        allTodos: [],
        waitingTodos: [],
        stageTodos: [],
        stat: {}
      }
    };
    $scope.todoService.set('weektodos', weektodos);
  }
  $timeout(function() {
    $location.path('/todo/list');
  }, 1000);
}]);


