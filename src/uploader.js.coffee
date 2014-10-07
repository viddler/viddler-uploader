class window.VideoUploader
  constructor: (options={})->
    @options = options

    @options.fileUploadButtonId     or= "file-upload-button"
    @options.buttonContainerId      or= "upload-button-container"
    @options.uploadMainPanelId      or= "upload-main-panel"

    @fileUploadButton       = $("##{@options.fileUploadButtonId}")
    @mainUploadPanel        = $("##{@options.uploadMainPanelId}")
    @uploadTokenAndEndpoint = {token: @fileUploadButton.attr("data-token"), endpoint: @fileUploadButton.attr("data-endpoint")}
    @getUploadTokenAndEndpointForNextRequest() unless @uploadTokenAndEndpoint.token
    @setupEvents()
    @initializeFileUpload()

    @tornDown = false
    @disabled = false
    @eventHandlers = {}

  setupEvents: ->
    @mainUploadPanel.bind 'dragover', =>
      @mainUploadPanel.addClass('dragover')
    @mainUploadPanel.bind 'dragleave drop', =>
      @mainUploadPanel.removeClass('dragover')

  initializeFileUpload: ->
    runtimes = 'html5,flash'
    @plupload = new plupload.Uploader
      runtimes : runtimes
      browse_button : @options.fileUploadButtonId
      container: @options.buttonContainerId
      #url: @uploadTokenAndEndpoint.endpoint
      url: 'http://temp'
      flash_swf_url: @fileUploadButton.data('swf-url')
      multipart: true
      multipart_params : {}
      drop_element: @options.uploadMainPanelId


    @plupload.init()

    @plupload.bind 'FilesAdded', (up, files)=>
      $.each files.reverse(), (i, file)=>
        # Do not allow uploads if disabled
        if @disabled
          @plupload.removeFile(file)
          return

        @trigger('select', [file])
      @plupload.start() if @uploadTokenAndEndpoint


    @plupload.bind 'BeforeUpload', (up, file)=>
      up.settings.url = @uploadTokenAndEndpoint.endpoint
      $.extend(up.settings.multipart_params, {uploadtoken: @uploadTokenAndEndpoint.token})
      @uploadTokenAndEndpoint = undefined
      @getUploadTokenAndEndpointForNextRequest()


    @plupload.bind 'UploadProgress', (up, file)=>
      @trigger('uploadProgress', [up, file])

    @plupload.bind 'FileUploaded', (up, file, responseObj)=>
      responseJson = JSON.parse(responseObj.response)

      if responseJson.video
        @trigger('successfulFileUpload', [file, responseJson.video])
      else
        @trigger('failedFileUpload', [file, responseJson])

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
    @getFreshUploadTokenAndEndpoint (details)=>
      @gettingSpareToken = false

  disableUploadButton: ->
    @disabled = true
    @fileUploadButton.addClass('disabled')

  reEnableUploadButton: ->
    @disabled = false
    @fileUploadButton.removeClass('disabled')

  # Cancel any existing uploads, stop any recurring processes
  tearDown: ->
    @plupload.destroy()

  # Register an event callback
  on: (eventName, callback)->
    @eventHandlers[eventName] ||= []
    @eventHandlers[eventName].push callback

  trigger: (eventName, params)->
    @eventHandlers[eventName] ||= []
    for callback in @eventHandlers[eventName]
      callback.apply(this, params)

