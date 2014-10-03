<?php
require_once('./config.php');
require_once('../../bower_components/phpviddler/phpviddler.php');

$v = new Viddler_V2(VIDDLER_API_KEY);
$auth = $v->viddler_users_auth(array('user' => VIDDLER_USERNAME, 'password' => VIDDLER_PASSWORD));

if($_GET['action'] == 'prepareUpload') {
  $params = array('sessionid' => $auth['auth']['sessionid']);
  $response = $v->viddler_videos_prepareUpload($params);
  header('Content-Type: application/json');
  echo json_encode($response);
}
?>