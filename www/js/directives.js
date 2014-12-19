var emApp = angular.module('emApp.filters', []);

emApp.filter('html', function($sce) {
    return function(input) {
        return $sce.trustAsHtml(input);
    };
});
