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
      if ((_base4 = this.options).allow_replace == null) {
        _base4.allow_replace = false;
      }
      (_base5 = this.options).postParams || (_base5.postParams = {});
      (_base6 = this.options).onSuccessfulFileUpload || (_base6.onSuccessfulFileUpload = function(row, video) {});
      (_base7 = this.options).onSelect || (_base7.onSelect = function() {});
      (_base8 = this.options).onUploadCancelled || (_base8.onUploadCancelled = function(row) {});
      (_base9 = this.options).onUploadComplete || (_base9.onUploadComplete = function(row) {});
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
        url: this.uploadTokenAndEndpoint.endpoint,
        flash_swf_url: this.fileUploadButton.data('swf-url'),
        multipart: true,
        multipart_params: {},
        drop_element: this.options.uploadMainPanelId
      });
      this.uploader.init();
      this.uploader.bind('FilesAdded', (function(_this) {
        return function(up, files) {
          $.each(files.reverse(), function(i, file) {
            var cancel_link, fileName, row;
            if (_this.disabled) {
              _this.uploader.removeFile(file);
              return;
            }
            _this.options.onSelect();
            fileName = window.truncate(file.name, 50);
            row = _this.uploadVideoTemplate.clone();
            row.attr("id", "upload-" + file.id);
            row.find(".encode-title").text(fileName);
            cancel_link = row.find('.cancel-upload');
            cancel_link.show();
            cancel_link.click(function(e) {
              var self;
              e.preventDefault();
              if (!confirm("Are you sure you want to cancel this upload?")) {
                return false;
              }
              _this.uploader.removeFile(file);
              _this.options.onUploadCancelled();
              _this.runNextUpload();
              self = _this;
              return $(e.target).parents('.svi').fadeOut('normal', function() {
                $(this).remove();
                return self.fileUploadButton.trigger('resize');
              });
            });
            _this.uploadVideoTemplate.after(row);
            row.addClass("uploading");
            row.show();
            return row.trigger('resize');
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
          var averageSpeed, bytesRemaining, percentage, progress_bar, row, secondsRemaining, speed, statusText, targetWidth;
          percentage = file.percent;
          speed = up.total.bytesPerSec;
          row = $("#upload-" + file.id);
          if (percentage >= 99) {
            statusText = "Finalizing upload";
          } else {
            if (speed > 0 && (averageSpeed = _this.averageUploadSpeed(file.id, speed))) {
              bytesRemaining = file.size - file.loaded;
              secondsRemaining = bytesRemaining / averageSpeed;
              statusText = "Uploading - " + (_this.distanceOfTimeInWords(secondsRemaining)) + " remaining";
            } else {
              statusText = "Uploading";
            }
          }
          row.find(".status").html(statusText);
          progress_bar = row.find(".progress-bar-inner");
          targetWidth = Math.round(progress_bar.parent().width() * (percentage / 100));
          if ((progress_bar.data('targetWidth') || 0) < targetWidth && !progress_bar.is(':animated')) {
            progress_bar.data('targetWidth', targetWidth);
            return progress_bar.animate({
              width: targetWidth
            }, 500);
          }
        };
      })(this));
      return this.uploader.bind('FileUploaded', (function(_this) {
        return function(up, file, responseObj) {
          var message, responseJson, row;
          responseJson = JSON.parse(responseObj.response);
          row = $("#upload-" + file.id);
          if (responseJson.video) {
            row.attr("data-video-id", responseJson.video.id);
            message = "Adding to encoding queue";
          } else {
            row.find(".remove-from-list").show();
            message = "Upload failed - " + responseJson.error.details;
            row.find('.progress-bar').removeClass('animated').addClass('transparent').children().fadeOut();
          }
          row.find(".status").html(message);
          row.find(".cancel-upload").hide();
          row.addClass("completed");
          row.removeClass("uploading");
          _this.options.onUploadComplete(row);
          if (responseJson.video) {
            _this.options.onSuccessfulFileUpload(row, responseJson.video);
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
      url = "/upload/new.json?nocache=" + (Math.random()) + "&allow_replace=" + this.options.allow_replace;
      return $.getJSON(url, (function(_this) {
        return function(details) {
          _this.uploadTokenAndEndpoint = details;
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
