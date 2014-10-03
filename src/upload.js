(function() {
  window.VideoUploader = (function() {
    function VideoUploader(options) {
      var _base, _base1, _base2, _base3, _base4, _base5, _base6, _base7, _base8, _base9;
      if (options == null) {
        options = {};
      }
      this.options = options;
      (_base = this.options).fileUploadButtonId || (_base.fileUploadButtonId = "file-upload-button");
      (_base1 = this.options).listingContainerId || (_base1.listingContainerId = "uploaded-videos-listing-container");
      (_base2 = this.options).buttonContainerId || (_base2.buttonContainerId = "upload-button-container");
      (_base3 = this.options).uploadMainPanelId || (_base3.uploadMainPanelId = "upload-main-panel");
      (_base4 = this.options).postParams || (_base4.postParams = {});
      (_base5 = this.options).onSuccessfulFileUpload || (_base5.onSuccessfulFileUpload = function(file, video) {});
      (_base6 = this.options).onFailedFileUpload || (_base6.onFailedFileUpload = function(file, response) {});
      (_base7 = this.options).onUploadProgress || (_base7.onUploadProgress = function(up, file) {});
      (_base8 = this.options).onSelect || (_base8.onSelect = function(file) {});
      (_base9 = this.options).onUploadCancelled || (_base9.onUploadCancelled = function(row) {});
      this.uploadVideoTemplate = $("#" + this.options.listingContainerId + " .upload-video-template");
      this.fileUploadButton = $("#" + this.options.fileUploadButtonId);
      this.mainUploadPanel = $("#" + this.options.uploadMainPanelId);
      this.uploadTokenAndEndpoint = {
        token: this.fileUploadButton.attr("data-token"),
        endpoint: this.fileUploadButton.attr("data-endpoint")
      };
      if (!this.uploadTokenAndEndpoint.token) {
        this.getUploadTokenAndEndpointForNextRequest();
      }
      this.averageUploadSpeedData = {};
      this.setupEvents();
      this.initializeFileUpload();
      this.tornDown = false;
      this.disabled = false;
    }

    VideoUploader.prototype.setupEvents = function() {
      $(document).on("click", ".remove-from-list", function(e) {
        var removedIds, row;
        e.preventDefault();
        row = $(this).parents(".svi");
        if (row.data('encode')) {
          removedIds = $.jStorage.get("upload:removed-encode-ids", []);
          removedIds.push(row.data('encode').encode_id);
          $.jStorage.set("upload:removed-encode-ids", removedIds);
          $.jStorage.setTTL("mykey", 345600000);
        }
        return row.hide("slow");
      });
      this.mainUploadPanel.bind('dragover', (function(_this) {
        return function() {
          return _this.mainUploadPanel.addClass('dragover');
        };
      })(this));
      return this.mainUploadPanel.bind('dragleave drop', (function(_this) {
        return function() {
          return _this.mainUploadPanel.removeClass('dragover');
        };
      })(this));
    };

    VideoUploader.prototype.initializeFileUpload = function() {
      var runtimes;
      runtimes = 'html5,flash';
      this.uploader = new plupload.Uploader({
        runtimes: runtimes,
        browse_button: this.options.fileUploadButtonId,
        container: this.options.buttonContainerId,
        url: 'http://temp',
        flash_swf_url: this.fileUploadButton.data('swf-url'),
        multipart: true,
        multipart_params: {},
        drop_element: this.options.uploadMainPanelId
      });
      this.uploader.init();
      this.uploader.bind('FilesAdded', (function(_this) {
        return function(up, files) {
          $.each(files.reverse(), function(i, file) {
            if (_this.disabled) {
              _this.uploader.removeFile(file);
              return;
            }
            return _this.options.onSelect(file);
          });
          if (_this.uploadTokenAndEndpoint) {
            return _this.uploader.start();
          }
        };
      })(this));
      this.uploader.bind('BeforeUpload', (function(_this) {
        return function(up, file) {
          up.settings.url = _this.uploadTokenAndEndpoint.endpoint;
          $.extend(up.settings.multipart_params, _this.options.postParams);
          $.extend(up.settings.multipart_params, {
            uploadtoken: _this.uploadTokenAndEndpoint.token
          });
          _this.uploadTokenAndEndpoint = void 0;
          return _this.getUploadTokenAndEndpointForNextRequest();
        };
      })(this));
      this.uploader.bind('UploadProgress', (function(_this) {
        return function(up, file) {
          return _this.options.onUploadProgress(up, file);
        };
      })(this));
      return this.uploader.bind('FileUploaded', (function(_this) {
        return function(up, file, responseObj) {
          var responseJson;
          responseJson = JSON.parse(responseObj.response);
          if (responseJson.video) {
            _this.options.onSuccessfulFileUpload(file, responseJson.video);
          } else {
            _this.options.onFailedFileUpload(file, responseJson);
          }
          return _this.runNextUpload();
        };
      })(this));
    };

    VideoUploader.prototype.runNextUpload = function() {
      this.uploader.stop();
      return this.getUploadTokenAndEndpoint((function(_this) {
        return function(details) {
          return _this.uploader.start();
        };
      })(this));
    };

    VideoUploader.prototype.getFreshUploadTokenAndEndpoint = function(callback) {
      var url;
      url = "" + this.options.apiEndPoint + "?action=prepareUpload&nocache=" + (Math.random());
      return $.getJSON(url, (function(_this) {
        return function(details) {
          _this.uploadTokenAndEndpoint = details.upload;
          return callback(details);
        };
      })(this));
    };

    VideoUploader.prototype.getUploadTokenAndEndpoint = function(callback) {
      if (this.uploadTokenAndEndpoint && this.uploadTokenAndEndpoint.token) {
        return callback(this.uploadTokenAndEndpoint);
      } else {
        return this.getFreshUploadTokenAndEndpoint(callback);
      }
    };

    VideoUploader.prototype.getUploadTokenAndEndpointForNextRequest = function() {
      if (this.gettingSpareToken) {
        return;
      }
      this.gettingSpareToken = true;
      return this.getFreshUploadTokenAndEndpoint(function(details) {
        return this.gettingSpareToken = false;
      });
    };

    VideoUploader.prototype.disableUploadButton = function() {
      this.disabled = true;
      return this.fileUploadButton.addClass('disabled');
    };

    VideoUploader.prototype.reEnableUploadButton = function() {
      this.disabled = false;
      return this.fileUploadButton.removeClass('disabled');
    };

    VideoUploader.prototype.distanceOfTimeInWords = function(seconds) {
      var string, unit, value;
      if (seconds < 60) {
        unit = "second";
        value = seconds;
      } else if (seconds < 3600) {
        unit = "minute";
        value = seconds / 60;
      } else {
        unit = "hour";
        value = seconds / 60 / 60;
      }
      value = Math.round(value);
      string = "" + value + " " + unit;
      if (value !== 1) {
        string += "s";
      }
      return string;
    };

    VideoUploader.prototype.averageUploadSpeed = function(uploadId, currentSpeed) {
      var values, _base;
      values = (_base = this.averageUploadSpeedData)[uploadId] || (_base[uploadId] = []);
      if (values.length > 20) {
        values.shift();
      }
      values.push(currentSpeed);
      if (values.length > 5) {
        return values.avg();
      } else {
        return null;
      }
    };

    VideoUploader.prototype.tearDown = function() {
      return this.uploader.destroy();
    };

    return VideoUploader;

  })();

}).call(this);
