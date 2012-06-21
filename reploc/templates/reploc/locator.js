//<![CDATA[
var map, circle, circleRadius, centerMarker, geocoder;
var markers = [];
var blurbs = [];
var titles = [];
var C = 57.2958;
var ajax, dirTitle, directions, directionsPanel, dpJQ;
var refAdd, refRad, maxDist;
var btnFind, btnReset;
var locMatch;

// Things to do when the page is fully loaded
$(document).ready(function () {


    var siberia = new google.maps.LatLng(60, 105);
    // Make it easy to access page elements
    dirTitle = $('#directions-title');
    dpJQ = $('#location-directions');
    ajax = $('#ajax-progress');
    refAdd = $('#reference-address');
    refRad = $('#reference-radius');
    btnFind = $('#find-locations');
    btnReset = $('#reset-locations');
    locMatch = $('#location-matches');
    csrf_token = $('[name=csrfmiddlewaretoken]');

    directionsPanel = document.getElementById("location-directions");

    var myOptions = {
        zoom: 4,
        center: new google.maps.LatLng(39.232253,-95.273437), // USA-centric, right in the heartland
        mapTypeId: google.maps.MapTypeId.ROADMAP
    }
    map = new google.maps.Map(document.getElementById("representative-map"), myOptions);

    {% if REPLOC_USE_JS %}geocoder = new google.maps.Geocoder();{% endif %}

    directions = new google.maps.DirectionsService(map, directionsPanel);

    showAllLocations();

    refAdd.keypress(function (e) {
        if (e.which == 13) { findLocationsInRadius(); return false; }
    });
    btnFind.click(findLocationsInRadius);
    btnReset.click(resetMap);

    // Try W3C Geolocation (Preferred)
    if(navigator.geolocation) {
        browserSupportFlag = true;
        navigator.geolocation.getCurrentPosition(function(position) {
            refAdd.val(position.coords.latitude + ', ' + position.coords.longitude);
            myOptions.center = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
            map.setCenter(myOptions.center);
            map.setZoom(myOptions.zoom);
        }, function() {
            handleNoGeolocation(browserSupportFlag);
        });
        // Browser doesn't support Geolocation
    } else {
        browserSupportFlag = false;
        handleNoGeolocation(browserSupportFlag);
    }

    function handleNoGeolocation(errorFlag) {
        if (errorFlag == true) {
            alert("Geolocation service failed.");
        } else {
            alert("Your browser doesn't support geolocation. We've placed you in Siberia.");
            myOptions.center = siberia;
        }
        map.setCenter(myOptions.center);
    }

    function createMarker (point, number, loc) {
        // Add a marker overlay to the map and store various bits of info about it
        var marker = new google.maps.Marker({position: point, title: loc.representative});
        marker.value = number;

        // The only time we shouldn't have a representative is when it's the address
        // entered by the user
        if (loc.representative) {
            // Setup the blurb for the marker's info box
            var myHtml = '<h3 class="representative">' + loc.representative + '</h3>';
            myHtml += '<div>' + loc.street1 + '</div>';
            myHtml += '<div>' + loc.street2 + '</div>';
            myHtml += '<div>' + loc.city + ', ';
            myHtml += loc.state + ' ' + loc.postal_code + '</div>';

            // Only show the telephone number if it's available
            if (loc.telephone.length) {
                myHtml += '<div><strong>Tel.</strong>: ' + loc.telephone + '</div>';
            }

            // Only show the fax number if it's available
            if (loc.fax.length) {
                myHtml += '<div><strong>Fax</strong>: ' + loc.fax + '</div>';
            }

            // Only show the website if it's available
            if (loc.website.length) {
                myHtml += '<div><strong>WWW</strong>: ' + loc.website + '</div>';
            }

            // Only show the email if it's available
            if (loc.email.length) {
                myHtml += '<div><strong>E-mail</strong>: ' + loc.email + '</div>';
            }

            // Add a listener to pop up an info box when the mouse goes over a marker
            google.maps.event.addDomListener(marker, "mouseover", function() {
                new google.maps.InfoWindow({
                    position: point,
                    content: myHtml
                }).open(map);
            });

            // Keep track of the marker's data
            titles.push(loc.representative);
            markers.push(marker);
            blurbs.push(myHtml);
        }

        return marker;
    };

    function showAllLocations () {
        // Pull back all locations from the database and make markers for each one
        $.ajax({
            url : '{% url reploc-locations %}',
            type : 'POST',
            dataType : 'json',
            success : function (json) {
                for (var l = 0; l < json.locations.length; l++) {
                    var loc = json.locations[l];
                    var point = new google.maps.LatLng(loc.lat, loc.lng);
                    createMarker(point, l, loc).setMap(map);
                    //map.addOverlay(createMarker(point, l, loc));
                }
            }
        });
    };

    function findLocationsInRadius () {
        // Search all of the markers we have for points that are within the chosen
        // radius from the address entered by the user
        ajax.fadeIn('fast');

        // reset some elements
        dirTitle.text('');
        directionsPanel.innerHTML = '';

        locMatch.slideUp('fast');
        maxDist = parseInt(refRad.val());

        {% if REPLOC_USE_JS %}
            geocoder.geocode({
                address: refAdd.val()
            },
            function (point, status) {
                // Bail out if there was a problem on the server
                if (!point) { alert('Please enter a valid address'); ajax.fadeOut(); return; }

                if (centerMarker) {
                    centerMarker.setMap(null);
                }

                map.setCenter(point[0].geometry.location);
                map.setZoom(myOptions.zoom);
                if (centerMarker == null){
                    centerMarker = new google.maps.Marker({
                        map: map,
                    });
                }
                centerMarker.setPosition(point[0].geometry.location);
                doDrawCircle(centerMarker);

                // Only show markers that are within the specified radius
                var op = centerMarker.getPosition();
                var lat1 = op.lat();
                var lng1 = op.lng();
                var matches = [];

                // iterate over all markers to find the distance from the specified address
                for (var l = 0; l < markers.length; l++) {
                    var m = markers[l];
                    var mp = m.getPosition();
                    var lat2 = mp.lat();
                    var lng2 = mp.lng();

                    // Compute the distance between the input address and the marker
                    var dist = 0;
                    with (Math) {
                        // Source: http://www.meridianworlddata.com/Distance-Calculation.asp
                        dist = 3963.189 * acos(sin(lat1 / C) * sin(lat2 / C) + cos(lat1 / C) * cos(lat2 / C) * cos(lng2 / C - lng1 / C));
                    }
                    m.setMap(null);

                    if (dist <= maxDist) {
                        m.setMap(map);
                        matches.push(m);
                    }
                }

                filterLocations(matches);
            }
                            );
                            {% else %}
                                $.ajax({
                                    url : '{% url reploc-find-locations %}',
                                    type : 'POST',
                                    data : {'csrfmiddlewaretoken': csrf_token.val(),
                                        'address': refAdd.val(),
                                        'radius' : refRad.val()},
                                        dataType : 'json',
                                        error : function (xhr, status, err) {
                                            alert(err);
                                        },
                                        success : function (json) {
                                            // Bail out if there was a problem on the server
                                            if (json.error) { alert(json.error); ajax.fadeOut(); return; }

                                            if (centerMarker) {
                                                map.removeOverlay(centerMarker);
                                            }

                                            var matches = [];
                                            var point = new google.maps.LatLng(json.center.lat, json.center.lng);
                                            centerMarker = createMarker(point, 10000, json.center);
                                            map.addOverlay(centerMarker);
                                            doDrawCircle();

                                            // now run over all markers to find markers with the same lat/lng
                                            for (var l = 0; l < markers.length; l++) {
                                                var m = markers[l];
                                                var mp = m.getPosition();
                                                var lat = mp.lat;
                                                var lng = mp.lng;

                                                //m.hide();
                                                m.setMap(map);

                                                with (Math) {
                                                    for (var z = 0; z < json.locations.length; z++) {
                                                        var loc = json.locations[z];
                                                        if (loc.lat.toFixed(5) == lat.toFixed(5) &&
                                                            loc.lng.toFixed(5) == lng.toFixed(5)) {
                                                            m.show();
                                                        matches.push(m);
                                                        }
                                                    }
                                                }
                                            }
                                            filterLocations(matches);
                                        }
                                });
                                {% endif %}
    };

    function resetMap () {
        // Reset the map and overlays
        ajax.fadeIn();
        map.setZoom(4);
        map.panTo(centerMarker.getPosition());
        locMatch.slideUp('slow', function () { $(this).html(''); });
        circle.setMap(null)
        for (var m = 0; m < markers.length; m++) {
            var mkr = markers[m];
            if (mkr.getVisible()) { mkr.setMap(map); }
        }
        dirTitle.text('');
        directionsPanel.innerHTML = '';
        //directions.clear();
        ajax.fadeOut();
    };

    // Source: http://maps.forum.nu/gm_sensitive_circle2.html
    function doDrawCircle (centerMarker) {
        if (circle) {
            circle.setMap(null);
        }
        var center = centerMarker.getPosition();
        centerMarker.setMap(map);
        circleRadius = parseInt(refRad.val()) * 1609.344;
        circle = new google.maps.Circle({center: center, fillColor: '#051b2d',
                                        fillOpacity: 0.3, strokeColor: '#7688a0',
                                        strokeWeight: 2, strokeOpacity: 1, map: map,
                                        radius: circleRadius})
                                        var bounds = circle.getBounds();
                                        myOptions.zoom = 14;
                                        map.panTo(centerMarker.getPosition());
                                        map.fitBounds(bounds);
    };

    function filterLocations (matches) {
        // now list each of the matches
        var html = '<h4>Locations Found Within ' + maxDist + ' Miles of ' + refAdd.val() + '</h4>';
        if (matches.length <= 0) {
            html += '<p>No locations are within the area specified.</p>';
        } else {
            for (var m = 0; m < matches.length; m++) {
                marker = matches[m];
                html += '<div class="representative-location" id="dl' + marker.value + '">';
                html += blurbs[marker.value];
                html += '<div><a href="#representative-map" id="dda' + marker.value + '" class="get-directions">Driving directions</a></div>';
                html += '</div>';
            }
        }
        locMatch.html(html);

        // add a listener for when the user clicks on a match
        var locs = $('div.representative-location');
        locs.click(function () {
            document.location = '#representative-map';
            ajax.fadeIn();

            // Get the marker's value
            var num = parseInt($(this).attr('id').replace('dl', ''));
            marker = markers[num];
            map.setZoom(14);

            // show an info box for the marker
            infoBox = new google.maps.InfoWindow({
                content: blurbs[num],
                maps: map
            })
            map.panTo(marker.getPosition());

            // keep the chosen match highlighted
            $(this).siblings().removeClass('active');
            $(this).addClass('active');

            ajax.fadeOut();
        });

        locMatch.slideDown();

        // add an event handler for when the user wants to get driving directions
        var drvDirs = $('a.get-directions').click(function () {
            ajax.fadeIn();
            var directionsRenderer = new google.maps.DirectionsRenderer();
            directionsRenderer.setMap(map);
            directionsRenderer.setPanel(directionsPanel);

            directionsPanel.innerHTML = '';

            // Get the marker's value
            var num = parseInt($(this).attr('id').replace('dda', ''));
            marker = markers[num];
            var request = {
                origin: centerMarker.getPosition(),
                destination: marker.getPosition(),
                unitSystem: google.maps.DirectionsUnitSystem.IMPERIAL,
                travelMode: google.maps.TravelMode.DRIVING
            };
            directions.route(request, function(response, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    directionsRenderer.setDirections(response);
                } else {
                    alert('Error: ' + status);
                };
            });
            dirTitle.text('Driving Directions to ' + titles[num]);

            ajax.fadeOut();
        });

        // make all matches the same height, both for aesthetics and CSS sanity
        var maxHeight = 0;
        $.each(locs, function () {
            var h = $(this).height();
            if (h > maxHeight) { maxHeight = h; }
        });
        locs.height(maxHeight);

        ajax.fadeOut('slow');
    };

});

$(document).unload(google.maps.Unload);



//]]>
