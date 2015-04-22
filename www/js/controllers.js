angular.module('todo.controllers', ['todo.services'])

.controller('MainCtrl', ['$scope', '$ionicModal', '$ionicPopup', '$location', 'Todos', function($scope, $ionicModal, $ionicPopup, $location, Todos){
  $scope.todoService = Todos;
  $scope.weektodos = $scope.todoService.get('weektodos');
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
    //window.location.href = '#/todo/list';
    alert(window.location.href);
  }, 1000);
}]);


