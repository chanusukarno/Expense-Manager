var emApp = angular.module('emApp.services', []);

emApp.factory('emAPI', function($http, $q) {
    // define the API in just one place so it's easy to update
    var apiURL = '', config = {timeout: 10000};

    var expenses;

    function validateResponse(result) {
        return !(typeof result.data !== 'array' && typeof result.data !== 'object');
    }

    return {
        // get all recent posts
        expenses: function() {
            var q = $q.defer();
            if (!expenses) {
                $http.get(apiURL + 'data/expenses.json', config)
                        .then(function(result) {
                            if (!validateResponse(result)) {
                                q.reject(new Error('Invalid Response'));
                            } else {
                                expenses = result.data;
                                q.resolve(result.data);
                            }
                        }, function(err) {
                            console.log('expenses/ Failed');
                            q.reject(err);
                        });
            } else {
                q.resolve(expenses);
            }
            return q.promise;
        },
        addExpense: function(expense) {
            expense.id = expenses.length + 1;
            expense.currency = "&#8377;";
            expenses.push(expense);
        }
    };
});