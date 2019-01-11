var seconds = 0;
var intervalId;
var size = { width: 0, height: 0};

jQuery(document).ready(function(e){

  // Attach an event listener when the file upload changes.
  document.getElementById('image_upload').addEventListener('change', readFile, false);

  // Attach an event listener when the tab changes.
  $('#face-tab').on('show.bs.tab', function(e){
    console.log(e.target);
  });

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
    imageObj.onload = function() {
      context.drawImage(this, 0, 0);

       // Get the image blob.
      canvas.toBlob(function(image_blob){
        sendImage(image_blob);
      }, 'image/jpeg', 1.0);
    }
    imageObj.src = data_uri;
  });

}

function sendImage(image_blob) {
  // Load the loading bar
  jQuery("#loading-bar").css('visibility', 'visible');

  var subscriptionKey = "40a3892f4415413ea7e7a1526177fec5";
  
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

  }).done(function(faces){
    console.log(faces);

    // Hide the loading bar
    jQuery("#loading-bar").css('visibility', 'hidden');

    // Numer of faces detected.
    var numer_of_faces = faces.length;

    if (numer_of_faces == 0) {
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

      // Clear the tab
      jQuery("#face-tab").html('');
      // Clear the tab content.
      jQuery("#face-tab-content").html('');

      for(index = 0; index < numer_of_faces; index++) {
        drawRectangleAroundFace(faces[index], index);
        addFaceAttributes(faces[index], index);        
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
    jQuery("#loading-bar").css('visibility', 'hidden');
  });
  
}

// Load canvas with data URI
function loadCanvasWithDataURI(dataURI) {

  var canvas = document.getElementById('camera_canvas');
  var context = canvas.getContext('2d');
  
  // Clear the canvas
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

function drawRectangleAroundFace(face, index){
  // Get the face rectangle.
  x = face.faceRectangle.left;
  y = face.faceRectangle.top;
  width = face.faceRectangle.width;
  height = face.faceRectangle.height;      

  // Scaling down the face coordinates to the size of the canvas.
  scalingFactorX = 640.0/size.width;
  scalingFactorY = 480.0/size.height;
  x = parseInt(x * scalingFactorX);
  y = parseInt( y * scalingFactorY);
  width = parseInt(width * scalingFactorX);
  height = parseInt(height * scalingFactorY);

  // Create a small rectagle to place the number.
  nX = x;
  nY = y;
  nWidth = 30;
  nHeight = 30;

  // Get the canvas.
  var canvas = document.getElementById('camera_canvas');
  var context = canvas.getContext('2d');

  // Draw rectangle around face.
  context.rect(x, y, width, height);
  context.lineWidth = "4";
  context.strokeStyle = "green";
  context.stroke();

  // Draw rectangle to store number.
  context.rect(nX, nY, nWidth, nHeight);
  context.lineWidth = "4";
  context.strokeStyle = "green";
  context.stroke();

  // Draw number to the number rectangle
  context.font = "bold 24px Arial";
  context.fillStyle = 'yellow';
  context.fillText(index, nX + nWidth*.25, nY + nHeight*0.75);
}

function addFaceAttributes(face, index) {

  // Get the smile, gender and age.
  var age = face.faceAttributes.age;
  var gender = face.faceAttributes.gender;
  var smile = face.faceAttributes.smile;
  smile = Number(smile * 100).toFixed(2);

  // Convert the emotion object to array
  var emotions = Object.entries(face.faceAttributes.emotion);
  var emotions_arr = []
  for ( const [emotionType, emotionValue] of emotions ) {
    _emotionValue = Number(emotionValue * 100).toFixed(2);
    emotions_arr[emotionType] = _emotionValue;
  }

  // Get the accessories.
  try {
    var accessories = face.faceAttributes.accessories;
    var accessories_output = '';
    accessories.forEach(function(elem, index, arr){
      type = elem.type;
      confidence = Number(elem.confidence * 100).toFixed(2);
      accessories_output += type + '(' + confidence + '%), '
    });
    accessories_output = accessories_output.slice(0, -2);
  } catch(err) {
    accessories_output = 'N/A';
  }

  // Construct the tab
  output = '<li class="nav-item">';
  output += '<a class="nav-link'+ ( (index == 0) ? ' active': '' ) + '" id="face' + index +'-tab" data-toggle="tab" href="#face' + index + '" role="tab" aria-controls="face' + index + '" aria-selected="true">Face ' + index +'</a>';
  output += '</li>';

  // Append the tab
  jQuery("#face-tab").append(output);

  // Construct the tab content.
  output = '<div class="tab-pane fade show' + ( (index == 0) ? ' active': '' ) + '" id="face' + index +'" role="tabpanel" aria-labelledby="face' + index +'-tab">';
  output += '<ul class="list-group list-group-flush">';
  output += '<li class="list-group-item">';
  output += 'Gender: ' + capitalize(gender);
  output += '</li>';
  output += '<li class="list-group-item">';
  output += 'Age : ' + age;
  output += '</li>';
  output += '<li class="list-group-item">';
  output += 'Accessories : ' + capitalize(accessories_output);
  output += '</li>';
  output += '<li class="list-group-item">';
  output += 'Smile : ' + smile + '%';
  output += '</li>';
  output += '<li class="list-group-item">';
  output += 'Angry(😡) : ' + emotions_arr['anger'] + '% | Contempt(😶) : ' + emotions_arr['contempt'] +'% | Disgust(🤢) : ' + emotions_arr['disgust'] +'% | Fear(😨) : ' + emotions_arr['fear'] + '%';
  output += '</li>';
  output += '<li class="list-group-item">';
  output += 'Happiness(😂) : ' + emotions_arr['happiness'] + '% | Neutral(😑) : ' + emotions_arr['neutral'] +'% | Sadness(😢) : ' + emotions_arr['sadness'] +'% | Surprise(😲) : ' + emotions_arr['surprise'] + '%';
  output += '</li>';
  output += '</div>';

  // Add the face tab content.
  jQuery("#face-tab-content").append(output);

}

function capitalize(s){
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1);
}