(function() {
  window.VideoUploaderGui = (function() {
    function VideoUploaderGui(options) {
      var _base, _base1;
      if (options == null) {
        options = {};
      }
      this.uploader = options.uploader;
      this.options = options;
      (_base = this.options).onUploadCancelled || (_base.onUploadCancelled = function() {});
      (_base1 = this.options).listingContainerId || (_base1.listingContainerId = "uploaded-videos-listing-container");
      this.uploadVideoTemplate = $("#" + this.options.listingContainerId + " .upload-video-template");
      this.averageUploadSpeedData = {};
      this.addEventListeners();
    }

    VideoUploaderGui.prototype.addEventListeners = function() {
      $(document).on("click", ".remove-from-list", function(e) {
        var row;
        e.preventDefault();
        row = $(this).parents(".video-upload-row");
        return row.hide("slow");
      });
      this.uploader.options.onSelect = (function(_this) {
        return function(file) {
          var cancel_link, fileName, row;
          fileName = _this.truncate(file.name, 50);
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
            _this.uploader.plupload.removeFile(file);
            _this.options.onUploadCancelled();
            _this.uploader.runNextUpload();
            self = _this;
            return $(e.target).parents('.video-upload-row').fadeOut('normal', function() {
              $(this).remove();
              return self.uploader.fileUploadButton.trigger('resize');
            });
          });
          _this.uploadVideoTemplate.after(row);
          row.addClass("uploading");
          row.show();
          return row.trigger('resize');
        };
      })(this);
      this.uploader.options.onUploadProgress = (function(_this) {
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
          progress_bar = row.find(".progress-bar");
          targetWidth = Math.round(progress_bar.parent().width() * (percentage / 100));
          if ((progress_bar.data('targetWidth') || 0) < targetWidth) {
            progress_bar.data('targetWidth', targetWidth);
            return progress_bar.animate({
              width: targetWidth
            }, 100);
          }
        };
      })(this);
      this.uploader.options.onSuccessfulFileUpload = (function(_this) {
        return function(file, video) {
          var message, row;
          row = $("#upload-" + file.id);
          row.attr("data-video-id", video.id);
          message = "Upload Complete";
          row.find(".status").html(message);
          return row.find('.cancel-upload').hide();
        };
      })(this);
      return this.uploader.options.onFailedFileUpload = function(file, response) {
        var message, row;
        row = $("#upload-" + file.id);
        message = "Upload failed - " + response.error.details;
        row.find('.progress-bar').width('0%');
        return row.find(".status").html(message);
      };
    };

    VideoUploaderGui.prototype.distanceOfTimeInWords = function(seconds) {
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

    VideoUploaderGui.prototype.truncate = function(text, limit) {
      if (text.length > limit) {
        text = text.substr(0, limit - 3) + "...";
      }
      return text;
    };

    VideoUploaderGui.prototype.averageUploadSpeed = function(uploadId, currentSpeed) {
      var values, _base;
      values = (_base = this.averageUploadSpeedData)[uploadId] || (_base[uploadId] = []);
      if (values.length > 20) {
        values.shift();
      }
      values.push(currentSpeed);
      if (values.length > 5) {
        return this.mean(values);
      } else {
        return null;
      }
    };

    VideoUploaderGui.prototype.mean = function(array) {
      var sum;
      if (array.length === 0) {
        return 0;
      }
      sum = array.reduce(function(s, i) {
        return s += i;
      });
      return sum / array.length;
    };

    return VideoUploaderGui;

  })();

}).call(this);
