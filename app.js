var seconds = 0;
var intervalId;
var size = { width: 0, height: 0};

jQuery(document).ready(function(e){

  document.getElementById('image_upload').addEventListener('change', readFile, false);

  // Set the initial values for the Webcam.
  Webcam.set({
    width: 640,
    height: 480,
    dest_width: 1280,
    dest_height: 720,
    image_format: 'jpeg',
    jpeg_quality: 100,
    force_flash: false
  });

  // Attach the camera to the div.
  Webcam.attach('#camera_video');

});

jQuery("#btn_snap").click(function(e){
  var seconds = jQuery("#selfie_interval option:selected").val();

  if (seconds == 0) {
    take_snapshot();
  } else {
    interval = setInterval(function() {
      if (seconds >= 0) {
        jQuery('.centered').html(seconds);
      }
      --seconds;
      if (-2 == seconds) {
        clearInterval(interval);
        take_snapshot();
        jQuery('.centered').html("");
      }
    }, 1000);
  }
});

function take_snapshot(){

  Webcam.snap(function(data_uri){
    // Load the canvas of 640x480 with data_uri
    loadCanvasWithDataURI(data_uri);

    // Load the temporary canvas of 1280x720 with data_uri 
    var canvas = document.getElementById("temp_canvas");
    var context = canvas.getContext('2d');
    var imageObj = new Image();
    imageObj.onload = function(){
      context.drawImage(this, 0, 0);
    }
    imageObj.src = data_uri;

    

    // Get the image blob.
    canvas.toBlob(function(image_blob){
      sendImage(image_blob);
    }, 'image/jpeg', 1.0);
  });

}

function sendImage(image_blob) {
  // Load the loading bar
  jQuery("#loading-bar").css('visibility', 'visible');

  // var subscriptionKey = "f343fcd01e184711a7fa7b188ed5759e";
  var subscriptionKey = "f343fcd01e184711a7fa7b188ed5759e";
  
  var uriBase = "https://westcentralus.api.cognitive.microsoft.com/face/v1.0/detect";

  // Request parameters.
  var params = {
  "returnFaceId": "true",
  "returnFaceLandmarks": "false",
  "returnFaceAttributes":
    "age,gender,headPose,smile,facialHair,glasses,emotion," +
    "hair,makeup,occlusion,accessories,blur,exposure,noise"
  };

  // Perform the REST API call.
  jQuery.ajax({
    url: uriBase + "?" + jQuery.param(params),
    type: "POST",
    cache: false,
    processData: false,
    contentType: 'application/octet-stream',

    // Request headers.
    beforeSend: function(xhrObj){
      xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", subscriptionKey);
    },

    // Request body.
    data: image_blob

  }).done(function(data){
    console.log(data);

    // Hide the loading bar
    jQuery("#loading-bar").css('visibility', 'hidden');

    if (data.length == 0) {
      // Warning: Unable to process the image.
      new Noty({
        theme: 'metroui',
        text: 'Unable to process the image. !!!',
        type: 'warning',
        layout: 'topCenter',
        timeout: 1000,
        animation: {
          open: 'animated bounceInRight', // Animate.css class names
          close: 'animated bounceOutRight' // Animate.css class names
        },
      }).show();
    } else {
      // Success: Image is successfully processed.
      new Noty({
        theme: 'metroui',
        text: 'Image is successfully processed. ',
        type: 'success',
        layout: 'topCenter',
        timeout: 1000,
        animation: {
          open: 'animated bounceInRight', // Animate.css class names
          close: 'animated bounceOutRight' // Animate.css class names
        },
      }).show();

      // Get the face rectangle.
      x = data[0].faceRectangle.left;
      y = data[0].faceRectangle.top;
      width = data[0].faceRectangle.width;
      height = data[0].faceRectangle.height;      

      scalingFactorX = 640.0/size.width;
      scalingFactorY = 480.0/size.height;
      x = parseInt(x * scalingFactorX);
      y = parseInt( y * scalingFactorY);
      width = parseInt(width * scalingFactorX);
      height = parseInt(height * scalingFactorY);

      // Create a rectangle around face using the face rectangle
      var canvas = document.getElementById('camera_canvas');
      var context = canvas.getContext('2d');
      context.rect(x, y, width, height);
      context.lineWidth = "4";
      context.strokeStyle = "green";
      context.stroke();

      // Get the emotion value.
      // Convert the emotion object to array
      var emotions = Object.entries(data[0].faceAttributes.emotion);
      for ( const [emotionType, emotionValue] of emotions ) {
        _emotionValue = Number(emotionValue * 100).toFixed(2);
        jQuery("#emo-emotion-" + emotionType).html(_emotionValue + "%");
      }

      var gender = data[0].faceAttributes.gender;
      jQuery("#emo-gender").html(gender);
      var smile = data[0].faceAttributes.smile * 100;
      smile = Number(smile).toFixed(2) + "%";
      jQuery("#emo-smile").html(smile);
      var age = data[0].faceAttributes.age;
      jQuery("#emo-age").html(age);
      try {
        var accessories = data[0].faceAttributes.accessories;
        var accessories_output = '';
        accessories.forEach(function(elem, index, arr){
          type = elem.type;
          confidence = Number(elem.confidence * 100).toFixed(2);
          accessories_output += type + '(' + confidence + '%), '
        });
        accessories_output = accessories_output.slice(0, -2);
        jQuery('#emo-accessories').html(accessories_output);
      } catch(err) {
        jQuery('#emo-accessories').html('N/A');
      }
    }
  }).fail(function(jqXHR, textStatus, errorThrown){
    new Noty({
      theme: 'metroui',
      text: 'Error occcurred !!!',
      type: 'warning',
      layout: 'topCenter',
      timeout: 1000,
      animation: {
        open: 'animated bounceInRight', // Animate.css class names
        close: 'animated bounceOutRight' // Animate.css class names
      },
    }).show();
  });
  
}

// Load canvas with data URI
function loadCanvasWithDataURI(dataURI) {

  var canvas = document.getElementById('camera_canvas');
  var context = canvas.getContext('2d');
  
  // Clear the canvas
  // context.clearRect(0, 0, canvas.width, canvas.height);
  canvas.width = canvas.width;

  // Clear the previous face attributes values
  jQuery("#emo-gender").html("N/A");
  jQuery("#emo-smile").html("N/A");
  jQuery("#emo-age").html("N/A");
  jQuery("#emo-accessories").html("N/A");

  // load image from data URI
  var imageObj = new Image();
  imageObj.onload = function() {
    size.height = imageObj.height;
    size.width = imageObj.width;
    context.drawImage(this, 0, 0, 640, 480);
  };

  imageObj.src = dataURI;

}

function readFile(event){
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    // Get the first file.
    var file = event.target.files[0];

    if (file) {
      // Read the file as data URI.
      var reader = new FileReader();

      reader.onload = function(e) {
        console.log({result: e});
        loadCanvasWithDataURI(e.target.result);

      }
      reader.readAsDataURL(file);
      
      // Read the file as binary string
      var reader = new FileReader();
      reader.onload = function(e){
        var contents = e.target.result;
      }
      reader.readAsBinaryString(file);
      sendImage(file);
    }
  } else {
    new Noty({
      theme: 'metroui',
      text: 'Your browser doesn\'t support FileReader',
      type: 'warning',
      layout: 'topCenter',
      timeout: 1000,
      animation: {
        open: 'animated bounceInRight', // Animate.css class names
        close: 'animated bounceOutRight' // Animate.css class names
      },
    }).show();
  }
}