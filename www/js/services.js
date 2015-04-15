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
  }
});