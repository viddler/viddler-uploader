<?php
require_once('./config.php');
require_once('../../src/lib/phpviddler/phpviddler.php');

$v = new Viddler_V2(VIDDLER_API_KEY);
$auth = $v->viddler_users_auth(array('user' => VIDDLER_USERNAME, 'password' => VIDDLER_PASSWORD));

if($_GET['action'] == 'prepareUpload') {
  $params = array('sessionid' => $auth['auth']['sessionid']);
  if(VIDDLER_ALLOW_VIDEO_REPLACE) {
    $params['allow_replace'] = true;
  }
  $response = $v->viddler_videos_prepareUpload($params);
  header('Content-Type: application/json');

  //Bacause PHP library uses php responses
  $response['upload']['endpoint'] = str_replace('.php', '.json', $response['upload']['endpoint']);

  echo json_encode($response);
}
?>
