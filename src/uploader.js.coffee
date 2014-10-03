class window.VideoUploader
  constructor: (options={})->
    @options = options

    @options.fileUploadButtonId     or= "file-upload-button"
    @options.listingContainerId     or= "uploaded-videos-listing-container"
    @options.buttonContainerId      or= "upload-button-container"
    @options.uploadMainPanelId      or= "upload-main-panel"
    @options.allow_replace          ?= false
    @options.postParams             or = {}
    @options.onSuccessfulFileUpload or= (row, video)->
    @options.onSelect               or= ()->
    @options.onUploadCancelled      or= (row)->
    @options.onUploadComplete       or= (row)->


    @uploadVideoTemplate    = $("##{@options.listingContainerId} .upload-video-template")
    @fileUploadButton       = $("##{@options.fileUploadButtonId}")
    @mainUploadPanel        = $("##{@options.uploadMainPanelId}")
    @uploadTokenAndEndpoint = {token: @fileUploadButton.attr("data-token"), endpoint: @fileUploadButton.attr("data-endpoint")}
    @getUploadTokenAndEndpointForNextRequest() unless @uploadTokenAndEndpoint.token
    @averageUploadSpeedData = {}
    @setupEvents()
    @initializeFileUpload()

    @tornDown = false
    @disabled = false

  setupEvents: ->
    $(document).on "click", ".remove-from-list", (e)->
      e.preventDefault()
      row = $(this).parents(".svi")
      if row.data('encode')
        removedIds = $.jStorage.get("upload:removed-encode-ids", [])
        removedIds.push(row.data('encode').encode_id)
        $.jStorage.set("upload:removed-encode-ids", removedIds)
        $.jStorage.setTTL("mykey", 345600000)
      row.hide("slow")

    @mainUploadPanel.bind 'dragover', =>
      @mainUploadPanel.addClass('dragover')
    @mainUploadPanel.bind 'dragleave drop', =>
      @mainUploadPanel.removeClass('dragover')

  initializeFileUpload: ->
    runtimes = $.QueryString.runtime || 'html5,flash'
    @uploader = new plupload.Uploader
      runtimes : runtimes
      browse_button : @options.fileUploadButtonId
      container: @options.buttonContainerId
      url: @uploadTokenAndEndpoint.endpoint
      flash_swf_url: @fileUploadButton.data('swf-url')
      multipart: true
      multipart_params : {}
      drop_element: @options.uploadMainPanelId

    @uploader.init()

    @uploader.bind 'FilesAdded', (up, files)=>
      $.each files.reverse(), (i, file)=>
        # Do not allow uploads if disabled
        if @disabled
          @uploader.removeFile(file)
          return

        @options.onSelect()
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
      @uploader.start() if @uploadTokenAndEndpoint


    @uploader.bind 'BeforeUpload', (up, file)=>
      up.settings.url = @uploadTokenAndEndpoint.endpoint
      $.extend(up.settings.multipart_params, @options.postParams)
      $.extend(up.settings.multipart_params, {uploadtoken: @uploadTokenAndEndpoint.token})
      @uploadTokenAndEndpoint = undefined
      @getUploadTokenAndEndpointForNextRequest()


    @uploader.bind 'UploadProgress', (up, file)=>
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

    @uploader.bind 'FileUploaded', (up, file, responseObj)=>
      responseJson = JSON.parse(responseObj.response)
      row = $("#upload-#{file.id}")
      if responseJson.video
        row.attr("data-video-id", responseJson.video.id)
        message = "Adding to encoding queue"
      else
        row.find(".remove-from-list").show()
        message = "Upload failed - #{responseJson.error.details}"
        row.find('.progress-bar')
          .removeClass('animated')
          .addClass('transparent')
          .children()
            .fadeOut()

      row.find(".status").html(message)
      row.find(".cancel-upload").hide()
      row.addClass("completed")
      row.removeClass("uploading")

      @options.onUploadComplete(row)
      @options.onSuccessfulFileUpload(row, responseJson.video) if responseJson.video
      @runNextUpload()


  runNextUpload: ->
    # Stop the uploader and make sure we have another token ready and then start again
    @uploader.stop()
    @getUploadTokenAndEndpoint (details)=>
      @uploader.start()


  getFreshUploadTokenAndEndpoint: (callback)->
    url = "/upload/new.json?nocache=#{Math.random()}&allow_replace=#{@options.allow_replace}"
    $.getJSON url, (details)=>
      @uploadTokenAndEndpoint = details
      callback(details)

  # Gets a token the fastest way possible (either a variable we stored earlier, else a fresh one.
  # Then call the callback with the token
  getUploadTokenAndEndpoint: (callback)->
    if @uploadTokenAndEndpoint && @uploadTokenAndEndpoint.token
      callback(@uploadTokenAndEndpoint)
    else
      @getFreshUploadTokenAndEndpoint(callback)

  getUploadTokenAndEndpointForNextRequest: ->
    return if @gettingSpareToken
    @gettingSpareToken = true
    @getFreshUploadTokenAndEndpoint (details)->
      @gettingSpareToken = false

  disableUploadButton: ->
    @disabled = true
    @fileUploadButton.addClass('disabled')

  reEnableUploadButton: ->
    @disabled = false
    @fileUploadButton.removeClass('disabled')

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

  # Because the seconds remaining for an upload jumps radically in both directions as
  # speed changes, this function records the n previous values and gives a more averaged out value
  # so the progress has a more steady feel to it.
  averageUploadSpeed: (uploadId, currentSpeed)->
    values = this.averageUploadSpeedData[uploadId] or= []
    values.shift() if values.length > 20
    values.push(currentSpeed)
    if values.length > 5
      values.avg()
    else
      return null

  # Cancel any existing uploads, stop any recurring processes
  tearDown: ->
    @uploader.destroy()
