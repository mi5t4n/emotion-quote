var index = 0;
var interval;

jQuery(document).ready(function(e){

  Webcam.set({
    image_format: 'jpeg',
    jpeg_quality: 100,
    force_flash: false
});

  Webcam.attach('#camera_video');

});

jQuery("#btn_snap").click(function(e){
  take_snapshot();
});

function take_snapshot(){

  Webcam.snap(function(data_uri){
    jQuery("#camera_picture").html( '<img src="' + data_uri + '"/>' );
    loadCanvasWithDataURI(data_uri);
    sendImage();
  });

}

function sendImage() {
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

  var canvas = document.getElementById('camera_canvas');
  canvas.toBlob(function(blob){

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
      data: blob

    }).done(function(data){
      console.log(data);
      if (data.length == 0) {
        new Noty({
          theme: 'metroui',
          text: 'Unable to process the image. !!!',
          type: 'warning',
          layout: 'topCenter',
          timeout: 2000,
          animation: {
            open: 'animated bounceInRight', // Animate.css class names
            close: 'animated bounceOutRight' // Animate.css class names
          },
        }).show();
      } else {
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
            accessories_output += type + '(' + confidence + '), '
          });
          jQuery('#emo-accessories').html(accessories_output);
        } catch(err) {
          jQuery('#emo-accessories').html('N/A');
        }
  
        
      }
    }).fail(function(jqXHR, textStatus, errorThrown){
      //
    });
  }, 'image/jpeg', 1);
  
}

// Load canvas with data URI
function loadCanvasWithDataURI(dataURI) {

  var canvas = document.getElementById('camera_canvas');
  var context = canvas.getContext('2d');

  // load image from data URI
  var imageObj = new Image();
  imageObj.onload = function() {
    context.drawImage(this, 0, 0);
  };

  imageObj.src = dataURI;

}

// Convert data URI to Blob
dataURItoBlob = function(dataURI) {
  var array, binary, i;
  binary = atob(dataURI.split(",")[1]);
  array = [];
  i = 0;
  while (i < binary.length) {
    array.push(binary.charCodeAt(i));
    i++;
  }
  return new Blob([new Uint8Array(array)], {
    type: "image/jpeg"
  });
};