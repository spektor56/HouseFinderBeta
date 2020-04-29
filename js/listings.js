angular.module("listingsApp", [])
    .controller("ListingsController",
        function($scope) {
            var listings = this;
            listings.houses = [];

            listings.getTotal = function() {
                return listings.houses.length;
            };

            $scope.totalTime = function(house) {
                return house.fromTravelTime + house.toTravelTime;
            };

            var locationPolygons = [];
            var houseMarkers = [];
            var intersectionPolygon = null;
            var cookieData = "";


            const platform = new H.service.Platform({
                apikey: "5Sb54Nw_2WiakiQ7nrGy0-EvJj3YafztmbAucJIR_D4"
            });















            const defaultLayers = platform.createDefaultLayers();
            const settings = {
                showPedestrian: false,
                weekday: 0,
                travelTime: 20,
                locationMarkerColor: "#fff",
                startLocation: "Cambridge, On"
            };
            var searchBox = $("#search-input").val(settings.startLocation);
            const searchButton = $("#search-btn");
            var locationMarker,
                map = new H.Map(
                    document.getElementById("map"),
                    defaultLayers.vector.normal.map,
                    {
                        zoom: 10,
                        center: { lng: -80.3, lat: 43.4 },
                    });
















            var geocoder = platform.getGeocodingService();
            const mapEvents = new H.mapevents.MapEvents(map);
            const behavior = new H.mapevents.Behavior(mapEvents);
            var enterpriseRouter = platform.getRoutingService();

            $("#clear-map").on("click",
                function() {
                    listings.houses = [];
                    locationPolygons = [];
                    houseMarkers = [];
                    intersectionPolygon = null;
                    cookieData = "";
                    map.removeObjects(map.getObjects());
                    $scope.$digest();
                });

            const searchCallback = function(observedManager, key, value) {
                if (value == "finished" && observedManager.locations[0]) {
                    if (locationMarker) {
                        map.removeLayer(locationMarker);
                    }
                    // Reset the start point of isoline routing by first result of geocode request
                    const start = observedManager.locations[0].displayPosition;
                    const location = L.latLng(start.latitude, start.longitude);

                    map.setView(location);

                    locationMarker = L.circle(location,
                        100,
                        {
                            fillOpacity: 0.7,
                            stroke: false
                        }).addTo(map);
                    $(locationMarker._container).attr("class", "location-marker");

                    setTimeout(function() {
                            $(locationMarker._container).fadeOut(400,
                                function() {
                                    map.removeLayer(locationMarker);
                                });
                        },
                        1600);
                } else if (value == "failed") {
                    alert("Search failed");
                }
            };

            function CalculateRouteOld(coord) {

                const enterpriseParam = {
                    mode: "fastest;car;traffic:enabled",
                    start: `geo!${coord.lat},${coord.lng}`,
                    time: `PT0H${$("#travel-time").val()}M`,
                    departure: "2015-04-22T08:30:00"
                };

                enterpriseRouter.calculateIsoline(enterpriseParam,
                    function(result) {
                        const center = new H.geo.Point(
                            result.Response.Center.Latitude,
                            result.Response.Center.Longitude);
                        const isolineCoords = result.Response.isolines[0].value;
                        var strip = new H.geo.LineString(),
                            isolinePolygon,
                            isolineCenter;
                        // Add the returned isoline coordinates to a strip:
                        isolineCoords.forEach(function(coords) {
                            strip.pushLatLngAlt.apply(strip, coords.split(","));
                        });

                        // Create a polygon and a marker representing the isoline:
                        isolinePolygon = new H.map.Polygon(strip);
                        isolineCenter = new H.map.Marker(center);

                        // Add the polygon and marker to the map:
                        //map.addObjects([isolineCenter, isolinePolygon]);
                        // Center and zoom the map so that the whole isoline polygon is
                        // in the viewport:
                        map.setViewBounds(isolinePolygon.getBounds());
                    },
                    function(error) { alert(error) });
            }

            function CalculateRoute(coord) {

                var callsCompleted = 0;
                var polygon1;
                var polygon2;

                const routingParams = {
                    xnlp: "CL_JSMv3.1.15.1",
                    apikey: "5Sb54Nw_2WiakiQ7nrGy0-EvJj3YafztmbAucJIR_D4",
                    mode: "fastest;car;traffic:enabled",
                    destination: `geo!${coord.lat},${coord.lng}`,
                    arrival: "2018-12-10T09:00:00",
                    range: $("#travel-time").val() * 60,
                    rangetype: "time",
                    resolution: 1,
                    maxpoints: 9000
                };

                const request1 = $.ajax({
                    url: "https://isoline.route.ls.hereapi.com/routing/7.2/calculateisoline.json",
                    type: "GET",
                    data: routingParams,
                    dataType: "json",
                    success: function(result) {
                        callsCompleted++;
                        const center = new H.geo.Point(
                            result.response.center.latitude,
                            result.response.center.longitude);
                        const isolineCoords = result.response.isoline[0].component[0].shape;
                        var strip = new H.geo.LineString(),
                            isolinePolygon,
                            isolineCenter;
                        // Add the returned isoline coordinates to a strip:
                        isolineCoords.forEach(function(coords) {
                            strip.pushLatLngAlt.apply(strip, coords.split(","));
                        });


                        const geometryFactory = new jsts.geom.GeometryFactory();

                        const coordinates = heremaps2JTS(isolineCoords);
                        const shell = geometryFactory.createLinearRing(coordinates);
                        polygon2 = geometryFactory.createPolygon(shell);


// Create a polygon and a marker representing the isoline:
                        isolinePolygon = new H.map.Polygon(strip);
                        isolinePolygon.setStyle({ fillColor: "rgba(255, 255, 0, 0.3)" });
                        isolineCenter = new H.map.Marker(center);

                        // Add the polygon and marker to the map:
                        //map.addObjects([isolineCenter, isolinePolygon]);


                        map.addObject(isolineCenter);
                        // Center and zoom the map so that the whole isoline polygon is
                        // in the viewport:
                    }
                });


                //PolygonPoints: "-80.30879851529878 43.37435493706406,-80.34759398649018 43.3956881508458,-80.29935713956635 43.42387140648347,-80.28322097013276 43.398058044503856,-80.30879851529878 43.37435493706406",
                //PolyZoomLevel: "13",

                const routingParams2 = {
                    xnlp: "CL_JSMv3.1.15.1",
                    apikey: "5Sb54Nw_2WiakiQ7nrGy0-EvJj3YafztmbAucJIR_D4",
                    mode: "fastest;car;traffic:enabled",
                    start: `geo!${coord.lat},${coord.lng}`,
                    range: $("#travel-time").val() * 60,
                    departure: "2018-12-10T18:00:00",
                    rangetype: "time",
                    resolution: 1,
                    maxpoints: 9000
                };

                const request2 = $.ajax({
                    url: "https://isoline.route.ls.hereapi.com/routing/7.2/calculateisoline.json",
                    type: "GET",
                    data: routingParams2,
                    dataType: "json",
                    success: function(result) {
                        const isolineCoords = result.response.isoline[0].component[0].shape;
                        var strip = new H.geo.LineString(),
                            isolinePolygon;
                        isolineCoords.forEach(function(coords) {
                            strip.pushLatLngAlt.apply(strip, coords.split(","));
                        });

                        const geometryFactory = new jsts.geom.GeometryFactory();
                        const coordinates = heremaps2JTS(isolineCoords);
                        const shell = geometryFactory.createLinearRing(coordinates);
                        polygon1 = geometryFactory.createPolygon(shell);

                        isolinePolygon = new H.map.Polygon(strip);
                        isolinePolygon.setStyle({ fillColor: "rgba(0, 0, 255, 0.3)" });
                        //map.addObject(isolinePolygon);

                    }
                });


                $.when(request1, request2).done(function() {
                    const intersection = polygon1.intersection(polygon2);
                    const coordinates = JTS2HereMaps(intersection.shell.points);
                    const isolinePolygon = new H.map.Polygon(coordinates);
                    isolinePolygon.setStyle({ fillColor: "rgba(0, 255, 0, 0.3)" });
                    //map.addObject(isolinePolygon);
                    locationPolygons.push(intersection);
                    if (locationPolygons.length > 0) {
                        var netIntersection = locationPolygons[0];
                        for (let i = 1; i < locationPolygons.length; i++) {
                            netIntersection = netIntersection.intersection(locationPolygons[i]);
                        }

                        const cords = JTS2HereMaps(netIntersection.shell.points);
                        var alatlng = [];
                        var latlng1 = [];
                        var count = 0;
                        cords.getLatLngAltArray().forEach(function(cord) {
                            if (count === 0) {
                                latlng1 = [];
                            };
                            count++;
                            if (count > 2) {
                                latlng1.reverse();
                                alatlng.push(latlng1.join(" "));
                                count = 0;
                                return;
                            }
                            latlng1.push(cord.toFixed(5));
                        });
                        alatlng.push(latlng1.join(" "));
                        if (intersectionPolygon != null) {
                            map.removeObject(intersectionPolygon);
                        };
                        const maxmin = netIntersection.computeEnvelopeInternal();
                        /*
                        const testData = {
                            CultureId: "1",
                            ApplicationId: "1",
                            RecordsPerPage: "200",
                            MaximumResults: "500",
                            PropertySearchTypeId: "1",
                            PriceMin: "400000",
                            PriceMax: "650000",
                            TransactionTypeId: "2",
                            StoreyRange: "0-0",
                            BuildingTypeId: "1",
                            ConstructionStyleId: "3",
                            BedRange: "0-0",
                            BathRange: "0-0",
                            LongitudeMin: maxmin.miny,
                            LongitudeMax: maxmin.maxy,
                            LatitudeMin: maxmin.minx,
                            LatitudeMax: maxmin.maxx,
                            SortOrder: "A",
                            SortBy: "1",
                            viewState: "m",
                            Longitude: "-80.30859375",
                            Latitude: "43.4267692565918",
                            CurrentPage: "1",
                            PropertyTypeGroupID: "1",
                            Token: "D6TmfZprLI9Kv5JtoopAHzUHfwWDp6bOL5W1uvQf4rc=",
                            GUID: "91b1646f-31da-42a7-ac4b-15982820f542",
                            Version: "6.0"
                        };
                        */
                        const testData = {
                            LatitudeMax: maxmin.maxx,
                            LongitudeMax: maxmin.maxy,
                            LatitudeMin: maxmin.minx,
                            LongitudeMin: maxmin.miny,
                            CurrentPage: "1",
                            PropertyTypeGroupID: "1",
                            PropertySearchTypeId: "1",
                            TransactionTypeId: "2",
                            PriceMin: "600000",
                            PriceMax: "800000",
                            BedRange: "0-0",
                            BathRange: "0-0",
                            BuildingTypeId: "1",
                            ConstructionStyleId: "3",
                            RecordsPerPage: "200",
                            ApplicationId: "1",
                            CultureId: "1",
                            Version: "7.0"
                        };

                        if (houseMarkers.length > 0) {
                            map.removeObjects(houseMarkers);
                            houseMarkers = [];
                        }


                        $.ajax({
                            url: "https://api-pr.realtor.ca/Listing.svc/PropertySearch_Post",
                            type: "POST",
                            data: testData,
                            dataType: "json",
                            success: function(result) {
                                const iconSize = new H.math.Size(32, 32);
                                var icon = new H.map.Icon(
                                    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxNy4wLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xIFRpbnkvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEtdGlueS5kdGQiPg0KPHN2ZyB2ZXJzaW9uPSIxLjEiIGJhc2VQcm9maWxlPSJ0aW55IiBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayINCgkgeD0iMHB4IiB5PSIwcHgiIHdpZHRoPSI1MDBweCIgaGVpZ2h0PSI1MDBweCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPGc+DQoJPGc+DQoJCTxnPg0KCQkJPHBvbHlnb24gaWQ9IlNWR0lEXzlfIiBmaWxsPSIjOTdDMzBBIiBwb2ludHM9IjI0OS4xNzUsOS4yNTUgNDAuNzQ5LDEyOC45NzkgNDAuMjE5LDM2OS4zNTEgMjQ4LjEyMiw0ODkuOTkgNDU2LjU0OSwzNzAuMjYyIA0KCQkJCTQ1Ny4wNzksMTI5Ljg5NCAJCQkiLz4NCgkJPC9nPg0KCQk8Zz4NCgkJCTxnPg0KCQkJCQ0KCQkJCQk8aW1hZ2Ugd2lkdGg9IjQ5MiIgaGVpZ2h0PSI1NzAiIHhsaW5rOmhyZWY9ImRhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBZXdBQUFJNkNBWUFBQURscFh2UEFBQUFDWEJJV1hNQUFBc1NBQUFMRWdIUzNYNzhBQUFBCkdYUkZXSFJUYjJaMGQyRnlaUUJCWkc5aVpTQkpiV0ZuWlZKbFlXUjVjY2xsUEFBQUN6WkpSRUZVZU5yczNjRnQyMEFVUlZHWjNLczUKZCtKQzFJbWFjd015dFBOR0FHMXlSdjk5bmdOa0d3U1RpSmR2bkRqckJRQW9iM1VFQUNEWUFJQmdBNEJnQXdDQ0RRQUlOZ0FJTmdBZwoyQUNBWUFPQVlBTUFnZzBBZ2cwQUNEWUFJTmdBSU5nQWdHQURBSUlOQUlJTkFBZzJBQ0RZQUNEWUFJQmdBNEJnQXdDQ0RRQUlOZ0FJCk5nQWcyQUNBWUFPQVlBTUFnZzBBZ2cwQUNEWUFJTmdBSU5nQWdHQURBSUlOQUlJTkFBZzJBQ0RZQUNEWUFJQmdBNEJnQXdDQ0RRQUkKTmdBSU5nQWcyQUNBWUFPQVlBTUFnZzBBZ2cwQUNEWUFJTmdBSU5nQWdHQURBSUlOQUlJTkFBZzJBQ0RZQUNEWUFJQmdBNEJnQXdDQwpEUUFJTmdBSU5nQWcyQUNBWUFPQVlBTUFnZzBBZ2cwQUNEWUFJTmdBSU5nQWdHQURBSUlOQUlJTkFBZzJBQ0RZQUNEWUFJQmdBNEJnCkF3Q0NEUUFJTmdBSU5nQWcyQUNBWUFPQVlBTUFnZzBBZ2cwQUNEWUFJTmdBSU5nQWdHQURBSUlOQUlJTkFBZzJBQ0RZQUNEWUFJQmcKQTRCZ0F3Q0NEUUFJTmdBSU5nQWcyQUNBWUFPQVlBTUFnZzBBZ2cwQUNEWUFJTmdBSU5nQWdHQURBSUlOQUlJTkFBZzJBQ0RZQUFBMApkN3RmSDg4ZlRnS1lZWEVFc0QvY1RnRVk3Y01Sd0RHUi92cjg5bmtDQkJzU0ZyVm9BNElOeFdNdDJvQmdRMGlzUlJzUWJBaUp0V2dECmdnMGhzUlp0UUxBaEpOYWlEUnpKdjhPR2dPZ0RlUE9IU2FHMXRBSEJocEJWTE5xQVlFUHhXSXMyc0lldlljUEVXQU5ZMkJBVWF5c2IKRUd3SVdkYWlEUWcyRkkrMWFBTi81V3ZZbElubUdiOSs3R3ZtZ0dBallDSEJGRzFnQzlkeGxJejBqS3ZpYXFGMFBRNElOcEdMZW1UQQpxcTVhMFFaZWNTVk9aTXc3eHJyNnJ3MndzQkhrYWFzekpZaVdObUJoYzlxbG5iUmVMVzNBd2lZMlNIdFdaMm9BTFczQXdpWnVQZnAzCjJvQmdRK09BcFVkUHRJRW4xMjFFeG1mclZYR24yTGtlQndzYldvYS8yeksxdE1IQ2h0amd2RnFkbmVObWFZT0ZEUzFlQXJvdlVVc2IKQkJzaUkvUDc1eFl6b0N0WGExaUVvVnlOZzRVTmVCRUNMR3hFQlVzYnNMREJTeEZnWVlPUVdOcUFoUTE0UVFJc2JNVEQwZ1lFRzhSYQp0SUZoWEltRGx5YkF3a1lvc0xRQkN4dndBZ1VXTm9pRHBRMVkySUNYS2NEQ1JoQ3d0RUd3UWF4Rkc1aktsVGg0d1FJc2JEejhzYlFCCkN4c0FMR3l3cnExc3dNSUd2SFFCRmpZZTlGamFJTmlJTmFJTlRPVktIUEFpQmhZMkh1cFkyb0NGRFhncEF3c2JQTWd0YlVDd0VXMUUKR3hCc1JCdlJCc0ZHdEVWYnRBSEJSclFSYlVDd0VXMUVHd1FiMFVhMEFjRkd0QkZ0RUd3UWJVUWJCQnZSUnJTQmYvS3RTUkZyQUFzYgpzY2JLQmdRYnNVYTBRYkJCckJGdEVHekVHdEVHQkJ1eFJyUkJzQkZyRUcwUWJNUWEwUVlFRzdGR3RFR3dFV3NRYlJCc3hCclJCc0VHCnNVYTBRYkFSYTBUYk13Y0VHN0ZHdEVHd0VXc1FiUkJzeEJyUkJnUWJvVWEwUWJBUmF4QnRHRzF4QkdMdEZBQXNiTVFhckd3UWJNUWEKMFFiQlJxeEJ0RUd3RVdzUWJSQnN4QnJSQnNGR3JFRzBRYkFSYXhCdEVHeXhCdEVHd1Vhc1FiUkJzQkZyUkJzRUc3RUcwUWJCUnF4Qgp0RUd3eFZxc0VXMFFiTVFhUkJzRUc3RUcwUWJCRm1zUWJSQnN4QnBFR3daYkhJRllBMkJoSTlaZ1pZTmdpelVnMmdnMllnMmlEWUtOCldJTndnMkNMTllpMmFDUFlpRFdJTmdnMllnMmlEWUl0MWlEYUlOaUlOWWcyQ0xaWUE2S05ZQ1BXSU5vZzJJZzFpRFlJdGxnRG9vMWcKSTlRZzJpRFlZZzJJTmdpMldBT2lqV0FqMWlEYUlOaGlEUWczK0VNcDFvQm9JOWlJTllnMkNMWllBNktOWUNQV2dHZ2oyR0lOaURZSQp0bGdEb28xZ0k5WWcyaURZWWcySU5naTJXQU9paldDTE5TRGFJTmhpRFlnMmdvMVlBNktOWUlzMUlOd2cyR0lOaURhQ2pWZ0RvbzFnCml6VWcyaURZWWcySU5vSXQxZ0NpaldDTE5TRGFJTmhpRFlnMkNSWkhBR0FBWUdIN2tBRlkyZ2kyYUFPaWpXQWoyb0JvSTlpaURZaTIKVTBDd1JSc1FiUVJidEowQ0lOb0l0bWdEb2cyQ0xkcUFhQ1BZb2cwZzJnaTJhQU9paldBajJvQm9JOWlpRFNEYUNMWm9BNktOWUNQYQpnR2dqMktJTklOb0l0bWdEb28xZ0k5cUFhQ1BZb2cwZzJ2aE5GMjFBdEJGc1JCc1FiUVJidEFIUjlod1hiRVFiRUcycVdCd0JnQkdBCmhZMFBGbUJwSTlnQ0RTRGFnbzFBQTZLTllJczBnR2l6bGI5MEJtQklZR0g3Y0FCWTJnaTJhQU9JdG1BajJvQm9JOWlpRFNEYUNMWm8KQTRpMllDUGFnR2dqMktJTklOb0l0bWdEaUxaZ0k5cUFhQ1BZb2cwZzJvS05hQU9paldBajJvQm9JOWlpRFNEYWdvMW9BNktOWUlzMgpnR2dqMktJTklOcUNqV2dEb28xZ2l6YUFhQ1BZb2cwZzJvS05hQU9paldDTE5vQm9DemFpRFNEYWdvMW9BNktOWUlzMmdHZ0xOcUlOCklOcUNqV2dEb28xZ2l6YUFhQXMyb2cySU5vS05hQU9pTGRpSU5vQm9DemFpRFlnMmdpM2FBS0l0MklnMmdHZ0xOcUlOaURhQ0xkb0EKb2kzWWlEYUFhQXMyb2cySU5wZkw0Z2dBTUNZc2JId2dBQ3h0Q3hzQXcwS3dBVUMwaTNBbDRRTUE4RmF1eHkxc0FCQnNyR3NBQkJzQQpFR3dBRUd6ZXdIVTRnR0FEQUlJTkFBajJDYmdPQnhCc0FFQ3dPWUx2RWdRZzJJZzJBSUtOYUFNZzJLSU5nR0FqMmdBSU5xSU5nR0NMCk5nQ0NqV2dESU5pSU5vQmdJOW9BQ0RhaURZQmdJOW9BZ28xb0F5RFlpRFlBZ28xb0F3ZzJvZzJBWUNQYUFJSU5vZzBnMklnMkFJS04KYUFNSU5xSU5nR0FqMmdBSU5xSU5JTmlJTmdEVGVCaXp5ZTErZlRnRndDZ1FiRVFiRUdvRUc5RUd4RnF3RVcwQW9SWnNSQnNRYWh3aQpvZzBJdFdBajJvQllJOWlJTmlEVWdnMmlEUWkxWUNQYWdGQWoySWcySU5hQ0RhSU5RbzFnSTlxQVVDUFlpRFlnMW9JTm9nMUNqV0FqCjJvQlFDemFJTmdpMVV4QnNSRnUwUWF3UmJFUWJFR3JCQnRFR29VYXdFVzFBcUJGc1JCc1FhOEVHMFFhaFJyQVJiVUNvRVd4RUc0UWEKd1FiUkJyRkdzQkZ0UUtnRkcwUWJoQnJCQnRFR29VYXdFVzBRYXdRYlJCdUVHc0VHMFFhaFJyQVJiUkJxQkJ0RUc4UWF3VWEwUlJ1aApSckJCdEVHb0VXd1FiUkJxQkJ2UkJyRkdzRUcwUWFnUmJCQnRoQm9FRzlFR3NVYXdRYlJCcUJGc0VHMkVHZ1FiMFFhaFJyQkJ0QkZyCkVHd1FiWVFhd1FiUkJxRkdzRUcwRVdvUWJCQnR4QnJCQnRGR3FFR3dRYlFSYWhCc1JGdTBFV29FRzBRYnNRYkJCdEZHcUJGc0VHMkUKR2dRYlJCdWhCc0VHMFVhc0VXd1FiWVFhQkJ0RUc2RUd3UWJSRm1yUE9nUWJSQnV4QnNFRzBVYW9RYkJCdElVYUJCdEVHNkVHd1FiUgpScXdSYkVDMGhSb0VHMFFib1FiQkJ0RVdhaEJzUUxURkdnUWJSQnVoQnNFRzBSWnFFR3dRYmNRYUJCdEVXNmhCc0FIUkZtb1FiQkJ0CmhCb0VHMFJickVHd0FkRVdhaEJzRUcyaEJnUWJSRnVvUWJBQjBSWnJFR3dRYmFFR0JCdEVXNmhCc0lHelJGdW9RYkJCdE1VYUVHd1EKYmFFR3dRWWFSbHVvUWJCQnRJVWFFR3dRYmJFR3dRWWFSbHVvUWJDQnd0RVdhaEJzb0hDMGhSb0VHeWdlYmJFR3dRWUtSMXVvUWJDQgp3dEVXYWhCc29IQzBoUm9FR3lnZWJiRUd3UVlLUjF1b1FiQ0J3dEVXYWhCc29IaTB4Um9FR3lnY2JhRUd3UVlLUjF1b0FhQm90RlAvClQyMEFBR2hwZFFRQUlOZ0FnR0FEZ0dBREFJSU5BQWcyQUFnMkFDRFlBSUJnQTRCZ0F3Q0NEUUNDRFFBSU5nQWcyQUFnMkFDQVlBTUEKZ2cwQWdnMEFDRFlBSU5nQUlOZ0FnR0FEZ0dBREFJSU5BQWcyQUFnMkFDRFlBSUJnQTRCZ0F3Q0NEUUNDRFFBSU5nQWcyQUFnMkFDQQpZQU1BZ2cwQWdnMEFDRFlBSU5nQUlOZ0FnR0FEZ0dBREFJSU5BQWcyQUFnMkFDRFlBSUJnQTRCZ0F3Q0NEUUNDRFFBSU5nQWcyQUFnCjJBQ0FZQU1BZ2cwQWdnMEFDRFlBSU5nQUlOZ0FnR0FEZ0dBREFJSU5BQWcyQUFnMkFDRFlBSUJnQTRCZ0F3Q0NEUUNDRFFBSU5nQWcKMkFBZzJBQ0FZQU1BZ2cwQWdnMEFDRFlBSU5nQUlOZ0FnR0FEZ0dBREFJSU5BQWcyQUFnMkFDRFlBSUJnQTRCZ0F3Q0NEUUNDRFFBSQpOZ0FnMkFBZzJBQ0FZQU1BZ2cwQWdnMEFDRFlBSU5nQUlOZ0FnR0FEZ0dBREFJSU5BQWcyQUFnMkFDRFlBSUJnQTRCZ0F3QmovQWd3CkFORU9LWDZMOHRLeUFBQUFBRWxGVGtTdVFtQ0MiIHRyYW5zZm9ybT0ibWF0cml4KDEgMCAwIDEgMzkuNSA4LjUpIj4NCgkJCQk8L2ltYWdlPg0KCQkJPC9nPg0KCQk8L2c+DQoJPC9nPg0KCTxnPg0KCQk8cG9seWdvbiBmaWxsPSIjRkZGRkZGIiBwb2ludHM9IjI0OS4zNTksMTE4LjY4OCAxMTAuNzM5LDI2Ni41MzUgMTE3LjcyNSwyNzMuMDg3IDI0OS4zMDQsMTMyLjc0MiAzNzcuOTMsMjcxLjk4NSANCgkJCTM4NC45NTgsMjY1LjQ4NyAJCSIvPg0KCQk8cG9seWdvbiBmaWxsPSIjRkZGRkZGIiBwb2ludHM9IjIwMi4zNTksMTQyLjAzNyAxNzkuMzcyLDE0Mi4wMzcgMTc5LjM3MiwxNzkuNTMgMTc5LjM3MiwxODIuMDY4IDIwMi4zNTksMTU4LjIxNCAJCSIvPg0KCQk8cmVjdCB4PSIyMzAuODcyIiB5PSIzNDUuNjE5IiBmaWxsPSIjRkZGRkZGIiB3aWR0aD0iMzMuOTU1IiBoZWlnaHQ9IjEwLjMzNCIvPg0KCQk8cGF0aCBmaWxsPSIjRkZGRkZGIiBkPSJNMTIwLjYzLDI5NC40MTRoMzIuNTM3djUxLjIwM2g3Ny43di0zOS4xMjNoMzMuOTU1djM5LjEyM2g4NC4zNjh2LTUxLjIwM2gyNS40MDZMMjQ5LjMyMywxNTcuNDg4DQoJCQlMMTIwLjYzLDI5NC40MTR6IE0yNDUuODk3LDI3My4xNTZoLTIwLjM1VjI1Mi44MWgyMC4zNVYyNzMuMTU2eiBNMjQ1Ljg5NywyNDkuMjc5aC0yMC4zNXYtMjAuMzQ2aDIwLjM1VjI0OS4yNzl6DQoJCQkgTTI0OS43NjksMjI4LjkzN2gyMC4zN3YyMC4zNDZoLTIwLjM2OUwyNDkuNzY5LDIyOC45MzdMMjQ5Ljc2OSwyMjguOTM3eiBNMjQ5Ljc2OSwyNTIuODA5aDIwLjM3djIwLjM0N2gtMjAuMzY5TDI0OS43NjksMjUyLjgwOQ0KCQkJTDI0OS43NjksMjUyLjgwOXoiLz4NCgk8L2c+DQo8L2c+DQo8L3N2Zz4NCg==",
                                    { size: iconSize });
                                if (result.Paging.TotalPages > 1) {
                                    alert("Warning, MAX Results reached");
                                }

                                listings.houses = [];
                                var geometryFactory = new jsts.geom.GeometryFactory();
                                result.Results.forEach(function(house) {
                                    if (netIntersection.intersects(geometryFactory.createPoint(
                                        new jsts.geom.Coordinate(house.Property.Address.Latitude,
                                            house.Property.Address.Longitude)))) {


                                        const matrixParms1 = {
                                            apikey: "5Sb54Nw_2WiakiQ7nrGy0-EvJj3YafztmbAucJIR_D4",
                                            mode: "fastest;car;traffic:enabled",
                                            waypoint0: `geo!${43.414421},${-80.286290}`,
                                            waypoint1: `geo!${house.Property.Address.Latitude},${house.Property.Address
                                                .Longitude}`,
                                            departure: "2015-04-22T18:00:00"
                                        };

                                        $.ajax({
                                            url: "https://route.ls.hereapi.com/routing/7.2/calculateroute.json",
                                            type: "GET",
                                            data: matrixParms1,
                                            dataType: "json",
                                            success: function(result2) {
                                                house.fromTravelTime = result2.response.route[0].summary.trafficTime;
                                                $scope.$digest();
                                            }
                                        });

                                        const matrixParms2 = {
                                            apikey: "5Sb54Nw_2WiakiQ7nrGy0-EvJj3YafztmbAucJIR_D4",
                                            mode: "fastest;car;traffic:enabled",
                                            waypoint0: `geo!${house.Property.Address.Latitude},${house.Property.Address
                                                .Longitude}`,
                                            waypoint1: `geo!${43.414421},${-80.286290}`,
                                            departure: "2015-04-22T08:30:00"
                                        };

                                        $.ajax({
                                            url: "https://route.ls.hereapi.com/routing/7.2/calculateroute.json",
                                            type: "GET",
                                            data: matrixParms2,
                                            dataType: "json",
                                            success: function(result2) {
                                                house.toTravelTime = result2.response.route[0].summary.trafficTime;
                                                $scope.$digest();
                                            }
                                        });

                                        listings.houses.push(house);
                                        houseMarkers.push(new H.map.Marker(
                                            new H.geo.Point(house.Property.Address.Latitude,
                                                house.Property.Address.Longitude),
                                            { icon: icon }));
                                    }
                                });
                                $scope.$digest();
                                map.addObjects(houseMarkers);
                                console.log(listings.houses);


                            }
                        });


                        cookieData =
                            "A@&@2015 - 5 - 10@$@http://www.realtor.ca/Map.aspx#CultureId=1&ApplicationId=1&RecordsPerPage=9&MaximumResults=9&PropertyTypeId=300&TransactionTypeId=2&SortOrder=A&SortBy=1&";
                        cookieData += `LongitudeMin=${maxmin.miny}&`;
                        cookieData += `LongitudeMax=${maxmin.maxy}&`;
                        cookieData += `LatitudeMin=${maxmin.minx}&`;
                        cookieData += `LatitudeMax=${maxmin.maxx}&`;
                        cookieData +=
                            "PriceMin=600000&PriceMax=800000&BuildingTypeId=1&ConstructionStyleId=3&BedRange=0-0&BathRange=0-0&ParkingSpaceRange=0-0&viewState=m&Longitude=-80.30859375&Latitude=43.426769256591&PolygonPoints=";
                        cookieData += alatlng.join(",");
                        cookieData += "&PolyZoomLevel=16@*@2015 - 5 - 10~";

                        intersectionPolygon = new H.map.Polygon(cords);
                        intersectionPolygon.setStyle({ fillColor: "rgba(255, 0, 0, 0.3)" });
                        map.addObject(intersectionPolygon);
                    }
                });
                //map.setViewBounds(isolinePolygon.getBounds());
            }

            var heremaps2JTS = function(boundaries) {
                var coordinates = [];

                boundaries.forEach(function(coords) {
                    const xy = coords.split(",");
                    coordinates.push(new jsts.geom.Coordinate(xy[0], xy[1]));
                });

                return coordinates;
            };

            var JTS2HereMaps = function(boundaries) {
                var strip = new H.geo.LineString();

                boundaries.forEach(function(coords) {
                    strip.pushLatLngAlt(coords.x, coords.y);
                });

                return strip;
            };

            // Add event listeners:
            map.addEventListener("tap",
                function(e) {

                    const coord = map.screenToGeo(e.currentPointer.viewportX,
                        e.currentPointer.viewportY);
                    // Create the parameters for the routing request:

                    //CalculateRouteOld(coord)
                    CalculateRoute(coord);
                });

            window.addEventListener("resize",
                function() {
                    map.getViewPort().resize();
                });

            searchBox.keypress(function(e) {
                if (e.which == 13) {
                    geocodingParameters = {
                        searchText: searchBox.val(),
                        jsonattributes: 1
                    };

                    geocoder.geocode(
                        geocodingParameters,
                        function(result) {
                            const locations = result.response.view[0].result;
                            addLocationsToMap(locations);
                        },
                        function(error) { alert(error) }
                    );
                }
            });

            searchButton.on("click",
                function() {

                    geocodingParameters = {
                        searchText: searchBox.val(),
                        jsonattributes: 1
                    };

                    geocoder.geocode(
                        geocodingParameters,
                        function(result) {
                            const locations = result.response.view[0].result;
                            addLocationsToMap(locations);
                        },
                        function(error) { alert(error) }
                    );

                });

            $("#copy-btn").on("click",
                function() {
                    $("#cookieText").text(cookieData);
                    $("#full-ui").css("display", "block");
                    $("#cookieText").select();
                });


            $("#close-btn").on("click",
                function() {
                    $("#full-ui").css("display", "none");
                });

            function addLocationsToMap(locations) {
                const group = new H.map.Group();
                var position,
                    i;

                // Add a marker for each location found
                for (i = 0; i < locations.length; i += 1) {
                    position = {
                        lat: locations[i].location.displayPosition.latitude,
                        lng: locations[i].location.displayPosition.longitude
                    };
                    marker = new H.map.Marker(position);
                    marker.label = locations[i].location.address.label;
                    group.addObject(marker);
                }

                group.addEventListener("tap",
                    function(evt) {
                        map.setCenter(evt.target.getPosition());
                        openBubble(
                            evt.target.getPosition(),
                            evt.target.label);
                    },
                    false);

                // Add the locations group to the map
                map.addObject(group);
                map.setCenter(group.getBounds().getCenter());
            }


        });