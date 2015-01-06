var emApp = angular.module('emApp.config', []);

emApp.constant('emConstants', {
    "APP_NAME": "EXPENSE MANAGER",
    "APP_VERSION": "0.0.1",
    // "BASE_URL": "http://techiedreams.com/projects/em/v1/", // Remote
    "BASE_URL": "http://localhost:8899/EM-Services/v1/", // Local
    "LOGIN": "login",
    "REGISTER": "register"
});