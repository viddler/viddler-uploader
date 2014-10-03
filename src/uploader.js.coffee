class window.VideoUploader
  constructor: (options={})->
    @options = options

    @options.fileUploadButtonId     or= "file-upload-button"
    @options.listingContainerId     or= "uploaded-videos-listing-container"
    @options.buttonContainerId      or= "upload-button-container"
    @options.uploadMainPanelId      or= "upload-main-panel"
    @options.postParams             or = {}
    @options.onSuccessfulFileUpload or= (file, video)->
    @options.onFailedFileUpload     or= (file, response)->
    @options.onUploadProgress       or= (up, file)->
    @options.onSelect               or= (file)->
    @options.onUploadCancelled      or= (row)->


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
    runtimes = 'html5,flash'
    @uploader = new plupload.Uploader
      runtimes : runtimes
      browse_button : @options.fileUploadButtonId
      container: @options.buttonContainerId
      #url: @uploadTokenAndEndpoint.endpoint
      url: 'http://temp'
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

        @options.onSelect(file)
      @uploader.start() if @uploadTokenAndEndpoint


    @uploader.bind 'BeforeUpload', (up, file)=>
      up.settings.url = @uploadTokenAndEndpoint.endpoint
      $.extend(up.settings.multipart_params, @options.postParams)
      $.extend(up.settings.multipart_params, {uploadtoken: @uploadTokenAndEndpoint.token})
      @uploadTokenAndEndpoint = undefined
      @getUploadTokenAndEndpointForNextRequest()


    @uploader.bind 'UploadProgress', (up, file)=>
      @options.onUploadProgress(up, file)

    @uploader.bind 'FileUploaded', (up, file, responseObj)=>
      responseJson = JSON.parse(responseObj.response)

      if responseJson.video
        @options.onSuccessfulFileUpload(file, responseJson.video)
      else
        @options.onFailedFileUpload(file, responseJson)

      @runNextUpload()


  runNextUpload: ->
    # Stop the uploader and make sure we have another token ready and then start again
    @uploader.stop()
    @getUploadTokenAndEndpoint (details)=>
      @uploader.start()


  getFreshUploadTokenAndEndpoint: (callback)->
    url = "#{@options.apiEndPoint}?action=prepareUpload&nocache=#{Math.random()}"
    $.getJSON url, (details)=>
      @uploadTokenAndEndpoint = details.upload
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
