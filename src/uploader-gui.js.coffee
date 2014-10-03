class window.VideoUploaderGui
  constructor: (uploader, options={})->
    @uploader = uploader
    @options = options

    @addEventListeners()

  addEventListeners: ->
    @uploader.onSelect = (file)->
      fileName = window.truncate(file.name, 50)
      row = @uploadVideoTemplate.clone()
      row.attr("id", "upload-#{file.id}")
      row.find(".encode-title").text(fileName)

      cancel_link = row.find('.cancel-upload')
      cancel_link.show()
      cancel_link.click (e)=>
        e.preventDefault()

        if !confirm("Are you sure you want to cancel this upload?")
          return false
        @uploader.removeFile(file)
        @options.onUploadCancelled()
        @runNextUpload()

        self = this
        $(e.target).parents('.svi').fadeOut 'normal', ->
          $(this).remove()
          self.fileUploadButton.trigger('resize')

      @uploadVideoTemplate.after(row)
      row.addClass("uploading")
      row.show()
      row.trigger('resize')

    @uploader.onUploadProgress = (up, file)->
      percentage = file.percent
      speed      = up.total.bytesPerSec
      row = $("#upload-#{file.id}")
      if percentage >= 99
        statusText = "Finalizing upload"
      else
        if speed > 0 && averageSpeed = @averageUploadSpeed(file.id, speed)
          bytesRemaining = (file.size - file.loaded)
          secondsRemaining = bytesRemaining / averageSpeed
          statusText = "Uploading - #{@distanceOfTimeInWords(secondsRemaining)} remaining"
        else
          statusText = "Uploading"
      row.find(".status").html(statusText)
      progress_bar = row.find(".progress-bar-inner")
      targetWidth = Math.round(progress_bar.parent().width() * (percentage / 100))

      if (progress_bar.data('targetWidth') || 0) < targetWidth and !progress_bar.is(':animated')
        progress_bar.data('targetWidth', targetWidth)
        progress_bar.animate({
          width: targetWidth
        }, 500)

    @onSuccessfulFileUpload = (file, video)->
      row = $("#upload-#{file.id}")
      row.attr("data-video-id", responseJson.video.id)
      message = "Adding to encoding queue"


    @onFailedFileUpload = (file, response)->
      row = $("#upload-#{file.id}")
      row.find(".remove-from-list").show()
      message = "Upload failed - #{responseJson.error.details}"
      row.find('.progress-bar')
        .removeClass('animated')
        .addClass('transparent')
        .children()
          .fadeOut()
