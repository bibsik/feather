﻿; (function () {

    /*
     * Libraries service provides services for working with images, documents and videos in Sitefinity.
     */
    var librariesService = angular.module('sfLibrariesService', ['services']);

    /*
     * Image Service provides functionality for working with Sitefinity Images.
     */
    librariesService.factory('sfImageService', ['$http', '$interpolate', '$q', function ($http, $interpolate, $q) {

        var emptyGuid = '00000000-0000-0000-0000-000000000000',
            defaultAlbumId = '4ba7ad46-f29b-4e65-be17-9bf7ce5ba1fb', // TODO: hardcoded until I make album selector
            uploadUrl = '/Telerik.Sitefinity.Html5UploadHandler.ashx',
            imageUrl = '/Sitefinity/Services/Content/ImageService.svc/parent/{{libraryId}}/{{itemId}}/?itemType={{itemType}}&provider={{provider}}&parentItemType={{parentItemType}}&newParentId={{newParentId}}',
            imageItemType = 'Telerik.Sitefinity.Libraries.Model.Image',
            albumItemType = 'Telerik.Sitefinity.Libraries.Model.Album';

        // generates the url for the image service for a specific image
        var imageServiceUrl = function (file) {

            var settings = {
                libraryId: defaultAlbumId,
                itemId: emptyGuid,
                itemType: imageItemType,
                provider: '',
                parentItemType: albumItemType,
                newParentId: defaultAlbumId
            };

            return $interpolate(imageUrl)(settings);

        };

        // creates a new Sitefinity image content item
        var createImage = function (file) {

            var now = new Date(),
                url = imageServiceUrl(file),
                image = {
                    Item: {
                        Title: {
                            PersistedValue : file.name,
                            Value : file.name
                        },
                        DateCreated: now.toWcfDate(),
                        PublicationDate: now.toWcfDate(),
                        LastModified: now.toWcfDate()
                    }
                };

            return $http.put(url, image);
        };

        var service = {

            upload: function (file) {

                var deferred = $q.defer();

                var uploadFile = function (content) {

                    var formData = new FormData();
                    formData.append('ContentType', imageItemType);
                    formData.append('LibraryId', defaultAlbumId);
                    formData.append('ContentId', content.Item.Id);
                    formData.append('Workflow', 'Upload');
                    formData.append('ProviderName', ''); // TODO: implement this once you have provider selector
                    formData.append('SkipWorkflow', 'true');
                    formData.append('ImageFile', file);
                    
                    var xhr = new XMLHttpRequest();

                    xhr.onload = function (e) {
                        if (xhr.readyState === 4) {
                            if (xhr.status === 200) {
                                deferred.resolve(JSON.parse(xhr.responseText)[0]);
                            } else {
                                deferred.reject(xhr.statusText);
                            }
                        }
                    };

                    xhr.upload.onprogress = function (e) {
                        var done = e.position || e.loaded,
                            total = e.totalSize || e.total,
                            present = Math.floor(done / total * 100);
                        deferred.notify(present);
                    };

                    xhr.onerror = function (e) {
                        deferred.reject(xhr.statusText);
                    };

                    xhr.open('POST', uploadUrl);
                    xhr.send(formData);
                };

                createImage(file)
                    .success(function (data) {
                        uploadFile(data);
                    })
                    .error(function () {
                        console.log('Image creation error!');
                    });

                return deferred.promise;
            },

            get: function () {

            }

        };

        return service;

    }]);

}());