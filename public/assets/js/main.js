var AQE = (function ( $ ) {
  "use strict";

  //
  // HOMEPAGE MAP
  //

  var map;

  function initialize() {

    // load feeds and then initialize map and add the markers
    if(local_feed_path){
      $.getJSON(local_feed_path, function(mapmarkers){

        var mapOptions = {
          zoom: 3,
          mapTypeId: google.maps.MapTypeId.TERRAIN,
          streetViewControl: false,
          scrollwheel: false
        };
        map = new google.maps.Map(document.getElementById('map_canvas'),
            mapOptions);
        handleNoGeolocation();
        
        // if on an egg's page, zoom in a little close to it
        if ( $(".dashboard-map").length && mapmarkers && mapmarkers.length ) {
          var dashpos = new google.maps.LatLng(mapmarkers[0].lat, mapmarkers[0].lng);
          map.setCenter(dashpos);
          map.setZoom(6);
        }
        // Try HTML5 geolocation
        else if(navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(position) {
            var pos = new google.maps.LatLng(position.coords.latitude,
                                              position.coords.longitude);

            map.setCenter(pos);
          });
        }

        // add eggs to map
        for ( var x = 0, len = mapmarkers.length; x < len; x++ ) {
          addMapMarker( mapmarkers[x].lat, mapmarkers[x].lng, mapmarkers[x].feed_id );
        }

        $("span#num_eggs").html(mapmarkers.length)
      })
    }

    // if on home page, load recently created and updated eggs
    if($(".home-map")){
      $.each(["recently_created_at","recently_retrieved_at"],function(i,order){
        $.getJSON("/"+order+".json", function(data){
          $.each(data, function(i,egg){
            $("#"+order).append("<li><a href='/egg/"+egg.id+"'>"+egg.title+"</a> is a "+egg.status+" "+egg.location_exposure+" egg that was created "+moment(egg.created).fromNow()+" and last updated "+moment(egg.updated).fromNow()+" </li>")
          })
        })
      })      
    }


  }

  function handleNoGeolocation() {
    var pos = new google.maps.LatLng(30,-20);
    map.setCenter(pos);
  }

  function addMapMarker(lat, lng, id) {
    var myLatlng = new google.maps.LatLng(lat, lng);
    var feed_id = id;
    var marker = new google.maps.Marker({
      position: myLatlng,
      map: map,
      icon: '/assets/img/egg-icon.png'
    });
    google.maps.event.addListener(marker, 'click', function() {
      var target = '/egg/'+ feed_id;
      if ( window.location.pathname != target ) {
        window.location.pathname = target;
        $(".map").next(".map-overlay").fadeIn(150);
      }
    });
  }

  if ( $(".home-map").length || $(".dashboard-map").length ) {
    google.maps.event.addDomListener(window, 'load', initialize);
  }

  //
  // LOCATION PICKER
  //

  var locpic = new GMapsLatLonPicker(),
      locpicker = $(".gllpLatlonPicker").first(),
      locsearch = $(".gllpSearchField").first(),
      locsaved = parseInt($(".location-saved").first().val()),
      geolocate = function () {
        navigator.geolocation.getCurrentPosition(function(position) {
          $(".gllpLatitude").val(position.coords.latitude);
          $(".gllpLongitude").val(position.coords.longitude);
          $(".gllpZoom").val(13);
          locpic.custom_redraw();
        });
      };

  if ( locpicker.length ) {

    locpic.init( locpicker );

    // search
    $(".gllpSearchField").keydown(function(event){
      if(event.keyCode == 13){
        locpic.performSearch( $(this).val(), false );
        event.preventDefault();
      }
    });

    // HTML5 geolocation
    if(!locsaved && navigator.geolocation) {
      geolocate();
    }
    if (navigator.geolocation) {
      $(".find-me").removeClass("hidden").on("click", function(event) {
        event.preventDefault();
        geolocate();
      });
    }

  }

  //
  // CLAIMING FIELD
  //

  $(".claiming-form").on( "submit" , function (event) {
    var $this   = $(this),
        $input  = $this.find(".claiming-input"),
        $error  = $(".claiming-error");

    if ( $input.val() === "" ) {
      event.preventDefault();
      $error.html("Please enter a serial number").removeClass("hidden");
    }
    else {
      $(".claiming-button").val("Adding ...").addClass("button-green button-loading");
    }
  });

  $(".claiming-input").blur( function (event) {
    $(".claiming-error").addClass("hidden");
  });

  //
  // FORM VALIDATION
  //

  $('.form-validation').on( "submit" , function (event) {
    var $this       = $(this),
        $required   = $this.find(".field-required [data-validate]"),
        $submit     = $this.find('.button[type="submit"]'),
        error       = false;

    if ( $required.length ) {
      var errorify = function ( $bro, msg ) {
            var $other = $bro.siblings(".bubble-error");

            if ( $bro.val() === "" ) {
              error = true;

              if ( !$other.length ) {
                $("<span></span>", { "class" : "bubble bubble-error", html : msg }).hide().insertAfter( $bro ).slideDown(150);
              }
              else if ( $other.html() === msg ) {
                $other.slideDown(150);
              }
            }
            else {
              if ( $other.length || $other.html() === msg ) {
                $other.slideUp(150);
              }
            }
          };

      $required.each( function () {
        var $el   = $(this);

        if ( $el.get(0).tagName.toLowerCase() === "input" ) {
          errorify( $el, "This field cannot be blank" );
        }
        else if ( $el.get(0).tagName.toLowerCase() === "select" ) {
          errorify( $el, "Please select one of the options" );
        }
      });
    }

    if ( error ) {
      event.preventDefault();
      $(".bubble-error").first().prev().focus();
    }
    else {
      // success
      $submit.val("Saving ...").addClass("button-green button-loading");
    }
  });

  //<span class="bubble bubble-error hiden">This field cannot be blank</span>

})( jQuery );

