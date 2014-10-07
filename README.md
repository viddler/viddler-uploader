Viddler HTML5 Uploader
======================

The uploader has 3 parts:
* `ViddlerVideoUploader` - this is the library interface where you can setup an uploader and add your own event listeners to decide how the interface should work
* `ViddlerVideoUploaderGui` - this takes a `ViddlerVideoUploader` as an initializer and builds an interface to show the video uploads with progress bars etc. If you use this, you will probably want to either include the css file (css/uploader.css) or copy and modify this for your needs.
* In order to be able to get upload tokens from the API without exposing your credentials, you will need to be able to call a server side script that will make the API call and return the details in a json format.

ViddlerVideoUploader
--------------------
### Initialization
To initialize an uploader call new ViddlerVideoUploader with a object of settings. The posible settings are:
  * `fileUploadButtonId` - The dom id of the button or link on the page that when clicked opens the file dialog
  * `buttonContainerId`  - The dom id of a container that the button is in. The library adds some content to this container
  * `dragDropPanelId` - The dom id of a container that will be used to handle drag and drop uploads
  * `apiEndPoint` - The endpoint of the webservice that will make API calls on the uploaders behalf

### Add event listeners
To add an event listener, call the `on` function of your uploader, the first parameter should be the event name, the second parameter should be a callback function that will be triggered when the event fires. See examples/library.html for an example. The possible events are:
* `select` - called when the user triggers a file upload. Arguments passed to the callback are:
  1. The file
* `uploadProgress` - called many times throughout the lifecylce of an upload to give details about the current status of the upload. This is the event you will use to get the percentage etc and can be used to calculate remaining time. Arguments passed to the callback are:
  1. An instance of the plupload uploader object (access total.bytesPerSec from this to get the current speed)
  2. The file (access percent from this to get the current percentage uploaded of this file)
* `successfulFileUpload` - called once the file had fully uploaded and has been added to the encoding queue. Arguments passed to the callback are
  1. The file
  2. The video object from the Viddler api. This will contain a video id which you can use within your application to reference the video on viddler.com
* `failedFileUpload` - called if the upload fails for any reason. Arguments passed to the callback are:
  1. The file
  2. An object for the response from the uploader. This will likely contain the reason for the failure


ViddlerVideoUploaderGui
-----------------------
To initializer the GUI. call new ViddlerVideoUploaderGui with an object which should contain:
* listingContainerId - The do id of the container where the Gui will show upload progress
* uploader - An instance of a ViddlerVideoUploader

### Additional event listeners
In addition to e ViddlerVideoUploader firing the events listed above. There will also be an additional possible event if you use the Gui. This is:
* `uploadCancelled` - called when the user clicks the cancel link in the gui. Arguments passed to the callback are:
  1. The file


Server Side Component
---------------------
The server side script should accept an `action` Parameter, which currently will only have a value of "prepareUpload". This script should then:

1. Authenticate with the API on your behalf
2. Call viddler.videos.prepareUpload to get the token details
3. Return that response in json format

A sample script that does this is in the server_components/php folder

Getting the demo running
------------------------
1. Copy server_components/php/config.php.sample to server_components/php/config.php and enter your credentials
2. Start a php server from the root folder `php -S localhost:8000` - All being well you should be able to request http://localhost:8000/server_components/php/index.php?action=prepareUpload and see details of an upload token from the api
3. Visit http://localhost:8000/examples/library.html to see an example of ViddlerVideoUploader being used with event listeners to show the status
4. Visit to see an example of ViddlerVideoUploaderGui being used along with the default css file for styling

Remote Demos
------------

* http://viddler-uploader-demo.herokuapp.com/examples/library.html
* http://viddler-uploader-demo.herokuapp.com/examples/gui.html

Dependencies
------------
jQuery is required to be available on the page used by the library
