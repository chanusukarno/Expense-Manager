<?php

/**
 * Class to handle all db operations
 * This class will have CRUD methods for database tables
 *
 * @author Ravi Tamada
 * @link URL Tutorial link
 */
class DbHandler
{

    private $conn;

    function __construct()
    {
        require_once dirname(__FILE__) . '/DbConnect.php';
        // opening db connection
        $db = new DbConnect();
        $this->conn = $db->connect();
    }

    /* ------------- `users` table method ------------------ */

    /**
     * Creating new user
     * @param String $name User full name
     * @param String $email User login email id
     * @param String $password User login password
     */
    public function createUser($email, $password)
    {
        require_once 'PassHash.php';
        $response = array();

        // First check if user already existed in db
        if (!$this->isUserExists($email)) {
            // Generating password hash
            $password_hash = PassHash::hash($password);

            // Generating API key
            $api_key = $this->generateApiKey();

            // insert query
            $stmt = $this->conn->prepare("INSERT INTO users(email, password_hash, api_key, status) values(?, ?, ?, 1)");
            $stmt->bind_param("sss", $email, $password_hash, $api_key);

            $result = $stmt->execute();

            $stmt->close();

            // Check for successful insertion
            if ($result) {
                // User successfully inserted
                return USER_CREATED_SUCCESSFULLY;
            } else {
                // Failed to create user
                return USER_CREATE_FAILED;
            }
        } else {
            // User with same email already existed in the db
            return USER_ALREADY_EXISTED;
        }

        return $response;
    }

    /**
     * Checking user login
     * @param String $email User login email id
     * @param String $password User login password
     * @return boolean User login status success/fail
     */
    public function checkLogin($email, $password)
    {
        // fetching user by email
        $stmt = $this->conn->prepare("SELECT password_hash FROM users WHERE email = ?");

        $stmt->bind_param("s", $email);

        $stmt->execute();

        $stmt->bind_result($password_hash);

        $stmt->store_result();

        if ($stmt->num_rows > 0) {
            // Found user with the email
            // Now verify the password

            $stmt->fetch();

            $stmt->close();

            if (PassHash::check_password($password_hash, $password)) {
                // User password is correct
                return TRUE;
            } else {
                // user password is incorrect
                return FALSE;
            }
        } else {
            $stmt->close();

            // user not existed with the email
            return FALSE;
        }
    }

    /**
     * Checking user email
     * @param String $email User login email id
     * @param String $password User login password
     * @return boolean User login status success/fail
     */
    public function checkEmail($email)
    {
        // fetching user by email
        $stmt = $this->conn->prepare("SELECT * FROM users WHERE email = ?");

        $stmt->bind_param("s", $email);
        $stmt->execute();
        $stmt->store_result();
        if ($stmt->num_rows > 0) {
            // user exists with email
            $stmt->close();
            return TRUE;
        } else {
            // user not exist with email
            $stmt->close();
            return FALSE;
        }
    }

    /*
     * createAuthProvider
     * @param
     */
    public function createAuthProvider($providerKey, $providerName, $userId)
    {
        require_once 'PassHash.php';
        // insert query
        $stmt = $this->conn->prepare("INSERT INTO auth_provider(provider_key, provider_name, user_id) values(?, ?, ?)");
        $stmt->bind_param("sss", $providerKey, $providerName, $userId);

        $result = $stmt->execute();

        $stmt->close();

        // Check for successful insertion
        return $result ? TRUE : FALSE;

        return NULL;
    }

    /**
     * Checking for duplicate user by email address
     * @param String $email email to check in db
     * @return boolean
     */
    private function isUserExists($email)
    {
        $stmt = $this->conn->prepare("SELECT id from users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $stmt->store_result();
        $num_rows = $stmt->num_rows;
        $stmt->close();
        return $num_rows > 0;
    }

    /**
     * Fetching user by email
     * @param String $email User email id
     */
    public function getUserByEmail($email)
    {
        $stmt = $this->conn->prepare("SELECT email, api_key, status, created_at FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        if ($stmt->execute()) {
            // $user = $stmt->get_result()->fetch_assoc();
            $stmt->bind_result($email, $api_key, $status, $created_at);
            $stmt->fetch();
            $user = array();
            $user["email"] = $email;
            $user["api_key"] = $api_key;
            $user["status"] = $status;
            $user["created_at"] = $created_at;
            $stmt->close();
            return $user;
        } else {
            return NULL;
        }
    }

    /**
     * Fetching user api key
     * @param String $user_id user id primary key in user table
     */
    public function getApiKeyById($user_id)
    {
        $stmt = $this->conn->prepare("SELECT api_key FROM users WHERE id = ?");
        $stmt->bind_param("i", $user_id);
        if ($stmt->execute()) {
            // $api_key = $stmt->get_result()->fetch_assoc();
            // TODO
            $stmt->bind_result($api_key);
            $stmt->close();
            return $api_key;
        } else {
            return NULL;
        }
    }

    /**
     * Fetching user id by api key
     * @param String $api_key user api key
     */
    public function getUserId($api_key)
    {
        $stmt = $this->conn->prepare("SELECT id FROM users WHERE api_key = ?");
        $stmt->bind_param("s", $api_key);
        if ($stmt->execute()) {
            $stmt->bind_result($user_id);
            $stmt->fetch();
            // TODO
            // $user_id = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            return $user_id;
        } else {
            return NULL;
        }
    }

    /**
     * Fetching user id
     * @param String $email in user table
     */
    public function getUserIdByEmail($email)
    {
        $stmt = $this->conn->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        if ($stmt->execute()) {
            $stmt->bind_result($userId);
            $stmt->fetch();
            // $api_key = $stmt->get_result()->fetch_assoc();
            // TODO
            $stmt->close();
            return $userId;
        } else {
            return NULL;
        }
    }

    /**
     * Fetching user api key
     * @param String $user_id user id primary key in user table
     */
    public function checkAuthProvider($user_id, $providerName)
    {
        $stmt = $this->conn->prepare("SELECT * FROM auth_provider WHERE user_id = ? AND provider_name = ?");
        $stmt->bind_param("is", $user_id, $providerName);
        $stmt->execute();
        $stmt->store_result();
        $num_rows = $stmt->num_rows;
        return $num_rows > 0 ? TRUE : FALSE;
    }

    /**
     * Validating user api key
     * If the api key is there in db, it is a valid key
     * @param String $api_key user api key
     * @return boolean
     */
    public function isValidApiKey($api_key)
    {
        $stmt = $this->conn->prepare("SELECT id from users WHERE api_key = ?");
        $stmt->bind_param("s", $api_key);
        $stmt->execute();
        $stmt->store_result();
        $num_rows = $stmt->num_rows;
        $stmt->close();
        return $num_rows > 0;
    }

    /**
     * Fetching profile id by user id
     * @param String $email in user table
     */
    public function getProfileIdByUserId($userId)
    {
        $stmt = $this->conn->prepare("SELECT profile_is FROM user_profiles WHERE user_id = ?");
        $stmt->bind_param("s", $userId);
        if ($stmt->execute()) {
            $stmt->bind_result($profileId);
            $stmt->fetch();
            // $api_key = $stmt->get_result()->fetch_assoc();
            // TODO
            $stmt->close();
            return $profileId;
        } else {
            return NULL;
        }
    }

    /**
     * Generating random Unique MD5 String for user Api key
     */
    private function generateApiKey()
    {
        return md5(uniqid(rand(), true));
    }

    /* ------------- 'profile' table methods ---------------- */

    /**
     * Creating new profile
     * @param String $userId user id to whom profile belongs to
     * @param String $requestParams
     */
    public function createProfile($userId, $requestParams) {
        $stmt = $this->conn->prepare("INSERT INTO profiles(name, country, phone, dob, gender) VALUES(?, ?, ?, ?, ?)");

        isset($requestParams['name']) ? $name = $requestParams['name'] : $name = '';
        isset($requestParams['country']) ? $country = $requestParams['country'] : $country = '';
        isset($requestParams['phone']) ? $phone = $requestParams['phone'] : $phone = '';
        isset($requestParams['dob']) ? $dob = $requestParams['dob'] : $dob = '';
        isset($requestParams['gender']) ? $gender = $requestParams['gender'] : $gender = '';

        $stmt->bind_param("sssss", $name, $country, $phone, $dob, $gender);
        $result = $stmt->execute();

        if ($result) {
            // profile row created
            // now assign the profile to user
            $profileId = $this->conn->insert_id;
            $res = $this->createUserProfile($userId, $profileId);
            if ($res) {
                //$stmt->close();
                // task created successfully
                return $profileId;
            } else {
                // task failed to create
                return NULL;
            }
        } else {
            // task failed to create
            return NULL;
        }
    }

    /**
     * Fetching user profile
     * @param String $user_id
     */
    public function getProfile($user_id, $profileId) {
        // $profileId = getProfileIdByUserId($user_id);
        $stmt = $this->conn->prepare("SELECT p.id, p.name, p.country, p.phone, p.dob, p.gender from profiles p, user_profiles up WHERE p.id = ? AND up.profile_id = p.id AND up.user_id = ?");
        $stmt->bind_param("ii", $profileId, $user_id);
        if ($stmt->execute()) {
            $res = array();
            $stmt->bind_result($id, $name, $country, $phone, $dob, $gender);
            $stmt->fetch();
            $res["id"] = $id;
            $res["name"] = $name;
            $res["country"] = $country;
            $res["phone"] = $phone;
            $res["dob"] = $dob;
            $res["gender"] = $gender;
            $stmt->close();
            return $res;
        } else {
            return NULL;
        }
    }

    /**
     * Update profile
     * @param String $userId
     * @param String $profile_id id of the profile
     * @param String $request_params
     */
    public function updateProfile($userId, $profileId, $request_params)
    {
        $stmt = $this->conn->prepare("UPDATE profiles p, user_profiles up set p.name = ?, p.country = ?, p.phone = ?, p.dob = ?, p.gender = ?   WHERE p.id = ? AND p.id = up.profile_id AND up.user_id = ?");
        $stmt->bind_param("sssssii", $request_params['name'], $request_params['country'], $request_params['phone'], $request_params['dob'], $request_params['gender'], $profileId, $userId);
        $stmt->execute();
        $num_affected_rows = $stmt->affected_rows;
        $stmt->close();
        return $num_affected_rows > 0;
    }

    /* ------------- `user_profiles` table method ------------------ */

    /**
     * Function to assign profile to user
     * @param String $user_id id of the user
     * @param String $profile_id id of the profile
     */
    public function createUserProfile($userId, $profileId) {
        $stmt = $this->conn->prepare("INSERT INTO user_profiles(user_id, profile_id) values(?, ?)");
        $stmt->bind_param("ii", $userId, $profileId);
        $result = $stmt->execute();

        if (false === $result) {
            die('execute() failed: ' . htmlspecialchars($stmt->error));
        }
        $stmt->close();
        return $result;
    }


    /* ------------- `tasks` table method ------------------ */

    /**
     * Creating new task
     * @param String $user_id user id to whom task belongs to
     * @param String $task task text
     */
    public function createTask($user_id, $task)
    {
        $stmt = $this->conn->prepare("INSERT INTO tasks(task) VALUES(?)");
        $stmt->bind_param("s", $task);
        $result = $stmt->execute();
        $stmt->close();

        if ($result) {
            // task row created
            // now assign the task to user
            $new_task_id = $this->conn->insert_id;
            $res = $this->createUserTask($user_id, $new_task_id);
            if ($res) {
                // task created successfully
                return $new_task_id;
            } else {
                // task failed to create
                return NULL;
            }
        } else {
            // task failed to create
            return NULL;
        }
    }

    /**
     * Fetching single task
     * @param String $task_id id of the task
     */
    public function getTask($task_id, $user_id)
    {
        $stmt = $this->conn->prepare("SELECT t.id, t.task, t.status, t.created_at from tasks t, user_tasks ut WHERE t.id = ? AND ut.task_id = t.id AND ut.user_id = ?");
        $stmt->bind_param("ii", $task_id, $user_id);
        if ($stmt->execute()) {
            $res = array();
            $stmt->bind_result($id, $task, $status, $created_at);
            // TODO
            // $task = $stmt->get_result()->fetch_assoc();
            $stmt->fetch();
            $res["id"] = $id;
            $res["task"] = $task;
            $res["status"] = $status;
            $res["created_at"] = $created_at;
            $stmt->close();
            return $res;
        } else {
            return NULL;
        }
    }

    /**
     * Fetching all user tasks
     * @param String $user_id id of the user
     */
    public function getAllUserTasks($user_id)
    {
        $stmt = $this->conn->prepare("SELECT t.* FROM tasks t, user_tasks ut WHERE t.id = ut.task_id AND ut.user_id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $tasks = $stmt->get_result();
        $stmt->close();
        return $tasks;
    }

    /**
     * Updating task
     * @param String $task_id id of the task
     * @param String $task task text
     * @param String $status task status
     */
    public function updateTask($user_id, $task_id, $task, $status)
    {
        $stmt = $this->conn->prepare("UPDATE tasks t, user_tasks ut set t.task = ?, t.status = ? WHERE t.id = ? AND t.id = ut.task_id AND ut.user_id = ?");
        $stmt->bind_param("siii", $task, $status, $task_id, $user_id);
        $stmt->execute();
        $num_affected_rows = $stmt->affected_rows;
        $stmt->close();
        return $num_affected_rows > 0;
    }

    /**
     * Deleting a task
     * @param String $task_id id of the task to delete
     */
    public function deleteTask($user_id, $task_id)
    {
        $stmt = $this->conn->prepare("DELETE t FROM tasks t, user_tasks ut WHERE t.id = ? AND ut.task_id = t.id AND ut.user_id = ?");
        $stmt->bind_param("ii", $task_id, $user_id);
        $stmt->execute();
        $num_affected_rows = $stmt->affected_rows;
        $stmt->close();
        return $num_affected_rows > 0;
    }

    /* ------------- `user_tasks` table method ------------------ */

    /**
     * Function to assign a task to user
     * @param String $user_id id of the user
     * @param String $task_id id of the task
     */
    public function createUserTask($user_id, $task_id)
    {
        $stmt = $this->conn->prepare("INSERT INTO user_tasks(user_id, task_id) values(?, ?)");
        $stmt->bind_param("ii", $user_id, $task_id);
        $result = $stmt->execute();

        if (false === $result) {
            die('execute() failed: ' . htmlspecialchars($stmt->error));
        }
        $stmt->close();
        return $result;
    }

}

?>
