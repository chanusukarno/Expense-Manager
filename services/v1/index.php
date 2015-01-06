<?php

header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit();
}

require_once '../include/DbHandler.php';
require_once '../include/PassHash.php';
require '.././libs/Slim/Slim.php';

\Slim\Slim::registerAutoloader();

$app = new \Slim\Slim();
$app->add(new \Slim\Middleware\ContentTypes());

// User id from db - Global Variable
$user_id = NULL;

define('PROVIDER_GOOGLE', 'google');
define('PROVIDER_FACEBOOK', 'facebook');

/**
 * Adding Middle Layer to authenticate every request
 * Checking if the request has valid api key in the 'Authorization' header
 */
function authenticate(\Slim\Route $route) {
    // Getting request headers
    $headers = apache_request_headers();
    $response = array();
    $app = \Slim\Slim::getInstance();

    // Verifying Authorization Header
    if (isset($headers['Authorization'])) {
        $db = new DbHandler();

        // get the api key
        $api_key = $headers['Authorization'];
        // validating api key
        if (!$db->isValidApiKey($api_key)) {
            // api key is not present in users table
            $response["error"] = true;
            $response["message"] = "Access Denied. Invalid Api key";
            echoResponse(401, $response);
            $app->stop();
        } else {
            global $user_id;
            // get user primary key id
            $user_id = $db->getUserId($api_key);
        }
    } else {
        // api key is missing in header
        $response["error"] = true;
        $response["message"] = "Api key is misssing";
        echoResponse(400, $response);
        $app->stop();
    }
}

/**
 * ----------- METHODS WITHOUT AUTHENTICATION ---------------------------------
 */

/**
 * Social login
 * url - /oauth
 * method - POST
 * params - provider_key, provider_name, name, email, profile_pic
 */
$app->post('/oauth', function() use ($app) {
    // check for required params
    $request_params = $app->request->getBody();
    verifyRequiredParams(array('provider_key', 'provider_name', 'name', 'email'), $request_params);

    $response = array();

    // reading post params
    $providerKey = $request_params['provider_key'];
    $providerName = $request_params['provider_name'];
    $name = $request_params['name'];
    $email = $request_params['email'];
    // $profilePic = $request_params['profile_pic'];

    // validating email address
    validateEmail($email);
    // validating provider name
    validateProviderName($providerName);

    $db = new DbHandler();

    if ($db->checkLogin($email, "")) {
        // returning user 
        $userId = $db->getUserIdByEmail($email);
        // check for different provider
        if($db->getAuthProviderNameById($userId) !== $providerName) {
            // insert the different provider into auth_provider table
            $db->createAuthProvider($providerKey, $providerName, $userId);
        }
        // successful login, echoing user details
        $response = getUserDetails($db, $email);

    } else {
        // new user, insert into 'users' and 'auth_provider' tables
        $res = $db->createUser($name, $email, "");

        if ($res == USER_CREATED_SUCCESSFULLY) {
            // inert into auth_provider table
            $userId = $db->getUserIdByEmail($email);
            $db->createAuthProvider($providerKey, $providerName, $userId);

            // successful login, echoing user details
            $response = getUserDetails($db, $email);
        } else if ($res == USER_CREATE_FAILED) {
            $response["error"] = true;
            $response["message"] = "Oops! An error occurred while registering. Try again!";
        } else if ($res == USER_ALREADY_EXISTED) {
            $response["error"] = true;
            $response["message"] = "Sorry, this email already exists";
        }
    }


    // echo json response
    echoResponse(200, $response);
});

/**
 * User Registration
 * url - /register
 * method - POST
 * params - name, email, password
 */
$app->post('/register', function() use ($app) {
    // check for required params
    $request_params = $app->request->getBody();
    verifyRequiredParams(array('name', 'email', 'password'), $request_params);

    $response = array();

    // reading post params
    $name = $request_params['name'];
    $email = $request_params['email'];
    $password = $request_params['password'];

    // validating email address
    validateEmail($email);

    $db = new DbHandler();
    $res = $db->createUser($name, $email, $password);

    if ($res == USER_CREATED_SUCCESSFULLY) {
        $response["error"] = false;
        $response["message"] = "You are successfully registered!";
    } else if ($res == USER_CREATE_FAILED) {
        $response["error"] = true;
        $response["message"] = "Oops! An error occurred while registering. Try again!";
    } else if ($res == USER_ALREADY_EXISTED) {
        $response["error"] = true;
        $response["message"] = "Sorry, this email already exists";
    }
    // echo json response
    echoResponse(201, $response);
});

/**
 * User Login
 * url - /login
 * method - POST
 * params - email, password
 */
$app->post('/login', function() use ($app) {
    // check for required params
    $request_params = $app->request->getBody();
    verifyRequiredParams(array('email', 'password'), $request_params);

    // reading post params
    $email = $request_params['email'];
    $password = $request_params['password'];

    $response = array();

    $db = new DbHandler();
    // check for correct email and password
    if ($db->checkLogin($email, $password)) {
        // get the user by email
        $response = getUserDetails($db, $email);
    } else {
        // user credentials are wrong
        $response['error'] = true;
        $response['message'] = 'Login failed. Incorrect credentials';
    }

    echoResponse(200, $response);
});

/*
 * ------------------------ METHODS WITH AUTHENTICATION ------------------------
 */

/**
 * Listing all tasks of particual user
 * method GET
 * url /tasks          
 */
$app->get('/tasks', 'authenticate', function() {
    global $user_id;
    $response = array();
    $db = new DbHandler();

    // fetching all user tasks
    $result = $db->getAllUserTasks($user_id);

    $response["error"] = false;
    $response["tasks"] = array();

    // looping through result and preparing tasks array
    while ($task = $result->fetch_assoc()) {
        $tmp = array();
        $tmp["id"] = $task["id"];
        $tmp["task"] = $task["task"];
        $tmp["status"] = $task["status"];
        $tmp["createdAt"] = $task["created_at"];
        array_push($response["tasks"], $tmp);
    }

    echoResponse(200, $response);
});

/**
 * Listing single task of particual user
 * method GET
 * url /tasks/:id
 * Will return 404 if the task doesn't belongs to user
 */
$app->get('/tasks/:id', 'authenticate', function($task_id) {
    global $user_id;
    $response = array();
    $db = new DbHandler();

    // fetch task
    $result = $db->getTask($task_id, $user_id);

    if ($result != NULL) {
        $response["error"] = false;
        $response["id"] = $result["id"];
        $response["task"] = $result["task"];
        $response["status"] = $result["status"];
        $response["createdAt"] = $result["created_at"];
        echoResponse(200, $response);
    } else {
        $response["error"] = true;
        $response["message"] = "The requested resource doesn't exists";
        echoResponse(404, $response);
    }
});

/**
 * Creating new task in db
 * method POST
 * params - name
 * url - /tasks/
 */
//$app->post('/tasks', 'authenticate', function() use ($app) {
//    // check for required params
//    verifyRequiredParams(array('task'));
//
//    $response = array();
//    $task = $app->request->post('task');
//
//    global $user_id;
//    $db = new DbHandler();
//
//    // creating new task
//    $task_id = $db->createTask($user_id, $task);
//
//    if ($task_id != NULL) {
//        $response["error"] = false;
//        $response["message"] = "Task created successfully";
//        $response["task_id"] = $task_id;
//        echoResponse(201, $response);
//    } else {
//        $response["error"] = true;
//        $response["message"] = "Failed to create task. Please try again";
//        echoResponse(200, $response);
//    }
//});

/**
 * Updating existing task
 * method PUT
 * params task, status
 * url - /tasks/:id
 */
//$app->put('/tasks/:id', 'authenticate', function($task_id) use($app) {
//    // check for required params
//    verifyRequiredParams(array('task', 'status'));
//
//    global $user_id;
//    $task = $app->request->put('task');
//    $status = $app->request->put('status');
//
//    $db = new DbHandler();
//    $response = array();
//
//    // updating task
//    $result = $db->updateTask($user_id, $task_id, $task, $status);
//    if ($result) {
//        // task updated successfully
//        $response["error"] = false;
//        $response["message"] = "Task updated successfully";
//    } else {
//        // task failed to update
//        $response["error"] = true;
//        $response["message"] = "Task failed to update. Please try again!";
//    }
//    echoResponse(200, $response);
//});

/**
 * Deleting task. Users can delete only their tasks
 * method DELETE
 * url /tasks
 */
$app->delete('/tasks/:id', 'authenticate', function($task_id) use($app) {
    global $user_id;

    $db = new DbHandler();
    $response = array();
    $result = $db->deleteTask($user_id, $task_id);
    if ($result) {
        // task deleted successfully
        $response["error"] = false;
        $response["message"] = "Task deleted succesfully";
    } else {
        // task failed to delete
        $response["error"] = true;
        $response["message"] = "Task failed to delete. Please try again!";
    }
    echoResponse(200, $response);
});

/**
 * Verifying required params posted or not
 */
function verifyRequiredParams($required_fields, $request_params) {
    $error = false;
    $error_fields = "";
    // Handling PUT request params
    if ($_SERVER['REQUEST_METHOD'] == 'PUT') {
        $app = \Slim\Slim::getInstance();
        parse_str($app->request()->getBody(), $request_params);
    }
    foreach ($required_fields as $field) {
        if (!isset($request_params[$field]) || strlen(trim($request_params[$field])) <= 0) {
            $error = true;
            $error_fields .= $field . ', ';
        }
    }

    if ($error) {
        // Required field(s) are missing or empty
        // echo error json and stop the app
        $response = array();
        $app = \Slim\Slim::getInstance();
        $response["error"] = true;
        $response["message"] = 'Required field(s) ' . substr($error_fields, 0, -2) . ' is missing or empty';
        echoResponse(400, $response);
        $app->stop();
    }
}

/**
 * Validating email address
 */
function validateEmail($email) {
    $app = \Slim\Slim::getInstance();
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $response["error"] = true;
        $response["message"] = 'Email address is not valid';
        echoResponse(400, $response);
        $app->stop();
    }
}

/**
 * Validate provider name
 */
function validateProviderName($providerName) {
    $app = \Slim\Slim::getInstance();
    if($providerName !== PROVIDER_FACEBOOK && $providerName !== PROVIDER_GOOGLE) {
        $response["error"] = true;
        $response["message"] = "Invalid provider name, values: "
            . PROVIDER_FACEBOOK . " and "
            . PROVIDER_GOOGLE . " are only allowed";
        echoResponse(400, $response);
        $app->stop();
    }
}

/**
 * echoing user details
 */
function getUserDetails($db, $email) {
    $response = array();
    $user = $db->getUserByEmail($email);

    if ($user != NULL) {
        $response["error"] = false;
        $response['name'] = $user['name'];
        $response['email'] = $user['email'];
        $response['apiKey'] = $user['api_key'];
        $response['createdAt'] = $user['created_at'];
    } else {
        // unknown error occurred
        $response['error'] = true;
        $response['message'] = "An error occurred. Please try again";
    }

    return $response;
}

/**
 * Echoing json response to client
 * @param String $status_code Http response code
 * @param String $response Json response
 */
function echoResponse($status_code, $response) {
    $app = \Slim\Slim::getInstance();
    // Http response code
    $app->status($status_code);

    // setting response content type to json
    $app->contentType('application/json');

    echo json_encode($response);
    $app->stop();
}

$app->run();
?>