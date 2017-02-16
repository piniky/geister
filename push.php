<?php
  
  require('Pusher.php');

  $options = array(
    'cluster' => 'ap1',
    'encrypted' => true
  );
  $pusher = new Pusher(
    'APP_KEY',
    'APP_SECRET',
    'APP_ID',
    $options
  );
  $json_string = file_get_contents('php://input');
  $json_string = stripslashes($json_string);
  $obj = json_decode($json_string, true);
  

  $pusher->trigger('geister-'.$obj["room"], $obj["action"], $json_string);
?>