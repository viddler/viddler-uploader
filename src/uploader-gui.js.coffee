class window.ViddlerVideoUploaderGui
  constructor: (options={})->
    @uploader = options.uploader
    @options = options

    @options.listingContainerId     or= "uploaded-videos-listing-container"
    @uploadVideoTemplate    = $( $(JST['src/templates.html']()).html() )

    @averageUploadSpeedData = {}

    @addEventListeners()

    if @options.warnOnNavigateAwayWhenActiveUploads
      @setupNavigateAwayWarning()

  addEventListeners: ->
    $(document).on "click", ".remove-from-list", (e)->
      e.preventDefault()
      row = $(this).parents(".video-upload-row")
      row.hide("slow")

    @uploader.on 'select', (file)=>
      fileName = @truncate(file.name, 50)
      row = @uploadVideoTemplate.clone()
      row.attr("id", "upload-#{file.id}")
      row.find(".encode-title").text(fileName)

      cancel_link = row.find('.cancel-upload')
      cancel_link.show()
      cancel_link.click (e)=>
        e.preventDefault()

        if !confirm("Are you sure you want to cancel this upload?")
          return false
        @uploader.plupload.removeFile(file)
        @uploader.trigger('uploadCancelled', file)

        self = this
        $(e.target).parents('.video-upload-row').fadeOut 'normal', ->
          $(this).remove()
          self.uploader.fileUploadButton.trigger('resize')

      $('#' + @options.listingContainerId).append(row)
      row.addClass("uploading")
      row.show()
      row.trigger('resize')

    @uploader.on 'uploadProgress', (up, file)=>
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

      if (progress_bar.data('targetWidth') || 0) < targetWidth
        progress_bar.data('targetWidth', targetWidth)
        progress_bar.animate({
          width: targetWidth
        }, 100)

    @uploader.on 'successfulFileUpload', (file, video)=>
      row = $("#upload-#{file.id}")
      row.attr("data-video-id", video.id)
      message = "Upload Complete"
      row.find(".status").html(message)
      row.find('.cancel-upload').hide()


    @uploader.on 'failedFileUpload', (file, response, pluploadMessage)->
      row = $("#upload-#{file.id}")
      if(response && response.error)
        message = "Upload failed - #{response.error.details}"
      else
        message = "Upload failed - #{pluploadMessage}"
      row.find('.progress-bar-inner').width('0%')
      row.find(".status").html(message)

  distanceOfTimeInWords: (seconds)->
    if seconds < 60
      unit = "second"
      value = seconds
    else if seconds < 3600
      unit = "minute"
      value = seconds / 60
    else
      unit = "hour"
      value = seconds / 60 / 60
    value = Math.round(value)
    string = "#{value} #{unit}"
    string += "s" unless value == 1
    return string

  truncate: (text, limit)->
    if (text.length > limit)
      text = text.substr(0, limit - 3) + "..."
    text



  # Because the seconds remaining for an upload jumps radically in both directions as
  # speed changes, this function records the n previous values and gives a more averaged out value
  # so the progress has a more steady feel to it.
  averageUploadSpeed: (uploadId, currentSpeed)->
    values = @averageUploadSpeedData[uploadId] or= []
    values.shift() if values.length > 20
    values.push(currentSpeed)
    if values.length > 5
      @mean(values)
    else
      return null

  mean: (array)->
    return 0 if array.length is 0
    sum = array.reduce (s,i) -> s += i
    sum / array.length

  setupNavigateAwayWarning: ->
    window.onbeforeunload = =>
      if @uploader.plupload.total.queued > 0
        return "You have uploads in progress that will be cancelled if you leave this page. Are you sure you want to navigate away?"
