(function() {
  window.VideoUploader = (function() {
    function VideoUploader(options) {
      var _base, _base1, _base2, _base3, _base4, _base5, _base6, _base7;
      if (options == null) {
        options = {};
      }
      this.options = options;
      (_base = this.options).fileUploadButtonId || (_base.fileUploadButtonId = "file-upload-button");
      (_base1 = this.options).buttonContainerId || (_base1.buttonContainerId = "upload-button-container");
      (_base2 = this.options).uploadMainPanelId || (_base2.uploadMainPanelId = "upload-main-panel");
      (_base3 = this.options).onSuccessfulFileUpload || (_base3.onSuccessfulFileUpload = function(file, video) {});
      (_base4 = this.options).onFailedFileUpload || (_base4.onFailedFileUpload = function(file, response) {});
      (_base5 = this.options).onUploadProgress || (_base5.onUploadProgress = function(up, file) {});
      (_base6 = this.options).onSelect || (_base6.onSelect = function(file) {});
      (_base7 = this.options).onUploadCancelled || (_base7.onUploadCancelled = function(row) {});
      this.fileUploadButton = $("#" + this.options.fileUploadButtonId);
      this.mainUploadPanel = $("#" + this.options.uploadMainPanelId);
      this.uploadTokenAndEndpoint = {
        token: this.fileUploadButton.attr("data-token"),
        endpoint: this.fileUploadButton.attr("data-endpoint")
      };
      if (!this.uploadTokenAndEndpoint.token) {
        this.getUploadTokenAndEndpointForNextRequest();
      }
      this.setupEvents();
      this.initializeFileUpload();
      this.tornDown = false;
      this.disabled = false;
    }

    VideoUploader.prototype.setupEvents = function() {
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
      this.plupload = new plupload.Uploader({
        runtimes: runtimes,
        browse_button: this.options.fileUploadButtonId,
        container: this.options.buttonContainerId,
        url: 'http://temp',
        flash_swf_url: this.fileUploadButton.data('swf-url'),
        multipart: true,
        multipart_params: {},
        drop_element: this.options.uploadMainPanelId
      });
      this.plupload.init();
      this.plupload.bind('FilesAdded', (function(_this) {
        return function(up, files) {
          $.each(files.reverse(), function(i, file) {
            if (_this.disabled) {
              _this.plupload.removeFile(file);
              return;
            }
            return _this.options.onSelect(file);
          });
          if (_this.uploadTokenAndEndpoint) {
            return _this.plupload.start();
          }
        };
      })(this));
      this.plupload.bind('BeforeUpload', (function(_this) {
        return function(up, file) {
          up.settings.url = _this.uploadTokenAndEndpoint.endpoint;
          $.extend(up.settings.multipart_params, {
            uploadtoken: _this.uploadTokenAndEndpoint.token
          });
          _this.uploadTokenAndEndpoint = void 0;
          return _this.getUploadTokenAndEndpointForNextRequest();
        };
      })(this));
      this.plupload.bind('UploadProgress', (function(_this) {
        return function(up, file) {
          return _this.options.onUploadProgress(up, file);
        };
      })(this));
      return this.plupload.bind('FileUploaded', (function(_this) {
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
      this.plupload.stop();
      return this.getUploadTokenAndEndpoint((function(_this) {
        return function(details) {
          return _this.plupload.start();
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
      return this.getFreshUploadTokenAndEndpoint((function(_this) {
        return function(details) {
          return _this.gettingSpareToken = false;
        };
      })(this));
    };

    VideoUploader.prototype.disableUploadButton = function() {
      this.disabled = true;
      return this.fileUploadButton.addClass('disabled');
    };

    VideoUploader.prototype.reEnableUploadButton = function() {
      this.disabled = false;
      return this.fileUploadButton.removeClass('disabled');
    };

    VideoUploader.prototype.tearDown = function() {
      return this.plupload.destroy();
    };

    return VideoUploader;

  })();

}).call(this);
