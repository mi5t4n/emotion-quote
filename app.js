var index = 0;
var interval;

jQuery(document).ready(function(e){

  Webcam.attach('#camera_video');

});

jQuery("#btn_snap").click(function(e){
  interval = setInterval(take_snapshot, 1000);
});

function take_snapshot(){
  var max_time = jQuery("#selfie_interval option:selected").val();
  ++index;
  if (index > max_time) {
    closeInterval(interval);

    Webcam.snap(function(data_uri){
      jQuery("#camera_picture").html( '<img src="' + data_uri + '"/>' );
      processImage(data_uri);
    });
  }

  jQuery("#interval_show").html(index);

  
}

function processImage(data_uri) {
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

    // Request headers.
    beforeSend: function(xhrObj){
      xhrObj.setRequestHeader("Content-Type","application/json");
      xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", subscriptionKey);
    },

    type: "POST",

    // Request body.
    data: '{"url": ' + '"' + data_uri + '"}',
  }).done(function(data){
    console.log(data);
  }).fail(function(jqXHR, textStatus, errorThrown){

  });
}